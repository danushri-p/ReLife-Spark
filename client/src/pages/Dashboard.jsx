import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Smartphone, 
  Receipt, 
  Calculator, 
  BookOpen, 
  ArrowRight, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import healthService from '../services/healthService';

export const Dashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await healthService.getHealth();
        setHealthData(data);
      } catch (err) {
        setHealthData(null);
      } finally {
        setLoadingHealth(false);
      }
    };
    fetchHealth();
  }, []);

  const actionCards = [
    {
      title: 'Device Profile & Intake',
      description: 'Enter smartphone make, model, age, warranty, and symptoms to establish baseline specs.',
      link: '/device',
      linkText: 'Configure Device',
      icon: Smartphone,
      status: 'Active',
      color: 'border-emerald-200 bg-emerald-50/30',
    },
    {
      title: 'Quotation & Image Analysis',
      description: 'Upload damage photos and repair quotes (PDF/Image) to extract itemized costs.',
      link: '/analysis',
      linkText: 'Inspect Quotations',
      icon: Receipt,
      status: 'In Progress (M2)',
      color: 'border-blue-200 bg-blue-50/30',
    },
    {
      title: 'Knowledge Assistant (RAG)',
      description: 'Ask repair questions grounded in indexed OEM hardware maintenance manuals.',
      link: '/assistant',
      linkText: 'Ask Assistant',
      icon: BookOpen,
      status: 'In Progress (M3)',
      color: 'border-purple-200 bg-purple-50/30',
    },
  ];

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Repair Decision Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor device assessments, quotation comparisons, and backend service states.
          </p>
        </div>
        <Link
          to="/device"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-sm transition-all self-start sm:self-auto"
        >
          <Smartphone className="w-4 h-4" />
          New Assessment
        </Link>
      </div>

      {/* Backend & Environment Health Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Backend Server</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${healthData?.status === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <p className="text-lg font-bold text-slate-900">
                {loadingHealth ? 'Checking...' : healthData ? 'Express API Online' : 'Server Offline'}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Port: 5000 • Uptime: {healthData?.uptime || 'N/A'}
            </p>
          </div>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Database Connection</span>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${healthData?.database?.isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <p className="text-lg font-bold text-slate-900">
                {healthData?.database?.isConnected ? 'MongoDB Atlas Active' : 'DB Configuration Ready'}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              State: {healthData?.database?.status || 'Waiting for connection'}
            </p>
          </div>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Gemini AI Service</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${healthData?.aiIntegration?.geminiConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <p className="text-lg font-bold text-slate-900">
                {healthData?.aiIntegration?.geminiConfigured ? 'Gemini 1.5 Ready' : 'API Key Setup Ready'}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Model: {healthData?.aiIntegration?.model || 'gemini-1.5-flash'}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Feature Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Evaluation Workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {actionCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Card key={idx} hover className={`flex flex-col justify-between ${card.color}`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-800">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-xs border border-slate-200">
                      {card.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{card.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6">
                  <Link
                    to={card.link}
                    className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    {card.linkText} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 4-Step Process Guide */}
      <Card className="bg-slate-50 border-slate-200">
        <h3 className="font-bold text-slate-900 text-sm mb-4">
          How ReLife-Spark Computes Your Recommendation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-emerald-600 block mb-1">1. Age & Condition</span>
            Depreciation rate calculated from smartphone age and wear level.
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-emerald-600 block mb-1">2. Quote Extraction</span>
            Parts cost and labour cost separated to identify repair breakdown.
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-emerald-600 block mb-1">3. Repair Cost Ratio</span>
            Deterministic percentage formula: (Repair Cost / Replacement Cost) × 100.
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-emerald-600 block mb-1">4. Weighted Score</span>
            Final synthesis explaining pros, cons, and technician questions.
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;

