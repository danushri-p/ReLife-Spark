import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Gauge, LogOut, LayoutDashboard, UserRound, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Avatar = ({ user, size = 'h-9 w-9' }) =>
  user.picture ? (
    <img src={user.picture} alt="" referrerPolicy="no-referrer" className={`${size} rounded-full object-cover`} />
  ) : (
    <span className={`${size} flex items-center justify-center rounded-full bg-[#0d5b46] text-sm font-medium text-white`}>
      {(user.name || user.email || '?').charAt(0).toUpperCase()}
    </span>
  );

/** Signed-in avatar with a small dropdown (dashboard, sign out). */
const UserMenu = ({ user, onSignOut }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition hover:bg-slate-100"
      >
        <Avatar user={user} />
        <span className="max-w-[120px] truncate text-[15px] text-slate-800">{user.name?.split(' ')[0] || 'Account'}</span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          <div className="flex items-center gap-3 border-b border-slate-100 px-2 pb-3 pt-1">
            <Avatar user={user} size="h-10 w-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <Link
            to="/app"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <LayoutDashboard className="h-4 w-4" /> Open app
          </Link>
          <Link
            to="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <UserRound className="h-4 w-4" /> Profile &amp; history
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header
      className={`${
        isHome ? 'absolute top-0 left-0 right-0' : 'sticky top-0'
      } z-50 w-full pt-3 sm:pt-4 px-3 sm:px-6 max-w-7xl mx-auto transition-all`}
    >
      {/* On the home hero the bar is transparent so the phone render stays visible */}
      <div
        className={`flex items-center justify-between gap-6 py-3.5 ${
          isHome ? 'px-0 sm:px-0' : 'rounded-md border border-white/80 bg-white px-5 shadow-sm sm:px-6'
        }`}
      >
        
        {/* Left Brand Identity (Exact from Screenshot) */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-lg bg-[#0d5b46] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-medium text-base sm:text-lg text-slate-900">
                ReLife-<span className="text-[#0d5b46]">Spark</span>
              </span>
            </div>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Know before you pay.
            </p>
          </div>
        </Link>

        {/* Account */}
        <div className="flex items-center">
          {loading ? (
            <span className="h-9 w-24 animate-pulse rounded-full bg-slate-100" aria-hidden="true" />
          ) : user ? (
            <UserMenu user={user} onSignOut={handleSignOut} />
          ) : (
            <Link
              to="/login"
              state={{ from: ['/', '/login', '/signup'].includes(location.pathname) ? undefined : `${location.pathname}${location.search}` }}
              className="flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-[15px] text-slate-800 shadow-sm backdrop-blur-md transition-colors hover:bg-white hover:text-slate-950"
            >
              Sign In <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
