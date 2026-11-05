import fs from 'fs';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import geminiService from '../services/geminiService.js';
import { buildKnowledgeContext, searchKnowledgeBase } from '../services/knowledgeBaseService.js';

/*
 * Repair assistant.
 * Every reply has the same short, structured shape so the UI can lay it out cleanly:
 *   { summary, points: string[], caution: string|null, sources: [{ title, page }], text }
 * `text` is a plain-text version of the same answer for older clients.
 */

const MAX_POINTS = 4;

/** How long to wait for Gemini before answering from the local repair guides instead. */
const AI_TIMEOUT_MS = 40000;

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

/** Removes Markdown the model sometimes adds anyway (**bold**, * bullets, # headings, `code`). */
const plain = (value) =>
  String(value ?? '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^\s*(?:[*\-•]|#{1,6}|\d+[.)])\s+/gm, '')
    .replace(/[*_]{1,2}/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Cuts text to roughly `maxWords`, ending on a full stop where possible. */
const clip = (value, maxWords) => {
  const words = plain(value).split(' ').filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  const cut = words.slice(0, maxWords).join(' ');
  const stop = cut.lastIndexOf('. ');
  return stop > cut.length * 0.5 ? cut.slice(0, stop + 1) : `${cut.replace(/[,;:]$/, '')}…`;
};

const toText = ({ summary, points, caution }) =>
  [summary, ...points.map((p) => `• ${p}`), caution ? `Caution: ${caution}` : ''].filter(Boolean).join('\n');

const buildReply = ({ summary, points = [], caution = null, sources = [] }) => {
  const reply = {
    summary: clip(summary, 45),
    points: points.map((p) => clip(p, 30)).filter(Boolean).slice(0, MAX_POINTS),
    caution: caution ? clip(caution, 28) : null,
    sources,
  };
  return { ...reply, text: toText(reply) };
};

const articleSources = (articles) =>
  articles.map((a) => ({ title: a.source || a.title, page: a.page || a.title }));

/** First few sentences of a knowledge-base article, as bullet points. */
const sentences = (text) =>
  String(text || '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

/** Offline answer from the local repair-guide articles (used when Gemini is unavailable). */
const buildKnowledgeReply = (message) => {
  const matches = searchKnowledgeBase(message, 3);
  if (!matches.length) {
    return buildReply({
      summary:
        'I don’t have a repair guide that covers this yet. Ask the shop to explain the fault, the exact part they will use, and the warranty on the repair.',
      points: [
        'Ask whether the replacement part is original (OEM) or third-party.',
        'Get the full price in writing, including labour and GST.',
        'If the repair costs more than half the price of a new device, compare it with replacing.',
      ],
    });
  }
  const top = matches[0];
  return buildReply({
    summary: top.summary,
    points: sentences(top.content).slice(0, 3),
    sources: articleSources(matches.slice(0, 2)),
  });
};

/** Without AI the photo can't be looked at, so say so instead of pretending. */
const withPhotoNote = (reply, photoCount) =>
  photoCount
    ? buildReply({
        ...reply,
        caution: 'I couldn’t analyse your photo right now, so this answer is based on your question only. Try again shortly.',
      })
    : reply;

const askGemini = async (message, deviceContext, articles, photoPaths = [], history = []) => {
  const guidance = articles.length ? buildKnowledgeContext(message, 3) : 'No matching repair guide.';
  const prompt = `
    You are the ReLife-Spark repair assistant. You help people in India decide about repairing phones, tablets,
    laptops, computers, smartwatches, headphones, cameras, consoles and TVs.

    ${history.length ? `Earlier in this chat (oldest first):\n${history.join('\n')}\n` : ''}
    Question: "${message}"
    Device (may be empty): ${JSON.stringify(deviceContext || {})}
    ${photoPaths.length ? `The user attached ${photoPaths.length} photo(s) of the device. Look at them and base your answer on the visible damage. If a photo is unclear or does not show a device, say so.` : ''}
    Repair guidance you may use: ${guidance}

    Reply with valid JSON only, in exactly this shape:
    {
      "summary": "the direct answer in 1-2 short sentences (max 40 words)",
      "points": ["up to 4 practical points, each one short sentence (max 20 words)"],
      "caution": "one short safety or cost warning if it really matters, otherwise null"
    }

    Rules: plain text only, no Markdown, no asterisks, no headings, no emojis. Be specific and practical; skip
    generic filler. Use Indian Rupees (₹) if you mention prices. If you are not sure, say so briefly instead of guessing.
  `;
  const result = await geminiService.generateJson([...geminiService.filesToParts(photoPaths), prompt]);
  if (!result.success || !result.data?.summary) return null;
  const d = result.data;
  return buildReply({
    summary: d.summary,
    points: Array.isArray(d.points) ? d.points : [],
    caution: d.caution && String(d.caution).toLowerCase() !== 'null' ? d.caution : null,
    sources: articleSources(articles.slice(0, 2)),
  });
};

const isDbReady = () => mongoose.connection.readyState === 1;

/** Last few turns as short lines, so follow-up questions ("what about the battery?") make sense. */
const historyLines = (conversation) =>
  (conversation?.messages || []).slice(-6).map((m) =>
    m.sender === 'user'
      ? `User: ${clip(m.text || '(sent a photo)', 60)}`
      : `Assistant: ${clip(m.summary || m.text, 60)}`
  );

/** Loads the user's conversation, or null if it doesn't exist / belongs to someone else / no database. */
const findConversation = async (id, userId) => {
  if (!isDbReady() || !id || !mongoose.Types.ObjectId.isValid(id)) return null;
  return Conversation.findOne({ _id: id, userId: userId || 'demo' });
};

/** Saves the question and answer. Storage problems never block the answer itself. */
const saveExchange = async ({ conversation, userId, message, photoCount, reply }) => {
  if (!isDbReady()) return null;
  try {
    const convo = conversation || new Conversation({ userId: userId || 'demo', title: clip(message, 10) || 'Photo question' });
    convo.messages.push(
      { sender: 'user', text: message, photoCount },
      { sender: 'assistant', text: reply.text, summary: reply.summary, points: reply.points, caution: reply.caution, sources: reply.sources }
    );
    await convo.save();
    return convo._id.toString();
  } catch (err) {
    console.warn(`⚠️ Could not save assistant chat: ${err.message}`);
    return conversation?._id?.toString() || null;
  }
};

/**
 * Handle conversational repair assistant query
 * POST /api/assistant/chat  { message, userId?, conversationId?, deviceContext? }  (JSON, or multipart with `photos`)
 * Returns { reply, conversationId } — conversationId is null when the database is unavailable.
 */
export const handleAssistantChat = async (req, res) => {
  const photoPaths = (req.files || []).map((f) => f.path);
  // Photos are only needed for this one answer; never keep them on disk.
  const cleanup = () => photoPaths.forEach((p) => fs.promises.unlink(p).catch(() => {}));
  res.on('finish', cleanup);

  let deviceContext = req.body?.deviceContext || {};
  if (typeof deviceContext === 'string') {
    try {
      deviceContext = JSON.parse(deviceContext);
    } catch {
      deviceContext = {};
    }
  }
  const { userId, conversationId } = req.body || {};
  const typed = String(req.body?.message || '').trim();
  const message = typed || (photoPaths.length ? 'What looks damaged in this photo, and is it worth repairing?' : '');

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a question or symptom description.',
    });
  }

  let source = 'guides';
  let reply = null;
  let warning;
  let conversation = null;
  try {
    conversation = await findConversation(conversationId, userId);
    const articles = searchKnowledgeBase(message, 3);

    if (geminiService.isConfigured()) {
      reply = await withTimeout(
        askGemini(message.slice(0, 1000), deviceContext, articles, photoPaths, historyLines(conversation)),
        AI_TIMEOUT_MS
      );
      if (reply) source = 'ai';
    }
  } catch (error) {
    warning = error.message;
  }
  if (!reply) reply = withPhotoNote(buildKnowledgeReply(message), photoPaths.length);

  const savedId = await saveExchange({ conversation, userId, message: typed, photoCount: photoPaths.length, reply });

  return res.status(200).json({
    success: true,
    source,
    message: source === 'ai' ? 'Assistant response generated.' : 'Assistant response from the local repair guides.',
    reply,
    conversationId: savedId,
    ...(warning ? { warning } : {}),
  });
};

