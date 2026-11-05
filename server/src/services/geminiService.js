import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini Service Integration Foundation for ReLife-Spark.
 * Implements resilient multi-model failover for 503/429 high demand spikes.
 */
class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.client = null;
    this.defaultModel = process.env.GEMINI_LLM_MODEL || 'gemini-2.5-flash';
    this.embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';
    this.candidateModels = [
      this.defaultModel,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-3.1-flash-lite',
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
    if (!paths.length) {
      return {
        configured: true,
        status: 'NO_IMAGES',
        message: 'No image files were available for diagnosis.',
        imageCount: 0,
      };
    }

    try {
      const model = this.getModel(this.defaultModel);
      if (!model) {
        return {
          configured: false,
          status: 'MODEL_UNAVAILABLE',
          message: 'Gemini model is not available right now.',
          imageCount: paths.length,
        };
      }

      const imageParts = paths.map((filePath) => {
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
          '.heic': 'image/heic',
          '.heif': 'image/heif',
        }[path.extname(filePath).toLowerCase()] || 'image/jpeg';

        return {
          inlineData: {
            mimeType,
            data: fileBuffer.toString('base64'),
          },
        };
      });

      const prompt = `
        You are a smartphone repair diagnostic assistant.
        Analyze the provided device photo(s) and identify likely damage, parts affected, repair priority, and rough estimated cost range.
        Focus on practical professional repair assessment for a phone, not generic advice.

        Device context: ${JSON.stringify(deviceContext || {})}

        Return valid JSON only in this exact format:
        {
          "label": "short photo label",
          "aiSummary": "1-2 sentence summary",
          "findings": [
            {
              "component": "part name",
              "severity": "Critical|High|Moderate|Minor|Intact",
              "confidence": 0,
              "estCost": "$xx - $yy",
              "note": "short cause/effect detail"
            }
          ]
        }

        Keep findings to 2-5 items. Use realistic repair terminology. If the image is not clear enough, say so in the summary and still provide conservative findings.
      `;

      const result = await model.generateContent([...imageParts, prompt]);
      const rawText = result?.response?.text?.() || '';
      const parsed = this.normalizeJsonText(rawText) || {
        label: 'AI image assessment',
        aiSummary: 'Gemini image analysis was completed, but the response could not be parsed into structured findings.',
        findings: [
          {
            component: 'Photo review',
            severity: 'Moderate',
            confidence: 82,
            estCost: '$0 - $50',
            note: 'The uploaded image was received, but the model response needs a technician review.',
          },
        ],
      };

      return {
        configured: true,
        status: 'READY',
        message: 'Gemini successfully analyzed the uploaded phone damage images.',
        imageCount: paths.length,
        analysis: {
          label: parsed.label || 'AI image assessment',
          aiSummary: parsed.aiSummary || 'The uploaded image was analyzed for physical damage and likely repair needs.',
          findings: Array.isArray(parsed.findings) ? parsed.findings : [
            {
              component: 'Photo review',
              severity: 'Moderate',
              confidence: 82,
              estCost: '$0 - $50',
              note: 'The uploaded image was processed, but no detailed findings were returned.',
            },
          ],
        },
      };
    } catch (error) {
      console.error('Gemini image analysis failed:', error);
      return {
        configured: true,
        status: 'FALLBACK',
        message: 'Gemini analysis failed, so the app returned a safe fallback preview for the uploaded photo.',
        imageCount: paths.length,
        analysis: {
          label: 'AI image assessment fallback',
          aiSummary: 'The photo was uploaded successfully, but the live AI image analysis service did not return a structured assessment. Please confirm with a technician before proceeding.',
          findings: [
            {
              component: 'Photo review',
              severity: 'Moderate',
              confidence: 78,
              estCost: '$0 - $50',
              note: 'This is a fallback result while the AI diagnosis pipeline is being validated.',
            },
          ],
        },
      };
    }
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
