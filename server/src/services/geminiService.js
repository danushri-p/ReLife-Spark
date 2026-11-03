import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini Service Integration Foundation for ReLife-Spark.
 * Prepares the structure for future image damage diagnosis, quotation parsing,
 * and conversational RAG explanations while keeping keys secure on the server.
 */
class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.client = null;
    this.defaultModel = 'gemini-1.5-flash';

    if (this.apiKey && this.apiKey.trim().length > 0) {
      try {
        this.client = new GoogleGenerativeAI(this.apiKey);
        console.log('✅ Google Gemini API client initialized successfully.');
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
   * Placeholder / Foundation method for multi-modal image damage diagnosis.
   * Keeps image diagnosis logic separated from general text reasoning.
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
      message: 'Gemini service is connected. Image diagnosis pipeline will be attached during Milestone 2/3.',
      imageCount: imagePaths.length,
      deviceContext,
    };
  }

  /**
   * Placeholder / Foundation method for text reasoning and conversational assistant.
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
