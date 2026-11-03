import geminiService from '../services/geminiService.js';

/**
 * Handle upload of smartphone damage photographs
 * POST /api/diagnosis/upload
 */
export const uploadDamagePhotos = async (req, res, next) => {
  try {
    const files = req.files || [];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No damage images were provided. Please attach at least one photograph.',
      });
    }

    const uploadedDetails = files.map((file) => ({
      originalName: file.originalname,
      filename: file.filename,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      mimetype: file.mimetype,
    }));

    // In this foundation phase, we acknowledge file receipt and outline the AI pipeline
    res.status(200).json({
      success: true,
      message: 'Damage photographs uploaded successfully to secure temporary storage.',
      filesReceived: uploadedDetails.length,
      files: uploadedDetails,
      aiAnalysisStatus: {
        ready: geminiService.isConfigured(),
        status: 'PENDING_PIPELINE',
        note: 'AI multi-modal damage diagnosis with Gemini will be processed in Milestone 2. No fabricated analysis is returned.',
      },
    });
  } catch (error) {
    next(error);
  }
};

