/**
 * Handle upload of repair quotations (PDFs or images)
 * POST /api/quotes/upload
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

    res.status(200).json({
      success: true,
      message: 'Repair quotation document uploaded successfully.',
      filesReceived: uploadedFiles.length,
      files: uploadedFiles,
      quotationExtractionStatus: {
        status: 'PENDING_PIPELINE',
        note: 'Automated quotation item extraction via Gemini Vision / PDF parsing will be implemented in Milestone 2. Please review or manually verify values.',
      },
    });
  } catch (error) {
    next(error);
  }
};

