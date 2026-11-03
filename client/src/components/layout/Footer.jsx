import React from 'react';
import { Sparkles, Heart, Leaf, Shield, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-slate-900">ReLife-Spark</span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm">
              AI-powered smartphone repair decision platform. Helping consumers make transparent, economical, and sustainable repair choices.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              Repair smarter. Spend wisely. Reduce e-waste.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/dashboard" className="hover:text-emerald-600 transition-colors">Dashboard</Link></li>
              <li><Link to="/device" className="hover:text-emerald-600 transition-colors">Device Details</Link></li>
              <li><Link to="/analysis" className="hover:text-emerald-600 transition-colors">Repair Analysis</Link></li>
              <li><Link to="/assistant" className="hover:text-emerald-600 transition-colors">Knowledge Assistant</Link></li>
            </ul>
          </div>

          {/* Architecture / Trust */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Technology</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Deterministic Cost Engine
              </li>
              <li className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                Google Gemini 1.5 Flash
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                MongoDB Atlas Vector Search
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} ReLife-Spark. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with modern React, Tailwind CSS, Node.js & Gemini AI
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

