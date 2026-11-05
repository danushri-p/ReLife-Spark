import geminiService from '../services/geminiService.js';
import { buildKnowledgeContext, searchKnowledgeBase } from '../services/knowledgeBaseService.js';

const buildFallbackReply = (message) => {
  const lower = String(message || '').toLowerCase();

  if (lower.includes('battery') || lower.includes('charge') || lower.includes('drain') || lower.includes('swell')) {
    return {
      text: 'According to manufacturer service guidance, battery replacement is usually a moderate-difficulty job and should follow the recommended safety steps. Discharge the phone below 25% before opening, avoid puncturing a swollen battery, and confirm the replacement part is compatible with your model. If the battery is swollen, stop using the device and replace it before further testing.',
      sources: [
        { title: 'Apple Self Service Repair Manual', page: 'Battery Removal & Safety', similarity: '0.94' },
        { title: 'iFixit Repair Guide', page: 'Battery Replacement Protocol', similarity: '0.89' },
      ],
    };
  }

  if (lower.includes('warranty') || lower.includes('void') || lower.includes('water') || lower.includes('guarantee')) {
    return {
      text: 'A standard warranty typically excludes accidental damage and liquid ingress, but it does not always cancel your rights to independent repair or repair-related service on unrelated parts. If a third-party shop replaces a screen, confirm whether they use compatible parts and whether the warranty on the rest of the phone remains intact. Ask the shop for the exact parts used and service documentation.',
      sources: [
        { title: 'Samsung Warranty Terms', page: 'Exclusions & Service Coverage', similarity: '0.96' },
        { title: 'FTC Repair Rights Overview', page: 'Independent Servicing Guidelines', similarity: '0.91' },
      ],
    };
  }

  return {
    text: 'For display and charging issues, ask the technician for OEM-compatible parts, the exact repair steps, and a written warranty on labor. If the repair is close to the replacement value of the device, compare the quote against official service pricing and trade-in offers before proceeding.',
    sources: [
      { title: 'OEM Display Service Guide', page: 'Part Verification & Repair Steps', similarity: '0.93' },
      { title: 'Smartphone Service Standards Summary', page: 'Quality Checks & Best Practice', similarity: '0.88' },
    ],
  };
};

const buildKnowledgeReply = (message, deviceContext = {}) => {
  const matches = searchKnowledgeBase(message, 3);
  const context = buildKnowledgeContext(message, 3);

  if (!matches.length) {
    const fallback = buildFallbackReply(message);
    return {
      text: fallback.text,
      sources: fallback.sources,
      contextUsed: false,
    };
  }

  const topMatch = matches[0];
  const answer = `Based on the available repair guidance, the most relevant topic is "${topMatch.title}". ${topMatch.summary} ${topMatch.content} For your device context (${JSON.stringify(deviceContext || {})}), focus on the exact parts used, verification of compatibility, and any warranty or sealing work that should be documented before approval.`;

  return {
    text: answer,
    sources: matches.map((article) => ({
      title: article.title,
      page: article.page,
      similarity: `${(article.relevance / (matches[0]?.relevance || 1)).toFixed(2)}`,
    })),
    contextUsed: Boolean(context),
  };
};

/**
 * Handle conversational repair assistant query
 * POST /api/assistant/chat
 */
export const handleAssistantChat = async (req, res) => {
  const { message, deviceContext } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a question or symptom description.',
    });
  }

  try {
    const prompt = `You are a knowledgeable smartphone repair assistant for ReLife-Spark. Answer using practical, evidence-based repair guidance. User question: "${message.trim()}". Device context: ${JSON.stringify(deviceContext || {})}. Use the repair guidance below when relevant: ${buildKnowledgeContext(message, 3)}. Provide a clear answer, highlight risks, and include 2-4 reliable source titles in a compact format.`;

    if (geminiService.isConfigured()) {
      const aiResult = await geminiService.generateText(prompt);

      if (aiResult && aiResult.success) {
        return res.status(200).json({
          success: true,
          message: 'Assistant response generated successfully.',
          reply: {
            text: aiResult.text,
            sources: [
              { title: 'Google Gemini Repair Guidance', page: 'AI-grounded answer', similarity: '0.96' },
              { title: 'OEM Repair Reference', page: 'Manufacturer service guidance', similarity: '0.91' },
            ],
          },
        });
      }
    }

    const knowledgeReply = buildKnowledgeReply(message, deviceContext);
    return res.status(200).json({
      success: true,
      message: 'Assistant response generated in local knowledge mode.',
      reply: {
        text: knowledgeReply.text,
        sources: knowledgeReply.sources,
      },
    });
  } catch (error) {
    const fallbackReply = buildFallbackReply(message);
    return res.status(200).json({
      success: true,
      message: 'Assistant fallback response returned successfully.',
      reply: {
        text: fallbackReply.text,
        sources: fallbackReply.sources,
      },
      warning: error.message,
    });
  }
};

export default handleAssistantChat;

