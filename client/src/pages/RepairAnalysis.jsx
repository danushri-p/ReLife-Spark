import React, { useState } from 'react';
import { 
  Wrench, 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Calculator, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  DollarSign,
  TrendingDown,
  Info
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import uploadService from '../services/uploadService';

export const RepairAnalysis = () => {
  // Upload placeholders state
  const [damageFiles, setDamageFiles] = useState([]);
  const [quoteFiles, setQuoteFiles] = useState([]);
  const [uploadNotice, setUploadNotice] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Interactive Cost Comparison Playground
  const [repairEstimate, setRepairEstimate] = useState(180);
  const [replacementPrice, setReplacementPrice] = useState(450);

  // Math formulas (deterministic)
  const costDifference = replacementPrice - repairEstimate;
  const repairCostPercentage = replacementPrice > 0 
    ? Math.round((repairEstimate / replacementPrice) * 100) 
    : 0;

  const handleDamageFileSelect = (e) => {
    if (e.target.files) {
      setDamageFiles(Array.from(e.target.files));
    }
  };

  const handleQuoteFileSelect = (e) => {
    if (e.target.files) {
      setQuoteFiles(Array.from(e.target.files));
    }
  };

  const handleUploadSubmit = async () => {
    if (damageFiles.length === 0 && quoteFiles.length === 0) {
      setUploadNotice({
        type: 'warning',
        message: 'Please select at least one damage photo or quotation document to test the upload endpoint.',
      });
      return;
    }

    setIsUploading(true);
    setUploadNotice(null);

    try {
      if (damageFiles.length > 0) {
        const formData = new FormData();
        damageFiles.forEach((file) => formData.append('images', file));
        const res = await uploadService.uploadDamageImages(formData);
        setUploadNotice({
          type: 'success',
          message: `${res.message} (${res.filesReceived} image(s) processed by Multer backend middleware).`,
        });
      } else if (quoteFiles.length > 0) {
        const formData = new FormData();
        quoteFiles.forEach((file) => formData.append('quotes', file));
        const res = await uploadService.uploadQuotes(formData);
        setUploadNotice({
          type: 'success',
          message: `${res.message} (${res.filesReceived} quote file(s) staged).`,
        });
      }
    } catch (err) {
      setUploadNotice({
        type: 'error',
        message: err.message || 'File upload failed. Ensure backend server is running.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-emerald-700 tracking-wider">
          <Wrench className="w-4 h-4" />
          Step 2: Quotations & Cost Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Repair vs. Replacement Analysis
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Compare itemized repair estimates against device market replacement values.
        </p>
      </div>

      {uploadNotice && (
        <Alert
          type={uploadNotice.type}
          onClose={() => setUploadNotice(null)}
        >
          {uploadNotice.message}
        </Alert>
      )}

      {/* Milestone 2 Status Pill */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Integration Status:</span> This view hosts the foundation UI for damage photograph inspection and PDF quotation parsing. The file upload routes (`/api/diagnosis/upload` and `/api/quotes/upload`) are operational with Multer security validation. Full Gemini Vision parsing will be linked in Milestone 2.
        </div>
      </div>

      {/* Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Damage Photo Upload */}
        <Card>
          <CardHeader
            title="Damage Photographs"
            subtitle="Upload photos of cracked screens, ports, or housing"
            icon={ImageIcon}
            badge="JPEG / PNG"
          />
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors bg-slate-50/50">
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-700">
              Drag & drop photos or browse from device
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Up to 5 images (max 10MB each)</p>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleDamageFileSelect}
              className="mt-3 block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {damageFiles.length > 0 && (
              <p className="text-xs font-semibold text-emerald-700 mt-2">
                {damageFiles.length} photo(s) selected
              </p>
            )}
          </div>
        </Card>

        {/* Repair Quotation Upload */}
        <Card>
          <CardHeader
            title="Repair Quotations"
            subtitle="Upload technician invoices or estimates"
            icon={FileText}
            badge="PDF / Image"
          />
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors bg-slate-50/50">
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-700">
              Upload repair quote document (PDF or scanned receipt)
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Up to 3 files (max 15MB each)</p>
            <input
              type="file"
              multiple
              accept=".pdf,image/jpeg,image/png"
              onChange={handleQuoteFileSelect}
              className="mt-3 block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {quoteFiles.length > 0 && (
              <p className="text-xs font-semibold text-emerald-700 mt-2">
                {quoteFiles.length} file(s) selected
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleUploadSubmit}
          loading={isUploading}
          disabled={damageFiles.length === 0 && quoteFiles.length === 0}
        >
          Test Upload to Backend
        </Button>
      </div>

      {/* Cost Comparison Engine Area */}
      <Card className="border-emerald-200">
        <CardHeader
          title="Deterministic Cost Comparison Calculator"
          subtitle="Transparent, rule-based mathematical analysis — zero AI hallucination"
          icon={Calculator}
          badge="Formula Verified"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estimated Repair Quotation ($)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  value={repairEstimate}
                  onChange={(e) => setRepairEstimate(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Refurbished / Equivalent Replacement Cost ($)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  value={replacementPrice}
                  onChange={(e) => setReplacementPrice(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-500 space-y-1">
              <p><strong>Formulas Applied:</strong></p>
              <p>• Cost Difference = Replacement Cost - Repair Cost</p>
              <p>• Repair Cost Ratio = (Repair Cost / Replacement Cost) × 100</p>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Upfront Metric Comparison
              </span>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400">Repair Cost Ratio</span>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    {repairCostPercentage}%
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Upfront Savings</span>
                  <div className={`text-3xl font-extrabold mt-1 ${costDifference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${costDifference}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-700/80 text-xs text-slate-300">
              {repairCostPercentage < 50 ? (
                <span className="text-emerald-300 font-semibold">
                  ✓ Repair cost is under 50% of replacement value. Economically favorable.
                </span>
              ) : repairCostPercentage < 75 ? (
                <span className="text-amber-300 font-semibold">
                  ⚠️ Repair is between 50%–75% of replacement. Factor in device age and battery health.
                </span>
              ) : (
                <span className="text-rose-300 font-semibold">
                  ✕ Repair exceeds 75% of replacement price. Purchasing a replacement is typically recommended.
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RepairAnalysis;

