import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Smartphone, 
  LayoutDashboard, 
  Wrench, 
  BookOpen, 
  Activity, 
  Menu, 
  X,
  ShieldCheck
} from 'lucide-react';
import healthService from '../../services/healthService';

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'connected', 'disconnected', 'checking'

  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      try {
        const res = await healthService.getHealth();
        if (isMounted) {
          if (res.status === 'healthy') {
            setServerStatus('connected');
          } else {
            setServerStatus('warning');
          }
        }
      } catch (err) {
        if (isMounted) {
          setServerStatus('disconnected');
        }
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 30000); // Check every 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { name: 'Home', path: '/', icon: Sparkles },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Device Details', path: '/device', icon: Smartphone },
    { name: 'Repair Analysis', path: '/analysis', icon: Wrench },
    { name: 'Knowledge Assistant', path: '/assistant', icon: BookOpen },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                  ReLife<span className="text-emerald-600">-Spark</span>
                </span>
                <span className="hidden sm:inline-flex items-center text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  MVP Foundation
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden md:block">
                Know before you pay.
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Status Badge & Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Server status pill */}
            <div 
              className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                serverStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : serverStatus === 'checking'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
              title={`Backend status: ${serverStatus}`}
            >
              <span className={`w-2 h-2 rounded-full ${
                serverStatus === 'connected'
                  ? 'bg-emerald-500 animate-ping'
                  : serverStatus === 'checking'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500'
              }`} />
              <Activity className="w-3.5 h-3.5" />
              <span>
                {serverStatus === 'connected' && 'API Online'}
                {serverStatus === 'checking' && 'Connecting...'}
                {serverStatus === 'disconnected' && 'API Offline'}
              </span>
            </div>

            <Link
              to="/device"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 hover:shadow-md transition-all active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                {link.name}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Backend Server:</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              serverStatus === 'connected' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {serverStatus === 'connected' ? 'Connected (Port 5000)' : 'Not Connected'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

