import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Smartphone, 
  Receipt, 
  Calculator, 
  BookOpen, 
  ArrowRight, 
  ShieldCheck, 
  Leaf, 
  CheckCircle,
  Cpu,
  BarChart3
} from 'lucide-react';
import { Card } from '../components/ui/Card';

export const Home = () => {
  const features = [
    {
      icon: Smartphone,
      title: 'Device & Damage Intake',
      description: 'Document smartphone brand, model, age, and physical condition to tailor repair cost benchmarks.',
      badge: 'Step 1',
    },
    {
      icon: Receipt,
      title: 'Quotation Extraction',
      description: 'Upload PDF or digital technician estimates. Break down parts, labour fees, and warranty terms.',
      badge: 'Step 2',
    },
    {
      icon: Calculator,
      title: 'Transparent Cost Engine',
      description: 'Rule-based calculations comparing repair quotes directly against current device replacement values.',
      badge: 'Step 3',
    },
    {
      icon: BookOpen,
      title: 'RAG Knowledge Grounding',
      description: 'Access official OEM repair guides and warranty terms to ask technical questions with cited sources.',
      badge: 'Step 4',
    },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 border border-emerald-100/60 px-6 py-16 sm:px-12 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300/60 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            AI-Powered Smartphone Decision Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-none">
            Know before <span className="text-emerald-600">you pay.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Broken smartphone? Stop guessing whether to fix it or buy a replacement. 
            <span className="font-semibold text-slate-800"> ReLife-Spark</span> brings clarity to repair quotes, transparent cost comparisons, and document-backed advice.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/device"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-base hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all active:scale-[0.98]"
            >
              Get Started with Your Device
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-base hover:bg-slate-50 hover:border-slate-400 transition-all"
            >
              Explore Dashboard
            </Link>
          </div>

          {/* Value Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Deterministic Rule-Based Math
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Google Gemini 1.5 Flash
            </span>
            <span className="flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-emerald-600" />
              E-Waste Reduction Awareness
            </span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How ReLife-Spark Works
          </h2>
          <p className="text-slate-500 text-sm">
            A guided four-step workflow designed to evaluate your smartphone repair decision objectively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} hover className="flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {item.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Philosophy / Disclaimer Banner */}
      <section className="bg-slate-900 text-slate-100 rounded-3xl p-8 sm:p-12 border border-slate-800">
        <div className="max-w-3xl space-y-4">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Our Commitment to Objectivity
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            No biased claims. No fabricated diagnostics.
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            ReLife-Spark does not claim to diagnose internal hardware faults purely over software, 
            nor does it label local repair shops as dishonest based on price differences alone. 
            All mathematical formulas are transparent, and all technical literature is cited directly.
          </p>
          <div className="pt-2">
            <Link
              to="/device"
              className="inline-flex items-center gap-2 text-emerald-400 font-semibold hover:text-emerald-300 text-sm"
            >
              Start an assessment now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

