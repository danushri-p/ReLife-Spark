import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  History as HistoryIcon,
  SquarePen,
  Trash2,
  Camera,
  ImagePlus,
  X,
  FileText,
  TriangleAlert,
  LoaderCircle,
  MessageCircleQuestion,
  SendHorizontal,
  Sparkles,
} from 'lucide-react';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

const AssistantAvatar = () => (
  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0d5b46] text-[#7fffd4]">
    <Sparkles className="h-4 w-4" />
  </span>
);

/** Strips Markdown symbols (**bold**, * bullets, # headings) from a line of text. */
const stripMarkdown = (line) =>
  line
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^\s*#{1,6}\s+/, '')
    .replace(/[*_]{1,2}/g, '')
    .trim();

/** Turns a plain or Markdown answer into { summary, points } so it can be shown the same way. */
const parsePlainText = (text) => {
  const lines = String(text || '').split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const isBullet = (l) => /^([*\-•]|\d+[.)])\s+/.test(l);
  const summary = lines.filter((l) => !isBullet(l)).map(stripMarkdown).join(' ');
  const points = lines.filter(isBullet).map((l) => stripMarkdown(l.replace(/^([*\-•]|\d+[.)])\s+/, '')));
  return { summary, points };
};

/** Normalises a server reply (structured, or older plain text) into the message shape the chat renders. */
const WELCOME = {
  sender: 'assistant',
  summary: "Hi! I'm the ReLife-Spark Assistant. Ask me about a repair, a part or your warranty, and I'll give you a short, practical answer.",
  points: [],
  sources: [],
  timestamp: '',
};

/** Remembers which saved chat was open, per user, so a reload continues it. */
const chatKey = (userId) => `relife-spark:assistant-chat:${userId || 'demo'}`;
const readOpenChat = (userId) => {
  try {
    return localStorage.getItem(chatKey(userId));
  } catch {
    return null;
  }
};
const writeOpenChat = (userId, id) => {
  try {
    if (id) localStorage.setItem(chatKey(userId), id);
    else localStorage.removeItem(chatKey(userId));
  } catch {
    /* storage blocked: the chat is still saved on the server */
  }
};

const timeLabel = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const MAX_PHOTOS = 3;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/** A message saved on the server, in the shape the chat renders. Photos aren't stored, only their count. */
const fromStored = (m) =>
  m.sender === 'user'
    ? { sender: 'user', text: m.text, photoCount: m.photoCount || 0, timestamp: timeLabel(m.createdAt) }
    : { ...toAssistantMessage(m), timestamp: timeLabel(m.createdAt) };

const toAssistantMessage = (reply) => {
  const structured = reply?.summary
    ? { summary: stripMarkdown(reply.summary), points: (reply.points || []).map(stripMarkdown).filter(Boolean) }
    : parsePlainText(reply?.text);
  return {
    sender: 'assistant',
    ...structured,
    caution: reply?.caution ? stripMarkdown(reply.caution) : null,
    sources: Array.isArray(reply?.sources) ? reply.sources : [],
    timestamp: 'Just now',
  };
};

