import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini Service Integration Foundation for ReLife-Spark.
 * Implements resilient multi-model failover for 503/429 high demand spikes.
 */
/** Gemini sometimes reports confidence as 0–1 instead of 0–100; normalise to a whole percentage. */
const normalizeFinding = (finding) => {
  const raw = Number(finding?.confidence);
  if (!Number.isFinite(raw)) return finding;
  const pct = raw > 0 && raw <= 1 ? raw * 100 : raw;
  return { ...finding, confidence: Math.round(Math.min(100, Math.max(0, pct))) };
};

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.client = null;
    this.defaultModel = process.env.GEMINI_LLM_MODEL || 'gemini-3.5-flash';
    this.embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';
    this.candidateModels = [
      this.defaultModel,
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ].filter((v, i, a) => a.indexOf(v) === i); // unique

    if (this.apiKey && this.apiKey.trim().length > 0) {
      try {
        this.client = new GoogleGenerativeAI(this.apiKey);
        console.log(`✅ Google Gemini API client initialized with model: ${this.defaultModel}`);
      } catch (err) {
        console.warn(`⚠️ Google Gemini client initialization warning: ${err.message}`);
      }
    } else {
      console.warn('⚠️ GEMINI_API_KEY is not set. AI features will operate in placeholder/mock mode.');
    }
  }

  /**
   * Check whether Gemini service is configured with a valid API key.
   */
  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Get the Gemini generative model instance.
   */
  getModel(modelName = this.defaultModel) {
    if (!this.isConfigured() || !this.client) {
      return null;
    }
    return this.client.getGenerativeModel({ model: modelName });
  }

  /**
   * Get the Gemini embedding model instance.
   */
  getEmbeddingModel(modelName = this.embeddingModel) {
    if (!this.isConfigured() || !this.client) {
      return null;
    }
    return this.client.getGenerativeModel({ model: modelName });
  }

  /**
   * Generate text reasoning response with automatic failover if Google servers experience high demand (503/429).
   */
  async generateText(prompt) {
    if (!this.isConfigured()) {
      return { success: false, message: 'Gemini API is not configured.' };
    }

    let lastError = null;

    for (const modelName of this.candidateModels) {
      try {
        const model = this.getModel(modelName);
        const result = await model.generateContent(prompt);
        return {
          success: true,
          modelUsed: modelName,
          text: result.response.text().trim(),
        };
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ Model ${modelName} encountered temporary issue (${err.message.substring(0, 80)}...). Trying backup model...`);
      }
    }

    return {
      success: false,
      error: lastError ? lastError.message : 'All Gemini candidate models failed to respond.',
    };
  }

  /**
   * Normalize and extract JSON from text, used for processing Gemini image analysis results.
   */
  normalizeJsonText(text) {
    if (!text) return null;

    let cleaned = String(text).trim();
    const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch) {
      cleaned = fencedMatch[1].trim();
    }

    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    }

    try {
      return JSON.parse(cleaned);
    } catch (error) {
      return null;
    }
  }

  /**
   * Analyze damage images for repair diagnostics with automatic failover to backup models.
   */
  async analyzeDamageImages(imagePaths, deviceContext = {}) {
    if (!this.isConfigured()) {
      return {
        configured: false,
        message: 'Gemini API key is not configured on the server. Damage image analysis is in preparation mode.',
        imageCount: imagePaths ? imagePaths.length : 0,
        status: 'PENDING_INTEGRATION',
      };
    }

    const paths = Array.isArray(imagePaths) ? imagePaths.filter(Boolean) : [];
    const described = String(deviceContext?.reportedProblem || '').trim();
    if (!paths.length && !described) {
      return {
        configured: true,
        status: 'NO_INPUT',
        message: 'Add a photo or describe the problem so it can be diagnosed.',
        imageCount: 0,
      };
    }

    // What the model has to work with: photos, the user's own description, or both.
    const task = paths.length
      ? `Analyze the provided device photo(s) and identify likely damage, parts affected, repair priority, and rough estimated cost range.
      ${described ? `The user also describes the problem as: "${described}". Use this for faults a photo cannot show (software, charging, battery, sound, connectivity) and combine it with what you see.` : ''}`
      : `There is no photo. The user describes the problem as: "${described}".
      Diagnose from this description: list the most likely causes and the parts or fixes involved (e.g. charger/cable, charging port, battery,
      software reinstall/reset, storage, logic board). Mention when a cheap fix (new cable, software reset) should be tried first.
      Use lower confidence values because nothing was inspected, and put "₹0 - ₹500" style costs for software-only fixes.`;

    const prompt = `
      You are a consumer-electronics repair diagnostic assistant working for customers in India.
      The device is a ${deviceContext?.deviceType || 'Smartphone'}.
      ${task}
      Focus on practical professional repair assessment for this kind of device, not generic advice.

      Device context: ${JSON.stringify(deviceContext || {})}

      Return valid JSON only in this exact format:
      {
        "label": "short label for what was checked",
        "aiSummary": "1-2 sentence summary. Start with 'HAZARD:' only if there is a safety risk such as a swollen battery or exposed mains wiring.",
        "findings": [
          {
            "component": "part name",
            "severity": "Critical|High|Moderate|Minor|Intact",
            "confidence": 85,
            "estCost": "₹x,xxx - ₹y,yyy",
            "note": "short cause/effect detail"
          }
        ]
      }

      Confidence is an integer percentage from 0 to 100. Give estCost in Indian Rupees (₹, Indian digit grouping) at typical Indian repair-shop prices for this exact device. Keep findings to 2-5 items. Use realistic repair terminology. If the image is not clear enough, say so in the summary and still provide conservative findings.
    `;

    const result = await this.generateJson([...this.filesToParts(paths), prompt]);
    if (!result.success || !Array.isArray(result.data?.findings)) {
      return {
        configured: true,
        status: 'FAILED',
        message: `AI photo analysis could not be completed: ${result.error || 'the model returned no structured findings'}.`,
        imageCount: paths.length,
        analysis: null,
      };
    }

    return {
      configured: true,
      status: 'READY',
      message: 'Gemini successfully analyzed the uploaded device damage images.',
      imageCount: paths.length,
      modelUsed: result.modelUsed,
      analysis: {
        label: result.data.label || (paths.length ? 'AI image assessment' : 'Your description'),
        aiSummary: result.data.aiSummary || 'The problem was analyzed for likely causes and repair needs.',
        findings: result.data.findings.map(normalizeFinding),
      },
    };
  }

  /** Turns local image/PDF files into Gemini inline-data parts. */
  filesToParts(filePaths) {
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.heic': 'image/heic',
      '.heif': 'image/heif',
      '.pdf': 'application/pdf',
    };
    return filePaths.map((filePath) => ({
      inlineData: {
        mimeType: mimeTypes[path.extname(filePath).toLowerCase()] || 'image/jpeg',
        data: fs.readFileSync(filePath).toString('base64'),
      },
    }));
  }

  /**
   * Sends a (multimodal) request and parses a JSON object from the reply, trying each candidate
   * model in turn so one retired/overloaded model doesn't break the feature.
   */
  async generateJson(parts) {
    if (!this.isConfigured()) {
      return { success: false, error: 'Gemini API key is not configured on the server' };
    }
    let lastError = null;
    for (const modelName of this.candidateModels) {
      try {
        const result = await this.getModel(modelName).generateContent(parts);
        const data = this.normalizeJsonText(result?.response?.text?.() || '');
        if (data) return { success: true, data, modelUsed: modelName };
        lastError = new Error('response was not valid JSON');
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ Gemini request with ${modelName} failed (${err.message.substring(0, 120)}). Trying backup model...`);
      }
    }
    return { success: false, error: lastError ? lastError.message : 'all Gemini candidate models failed' };
  }

  /** Reads the line items of a repair-shop quotation (image or PDF). Amounts are in rupees. */
  async extractQuote(filePaths, deviceContext = {}) {
    const prompt = `
      You are reading an electronics repair shop's quotation or invoice for a customer in India.
      Device context (may be empty): ${JSON.stringify(deviceContext || {})}

      Extract the amounts and return valid JSON only in this exact format:
      {
        "shopName": "name of the shop or null",
        "currency": "INR",
        "parts": 0,
        "labour": 0,
        "diagnostic": 0,
        "tax": 0,
        "total": 0,
        "lineItems": [{ "description": "text", "amount": 0 }],
        "notes": "warranty, turnaround or other terms in one sentence, or null"
      }

      Rules: amounts are plain numbers (no symbols or commas). "parts" is the sum of all parts/components,
      "labour" the sum of labour/service/installation charges, "diagnostic" any inspection or diagnostic fee,
      "tax" all GST/taxes/supplies. Use 0 for anything not present. If the amounts are in another currency,
      convert them to Indian Rupees and set "currency" to the original currency code.
      If the document is not a repair quote, return all amounts as 0 and explain in "notes".
    `;
    const result = await this.generateJson([...this.filesToParts(filePaths), prompt]);
    if (!result.success) return { success: false, error: result.error };

    const num = (v) => Math.max(0, Math.round(Number(String(v ?? 0).replace(/[^\d.]/g, '')) || 0));
    const d = result.data;
    const quote = {
      shopName: d.shopName || null,
      currency: d.currency || 'INR',
      parts: num(d.parts),
      labour: num(d.labour),
      diagnostic: num(d.diagnostic),
      tax: num(d.tax),
      lineItems: Array.isArray(d.lineItems) ? d.lineItems.map((li) => ({ description: String(li.description || ''), amount: num(li.amount) })) : [],
      notes: d.notes || null,
    };
    quote.total = num(d.total) || quote.parts + quote.labour + quote.diagnostic + quote.tax;
    return { success: true, quote, modelUsed: result.modelUsed };
  }

  /**
   * Estimates the typical local repair price, the price of a comparable new device, and the
   * questions worth asking the shop — all for this specific device and fault.
   */
  async estimateRepair(context = {}) {
    const prompt = `
      You are a consumer-electronics repair pricing expert for India (2026 prices).
      The device is a ${context?.deviceType || 'Smartphone'}.
      Device and fault: ${JSON.stringify(context)}

      Return valid JSON only in this exact format:
      {
        "typicalRepairCost": 0,
        "typicalRepairRange": [0, 0],
        "newPhonePrice": 0,
        "newPhoneLabel": "the replacement you priced, e.g. same model new, or its current successor",
        "repairability": 70,
        "questions": [{ "q": "question to ask the repair shop", "reason": "why it matters" }]
      }

      Rules: amounts are whole Indian Rupees as plain numbers. "typicalRepairCost" is the usual total an
      independent shop in an Indian city charges for this repair on this model, including parts, labour and GST.
      "newPhonePrice" is what buying this model (or its nearest current equivalent) new costs in India today,
      for the same kind of device (e.g. a laptop for a laptop). "newPhoneLabel" names that replacement.
      "repairability" is 0-100 for how easy and economical this model is to repair (parts availability, design).
      Give 3-4 questions specific to this model and fault.
    `;
    const result = await this.generateJson([prompt]);
    if (!result.success) return { success: false, error: result.error };

    const num = (v) => Math.max(0, Math.round(Number(String(v ?? 0).replace(/[^\d.]/g, '')) || 0));
    const d = result.data;
    const range = Array.isArray(d.typicalRepairRange) ? d.typicalRepairRange.map(num).slice(0, 2) : [];
    return {
      success: true,
      modelUsed: result.modelUsed,
      estimate: {
        typicalRepairCost: num(d.typicalRepairCost) || null,
        typicalRepairRange: range.length === 2 && range[1] >= range[0] && range[1] > 0 ? range : null,
        newPhonePrice: num(d.newPhonePrice) || null,
        newPhoneLabel: d.newPhoneLabel || null,
        repairability: Number.isFinite(Number(d.repairability)) ? Math.min(100, Math.max(0, Math.round(Number(d.repairability)))) : null,
        questions: Array.isArray(d.questions)
          ? d.questions.filter((x) => x && x.q).slice(0, 5).map((x) => ({ q: String(x.q), reason: String(x.reason || '') }))
          : [],
      },
    };
  }

  /**
   * Placeholder method for text reasoning and conversational assistant.
   */
  async generateRepairGuidance(prompt, context = {}) {
    if (!this.isConfigured()) {
      return {
        configured: false,
        message: 'Gemini API key is not configured on the server. Knowledge assistant is in preparation mode.',
        status: 'PENDING_INTEGRATION',
      };
    }

    return {
      configured: true,
      status: 'READY_FOR_PIPELINE',
      message: 'Gemini service is ready for RAG grounding and contextual prompt execution.',
      contextProvided: Boolean(context),
    };
  }
}

export const geminiService = new GeminiService();
export default geminiService;
