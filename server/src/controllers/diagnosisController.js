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
      path: file.path,
    }));

    const analysisReady = geminiService.isConfigured();
    const analysisResult = analysisReady
      ? await geminiService.analyzeDamageImages(
        uploadedDetails.map((file) => file.path),
        {
          fileCount: uploadedDetails.length,
          deviceType: 'smartphone',
          expectedFocus: 'damage inspection, cracked display, battery, charging port, liquid ingress',
        }
      )
      : {
        configured: false,
        status: 'PENDING_INTEGRATION',
        message: 'Gemini API key is not configured on the server. Damage image analysis is in preparation mode.',
        analysis: {
          label: 'Damage photo review',
          aiSummary: 'The uploaded photo was accepted but AI diagnosis is unavailable until the Gemini API key is configured.',
          findings: [
            {
              component: 'Photo review',
              severity: 'Moderate',
              confidence: 75,
              estCost: '$0 - $50',
              note: 'This is a local fallback while the AI diagnosis pipeline is not configured.',
            },
          ],
        },
      };

    res.status(200).json({
      success: true,
      message: 'Damage photographs uploaded successfully and analyzed.',
      filesReceived: uploadedDetails.length,
      files: uploadedDetails,
      aiAnalysisStatus: {
        ready: Boolean(analysisReady),
        status: analysisResult?.status || 'PENDING_INTEGRATION',
        note: analysisResult?.message || 'Damage image analysis completed.',
      },
      visionAnalysis: analysisResult?.analysis || {
        label: 'Damage photo review',
        aiSummary: 'The uploaded photo was accepted but no structured AI findings were available.',
        findings: [
          {
            component: 'Photo review',
            severity: 'Moderate',
            confidence: 75,
            estCost: '$0 - $50',
            note: 'No detailed diagnosis was returned at this time.',
          },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