export const KnowledgeAssistant = () => {
  const { user } = useAuth();
  const userId = user?.id || 'demo';
  const [messages, setMessages] = useState([WELCOME]);
  const [conversationId, setConversationId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chats, setChats] = useState({ loading: false, error: '', items: [] });
  const historyRef = useRef(null);

  const location = useLocation();
  // Pre-filled when arriving from the Overview assistant box or the top-bar search
  const [inputQuery, setInputQuery] = useState(location.state?.prompt || '');
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]); // [{ file, url }] waiting to be sent
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef(null);
  const objectUrls = useRef([]);

  // Free the photo previews when leaving the page.
  useEffect(() => () => objectUrls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const addPhotos = (fileList) => {
    setPhotoError('');
    const files = Array.from(fileList || []);
    const valid = files.filter((f) => PHOTO_TYPES.includes(f.type) && f.size <= 10 * 1024 * 1024);
    if (valid.length < files.length) setPhotoError('Use JPEG, PNG, WEBP or HEIC photos under 10 MB.');
    setPhotos((prev) => {
      const room = MAX_PHOTOS - prev.length;
      if (valid.length > room) setPhotoError(`You can attach up to ${MAX_PHOTOS} photos.`);
      const added = valid.slice(0, Math.max(0, room)).map((file) => {
        const url = URL.createObjectURL(file);
        objectUrls.current.push(url);
        return { file, url };
      });
      return [...prev, ...added];
    });
  };

  const removePhoto = (url) => setPhotos((prev) => prev.filter((p) => p.url !== url));

  const openChat = async (id) => {
    setHistoryOpen(false);
    try {
      const res = await apiClient.get(`/assistant/conversations/${id}`, { params: { userId } });
      setMessages([WELCOME, ...(res.conversation?.messages || []).map(fromStored)]);
      setConversationId(id);
      writeOpenChat(userId, id);
    } catch {
      // The saved chat is gone (deleted elsewhere): start fresh.
      writeOpenChat(userId, null);
      setConversationId(null);
      setMessages([WELCOME]);
    }
  };

  const startNewChat = () => {
    setHistoryOpen(false);
    setConversationId(null);
    writeOpenChat(userId, null);
    setMessages([WELCOME]);
  };

  const loadChats = async () => {
    setChats((c) => ({ ...c, loading: true, error: '' }));
    try {
      const res = await apiClient.get('/assistant/conversations', { params: { userId } });
      setChats({ loading: false, error: '', items: res.conversations || [] });
    } catch (err) {
      setChats({ loading: false, error: err?.message || 'Could not load your chats.', items: [] });
    }
  };

  const deleteChat = async (id) => {
    if (!window.confirm('Delete this chat? This can\u2019t be undone.')) return;
    try {
      await apiClient.delete(`/assistant/conversations/${id}`, { params: { userId } });
      setChats((c) => ({ ...c, items: c.items.filter((x) => x._id !== id) }));
      if (id === conversationId) startNewChat();
    } catch (err) {
      setChats((c) => ({ ...c, error: err?.message || 'Could not delete the chat.' }));
    }
  };

  // Reopen the chat this user had open last time.
  useEffect(() => {
    const saved = readOpenChat(userId);
    if (saved) openChat(saved);
    else {
      setConversationId(null);
      setMessages([WELCOME]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Close the history panel on outside click / Escape.
  useEffect(() => {
    if (!historyOpen) return undefined;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !historyRef.current?.contains(e.target)) setHistoryOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [historyOpen]);

  const promptSuggestions = [
    { label: 'Can I replace the battery safely myself?', key: 'battery' },
    { label: 'Does physical damage void my entire warranty?', key: 'warranty' },
    { label: 'How to verify if a replacement screen is genuine OEM?', key: 'oem' },
  ];

  const handleSendQuery = async (queryText) => {
    const attached = photos;
    if ((!queryText.trim() && !attached.length) || loading) return;

    const userMessage = {
      sender: 'user',
      text: queryText.trim(),
      photos: attached.map((p) => p.url),
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setPhotos([]);
    setPhotoError('');
    setLoading(true);

    try {
      // AI answers can take 20s+; the server falls back to its guides after 40s.
      let response;
      if (attached.length) {
        const form = new FormData();
        form.append('message', queryText.trim());
        form.append('userId', userId);
        if (conversationId) form.append('conversationId', conversationId);
        attached.forEach((p) => form.append('photos', p.file));
        response = await apiClient.post('/assistant/chat', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 90000,
        });
      } else {
        response = await apiClient.post(
          '/assistant/chat',
          { message: queryText.trim(), userId, conversationId },
          { timeout: 60000 }
        );
      }

      if (!response?.reply?.summary && !response?.reply?.text) throw new Error('Empty reply');
      setMessages((prev) => [...prev, toAssistantMessage(response.reply)]);
      if (response.conversationId) {
        setConversationId(response.conversationId);
        writeOpenChat(userId, response.conversationId);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          summary: 'Sorry, I couldn’t reach the assistant just now. Please try again in a moment.',
          points: [],
          sources: [],
          error: true,
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendQuery(inputQuery);
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Intro */}
      <div>
        <h2 className="text-[1.9rem] font-medium tracking-tight text-[#16201d]">Ask before you pay</h2>
        <p className="mt-1 text-sm text-slate-500">
          Questions about a quote, a part or your warranty? Get a plain answer with the sources behind it.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Chat ── */}
        <section className="flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-slate-200/70 bg-white lg:h-[calc(100vh-13rem)] lg:min-h-[520px]">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <AssistantAvatar />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#16201d]">ReLife-Spark Assistant</p>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2feaa8]" />
                Short, practical repair answers
              </p>
            </div>

            <div ref={historyRef} className="relative ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={startNewChat}
                aria-label="New chat"
                title="New chat"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-[#eef6f2] hover:text-[#0d4a3e]"
              >
                <SquarePen className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!historyOpen) loadChats();
                  setHistoryOpen((o) => !o);
                }}
                aria-label="Chat history"
                aria-expanded={historyOpen}
                title="Chat history"
                className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#eef6f2] hover:text-[#0d4a3e] ${
                  historyOpen ? 'bg-[#eef6f2] text-[#0d4a3e]' : 'text-slate-500'
                }`}
              >
                <HistoryIcon className="h-4 w-4" />
              </button>

              {historyOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-[min(20rem,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_40px_-20px_rgba(20,20,20,0.35)]">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-medium text-[#16201d]">Your chats</p>
                    <button type="button" onClick={startNewChat} className="text-xs font-medium text-[#0d4a3e] hover:underline">
                      New chat
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-1.5">
                    {chats.loading ? (
                      <p className="flex items-center gap-2 px-3 py-4 text-sm text-slate-500">
                        <LoaderCircle className="h-4 w-4 animate-spin" /> Loading…
                      </p>
                    ) : chats.error ? (
                      <p className="px-3 py-4 text-sm text-red-700">{chats.error}</p>
                    ) : chats.items.length === 0 ? (
                      <p className="px-3 py-4 text-sm text-slate-500">No saved chats yet. Your questions will appear here.</p>
                    ) : (
                      <ul>
                        {chats.items.map((c) => (
                          <li key={c._id} className="group flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openChat(c._id)}
                              className={`min-w-0 flex-1 rounded-xl px-3 py-2 text-left transition hover:bg-[#eef6f2] ${
                                c._id === conversationId ? 'bg-[#eef6f2]' : ''
                              }`}
                            >
                              <span className="block truncate text-sm text-slate-800">{c.title}</span>
                              <span className="block text-[11px] text-slate-400">
                                {timeLabel(c.updatedAt)} · {Math.ceil((c.messageCount || 0) / 2)} question{c.messageCount > 2 ? 's' : ''}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteChat(c._id)}
                              aria-label={`Delete chat: ${c.title}`}
                              className="flex-shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="max-h-[65vh] min-h-[320px] flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6 lg:max-h-none">
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';

              if (isUser) {
                return (
                  <div key={index} className="flex justify-end">
                    <div className="min-w-0 max-w-[85%] sm:max-w-[75%]">
                      {msg.photos?.length > 0 && (
                        <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">
                          {msg.photos.map((url) => (
                            <img key={url} src={url} alt="Attached photo" className="h-24 w-24 rounded-xl object-cover" />
                          ))}
                        </div>
                      )}
                      {!msg.photos?.length && msg.photoCount > 0 && (
                        <div className="mb-1.5 flex justify-end">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500">
                            <Camera className="h-3.5 w-3.5" /> {msg.photoCount} photo{msg.photoCount > 1 ? 's' : ''} sent
                          </span>
                        </div>
                      )}
                      {msg.text && (
                        <div className="break-words rounded-2xl rounded-tr-md bg-[#0d5b46] px-4 py-3 text-sm leading-relaxed text-white">
                          {msg.text}
                        </div>
                      )}
                      {msg.timestamp && <span className="mt-1 block px-1 text-right text-[11px] text-slate-400">{msg.timestamp}</span>}
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className="flex gap-3">
                  <AssistantAvatar />
                  <div className="min-w-0 max-w-[85%] space-y-2 sm:max-w-[80%]">
                    <div
                      className={`break-words rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed ${
                        msg.error ? 'bg-red-50 text-red-800' : 'bg-[#eef6f2] text-[#123d33]'
                      }`}
                    >
                      {msg.summary && <p>{msg.summary}</p>}

                      {msg.points?.length > 0 && (
                        <ul className="mt-2.5 space-y-1.5">
                          {msg.points.map((point, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="mt-[0.55em] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#0d5b46]" />
                              <span className="min-w-0">{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {msg.caution && (
                        <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
                          <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
                          <span className="min-w-0">{msg.caution}</span>
                        </p>
                      )}
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-1 px-1 text-[11px] text-slate-500">
                          <FileText className="h-3 w-3" /> Sources
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, i) => (
                            <span
                              key={i}
                              title={src.page ? `${src.title} (${src.page})` : src.title}
                              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600"
                            >
                              <span className="min-w-0 truncate">
                                {src.title}
                                {src.page && <span className="text-slate-400"> · {src.page}</span>}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.timestamp && <span className="block px-1 text-[11px] text-slate-400">{msg.timestamp}</span>}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3">
                <AssistantAvatar />
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-md bg-[#eef6f2] px-4 py-3 text-sm text-[#123d33]">
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#0d5b46]" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-6 sm:pb-5">
            {/* Suggested questions (mobile; the side column shows them on desktop) */}
            <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
              {promptSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendQuery(item.label)}
                  className="flex-shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-[#0d5b46]/40 hover:text-[#0d4a3e]"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {photos.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {photos.map((p) => (
                  <div key={p.url} className="relative">
                    <img src={p.url} alt="Photo to send" className="h-16 w-16 rounded-xl border border-slate-200 object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(p.url)}
                      aria-label="Remove photo"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photoError && <p className="mb-2 text-xs text-red-700">{photoError}</p>}

            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white py-2 pl-2 pr-2 focus-within:border-[#0d5b46]/50"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                className="hidden"
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || photos.length >= MAX_PHOTOS}
                aria-label="Add a photo"
                title="Add a photo"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[#0d5b46] transition hover:bg-[#eef6f2] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
              <input
                type="text"
                placeholder={photos.length ? 'Add a question about your photo (optional)…' : 'Ask about a repair, a part or your warranty…'}
                aria-label="Ask the assistant"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-[#16201d] outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={(!inputQuery.trim() && !photos.length) || loading}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0d5b46] text-white transition hover:bg-[#0b4a3a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </section>

        {/* ── Side column ── */}
        <aside className="min-w-0 space-y-6">
          {/* Suggested questions */}
          <section className="hidden rounded-[28px] border border-slate-200/70 bg-white p-6 lg:block">
            <h3 className="flex items-center gap-2 text-lg font-medium text-[#16201d]">
              <MessageCircleQuestion className="h-5 w-5 text-[#0d5b46]" /> Try asking
            </h3>
            <div className="mt-4 space-y-2">
              {promptSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendQuery(item.label)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-[#0d5b46]/40 hover:bg-[#eef6f2] hover:text-[#0d4a3e]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

        </aside>
      </div>
    </div>
  );
};

export default KnowledgeAssistant;