/** GET /api/assistant/conversations?userId=  — newest first, without the messages. */
export const listConversations = async (req, res, next) => {
  try {
    if (!isDbReady()) return res.status(200).json({ success: true, conversations: [], stored: false });
    const rows = await Conversation.aggregate([
      { $match: { userId: req.query.userId || 'demo' } },
      { $sort: { updatedAt: -1 } },
      { $limit: 50 },
      { $project: { title: 1, updatedAt: 1, createdAt: 1, messageCount: { $size: '$messages' } } },
    ]);
    res.status(200).json({ success: true, conversations: rows, stored: true });
  } catch (error) {
    next(error);
  }
};

/** GET /api/assistant/conversations/:id?userId= */
export const getConversation = async (req, res, next) => {
  try {
    const convo = await findConversation(req.params.id, req.query.userId);
    if (!convo) return res.status(404).json({ success: false, message: 'Chat not found.' });
    res.status(200).json({ success: true, conversation: convo });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/assistant/conversations/:id?userId= */
export const deleteConversation = async (req, res, next) => {
  try {
    const convo = await findConversation(req.params.id, req.query.userId);
    if (!convo) return res.status(404).json({ success: false, message: 'Chat not found.' });
    await convo.deleteOne();
    res.status(200).json({ success: true, message: 'Chat deleted.' });
  } catch (error) {
    next(error);
  }
};

export default handleAssistantChat;
