import React from 'react';
import { Gauge, Cpu, Shield, Database, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-300/60 bg-[#DDE0E3] text-slate-600 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0d4a3e] flex items-center justify-center text-white">
                <Gauge className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-slate-900 tracking-tight">
                ReLife-<span className="text-[#0d4a3e]">Spark</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Deterministic repair-or-replace decision engine for phones, laptops and other electronics, combining multi-modal Gemini damage vision, regional quotation benchmarks, and verified OEM schematic retrieval.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs">
              <Award className="w-3.5 h-3.5 text-[#0d4a3e]" />
              <span>Know before you pay · Mathematical transparency</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="hover:text-[#0d4a3e] transition-colors">
                  Landing
                </Link>
              </li>
              <li>
                <Link to="/login" state={{ from: '/analysis' }} className="hover:text-[#0d4a3e] transition-colors">
                  Diagnostic Lab
                </Link>
              </li>
              <li>
                <Link to="/login" state={{ from: '/device' }} className="hover:text-[#0d4a3e] transition-colors">
                  Device Intake
                </Link>
              </li>
              <li>
                <Link to="/login" state={{ from: '/assistant' }} className="hover:text-[#0d4a3e] transition-colors">
                  Knowledge Copilot
                </Link>
              </li>
              <li>
                <Link to="/login" state={{ from: '/dashboard' }} className="hover:text-[#0d4a3e] transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Architecture</h4>
            <ul className="space-y-3 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#0d4a3e] flex-shrink-0" />
                <span>Google Gemini 1.5 Pro</span>
              </li>
              <li className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#0d4a3e] flex-shrink-0" />
                <span>MongoDB Atlas Vector Search</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0d4a3e] flex-shrink-0" />
                <span>Deterministic Scoring Engine</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-300/70 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} ReLife-Spark. All rights reserved.</p>
          <p>Zero Financial Hallucination · Verified OEM Manuals</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
