import geminiService from '../services/geminiService.js';

/**
 * Handle upload of repair quotations (PDFs or images) and extract the amounts with Gemini.
 * POST /api/quotes/upload  (multipart: quotes[], optional deviceType, brand, model)
 */
export const uploadQuoteDocument = async (req, res, next) => {
  try {
    const files = req.files || [];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No quotation documents were provided. Please upload a PDF or image file.',
      });
    }

    const uploadedFiles = files.map((file) => ({
      originalName: file.originalname,
      filename: file.filename,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      mimetype: file.mimetype,
    }));

    const { deviceType, brand, model } = req.body || {};
    const extraction = await geminiService.extractQuote(
      files.map((file) => file.path),
      { deviceType: deviceType || undefined, brand: brand || undefined, model: model || undefined }
    );

    res.status(200).json({
      success: true,
      message: extraction.success
        ? 'Quote uploaded and the amounts were read automatically. Check them before continuing.'
        : 'Quote uploaded, but the amounts could not be read automatically. Please enter them yourself.',
      filesReceived: uploadedFiles.length,
      files: uploadedFiles,
      quotationExtractionStatus: {
        status: extraction.success ? 'EXTRACTED' : 'MANUAL_ENTRY_NEEDED',
        note: extraction.success ? null : extraction.error,
      },
      quote: extraction.success ? extraction.quote : null,
    });
  } catch (error) {
    next(error);
  }
};
