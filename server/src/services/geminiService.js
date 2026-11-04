import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini Service Integration Foundation for ReLife-Spark.
 * Implements resilient multi-model failover for 503/429 high demand spikes.
 */
class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.client = null;
    this.defaultModel = process.env.GEMINI_LLM_MODEL || 'gemini-3.1-flash-lite';
    this.embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';
    this.candidateModels = [
      this.defaultModel,
      'gemini-3.5-flash',
      'gemini-flash-latest',
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
   * Placeholder method for multi-modal image damage diagnosis.
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

    return {
      configured: true,
      status: 'READY_FOR_PIPELINE',
      message: 'Gemini service is connected. Image diagnosis pipeline ready.',
      imageCount: imagePaths.length,
      deviceContext,
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
