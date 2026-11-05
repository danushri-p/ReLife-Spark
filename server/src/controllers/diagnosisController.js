import geminiService from '../services/geminiService.js';

/**
 * Handle upload of device damage photographs and analyse them with Gemini.
 * POST /api/diagnosis/upload  (multipart: images[], optional deviceType, brand, model, problemDescription)
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
      path: file.path,
    }));

    const { deviceType, brand, model, problemDescription } = req.body || {};
    const analysisResult = await geminiService.analyzeDamageImages(
      uploadedDetails.map((file) => file.path),
      {
        deviceType: deviceType || undefined,
        brand: brand || undefined,
        model: model || undefined,
        reportedProblem: problemDescription || undefined,
        fileCount: uploadedDetails.length,
      }
    );

    const ready = analysisResult.status === 'READY';

    res.status(200).json({
      success: true,
      message: ready ? 'Damage photographs uploaded and analyzed.' : 'Damage photographs uploaded, but AI analysis did not complete.',
      filesReceived: uploadedDetails.length,
      files: uploadedDetails.map(({ path: _path, ...rest }) => rest),
      aiAnalysisStatus: {
        ready,
        status: analysisResult.status,
        note: analysisResult.message,
      },
      visionAnalysis: ready ? analysisResult.analysis : null,
    });
  } catch (error) {
    next(error);
  }
};
