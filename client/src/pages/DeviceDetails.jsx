import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, 
  Save, 
  RotateCcw, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import deviceService from '../services/deviceService';

export const DeviceDetails = () => {
  const navigate = useNavigate();

  const initialForm = {
    brand: '',
    model: '',
    deviceAge: '',
    condition: 'Good',
    warrantyStatus: 'Expired',
    problemDescription: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorResult, setErrorResult] = useState(null);

  const brandOptions = [
    'Apple',
    'Samsung',
    'Google Pixel',
    'OnePlus',
    'Xiaomi',
    'Motorola',
    'Nothing',
    'Sony',
    'Oppo / Vivo',
    'Other Brand',
  ];

  const conditionOptions = [
    'Pristine',
    'Good',
    'Fair',
    'Heavily Used',
    'Cracked / Damaged',
  ];

  const warrantyOptions = [
    'Under Warranty',
    'Expired',
    'Third-Party Warranty',
    'Unknown',
  ];

  const ageOptions = [
    'Less than 6 months',
    '6 to 12 months',
    '1 to 2 years',
    '2 to 3 years',
    '3 to 4 years',
    '4+ years',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData(initialForm);
    setSuccessResult(null);
    setErrorResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessResult(null);
    setErrorResult(null);

    // Basic client validation
    if (!formData.brand.trim() || !formData.model.trim() || !formData.problemDescription.trim()) {
      setErrorResult('Please complete all required fields (brand, model, and problem description).');
      setLoading(false);
      return;
    }

    if (formData.problemDescription.trim().length < 10) {
      setErrorResult('Problem description must be at least 10 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await deviceService.createDevice(formData);
      setSuccessResult(response);
    } catch (err) {
      setErrorResult(err.message || 'Failed to submit device details to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-emerald-700 tracking-wider">
          <Smartphone className="w-4 h-4" />
          Step 1: Baseline Assessment
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Device Information & Symptoms
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tell us about your smartphone so ReLife-Spark can establish market benchmarks and warranty context.
        </p>
      </div>

      {/* Notifications */}
      {errorResult && (
        <Alert
          type="error"
          title="Submission Notice"
          onClose={() => setErrorResult(null)}
        >
          {errorResult}
        </Alert>
      )}

      {successResult && (
        <Alert
          type="success"
          title="Device Details Successfully Stored!"
          onClose={() => setSuccessResult(null)}
        >
          <p className="mb-2">
            Record saved in MongoDB with ID:{' '}
            <code className="font-mono bg-emerald-100/60 px-1.5 py-0.5 rounded text-xs text-emerald-900">
              {successResult?.data?._id || 'Generated'}
            </code>
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate('/analysis')}
            >
              Proceed to Repair Analysis <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
            >
              Add Another Device
            </Button>
          </div>
        </Alert>
      )}

      {/* Intake Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Brand */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Smartphone Brand *
              </label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="">Select Manufacturer...</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Smartphone Model *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g. iPhone 13 Pro, Galaxy S22"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Device Age *
              </label>
              <select
                name="deviceAge"
                value={formData.deviceAge}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="">Select Age...</option>
                {ageOptions.map((age) => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Device Condition *
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                {conditionOptions.map((cond) => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>

            {/* Warranty Status */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Warranty Status *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {warrantyOptions.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      formData.warrantyStatus === opt
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="warrantyStatus"
                      value={opt}
                      checked={formData.warrantyStatus === opt}
                      onChange={handleChange}
                      className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Problem Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Description of the Device Problem *
              </label>
              <textarea
                name="problemDescription"
                rows={4}
                value={formData.problemDescription}
                onChange={handleChange}
                placeholder="Describe what happened (e.g. Phone dropped on pavement, screen is cracked and unresponsive, but vibration and sounds still work)..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Please provide specific symptoms (display, charging, water exposure, power cycle).
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Form
            </button>

            <Button
              type="submit"
              loading={loading}
              icon={Save}
            >
              Save Device Information
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default DeviceDetails;

