import geminiService from '../services/geminiService.js';

/**
 * Diagnose a device from photos, a written description of the problem, or both.
 * A description covers faults a photo can't show (software, charging, battery, sound…).
 * POST /api/diagnosis/upload  (multipart: images[] optional, deviceType, brand, model, problemDescription)
 */
export const uploadDamagePhotos = async (req, res, next) => {
  try {
    const files = req.files || [];
    const described = String(req.body?.problemDescription || '').trim();

    if (files.length === 0 && described.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Add a photo or describe the problem (for example: "won’t charge past 20%").',
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
        reportedProblem: problemDescription ? String(problemDescription).slice(0, 2000) : undefined,
        fileCount: uploadedDetails.length,
      }
    );

    const ready = analysisResult.status === 'READY';

    res.status(200).json({
      success: true,
      message: ready ? 'Problem analyzed.' : 'AI analysis did not complete.',
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
