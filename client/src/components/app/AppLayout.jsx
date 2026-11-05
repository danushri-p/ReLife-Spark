import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, LogOut, ChevronDown, X, CornerDownLeft, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const appNav = [
  { to: '/app', label: 'Overview', end: true },
  { to: '/device', label: 'Assess' },
  { to: '/analysis', label: 'Analyze' },
  { to: '/assistant', label: 'Assistant' },
  { to: '/dashboard', label: 'Impact' },
  { to: '/profile', label: 'Profile' },
];

const initials = (user) =>
  (user.name || user.email)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const Avatar = ({ user, className = 'h-8 w-8 text-xs' }) =>
  user.picture ? (
    <img src={user.picture} alt="" referrerPolicy="no-referrer" className={`${className} rounded-full object-cover`} />
  ) : (
    <span className={`${className} flex flex-shrink-0 items-center justify-center rounded-full bg-[#0d5b46] font-mono font-medium text-white`}>
      {initials(user)}
    </span>
  );

/** ReLife-Spark logo mark. */
const Mark = () => <img src="/logo.png" alt="" className="h-9 w-auto flex-shrink-0 object-contain" />;

const AccountMenu = ({ user, onSignOut }) => {
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
        className="flex items-center gap-1.5 rounded-full border border-[#E3DED3] bg-[#FFFDF8] p-0.5 pr-2 transition hover:border-[#141414]/30"
      >
        <Avatar user={user} />
        <ChevronDown className={`h-3.5 w-3.5 text-[#6B6760] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[#E3DED3] bg-[#FFFDF8] p-1.5 shadow-[0_20px_40px_-20px_rgba(20,20,20,0.35)]">
          <div className="flex items-center gap-3 border-b border-[#E3DED3] px-2.5 pb-3 pt-2">
            <Avatar user={user} className="h-9 w-9 text-xs" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#141414]">
                {user.name}
                {user.demo && (
                  <span className="ml-1.5 rounded bg-[#0d5b46] px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">Demo</span>
                )}
              </p>
              <p className="truncate text-xs text-[#9A958B]">{user.email}</p>
            </div>
          </div>
          <Link
            to="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[#141414] hover:bg-[#F4F1EA]"
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
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-[#141414] hover:bg-[#F4F1EA]"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
};

/** "Ask anything" overlay — sends the question to the assistant. Opens with the search button or Ctrl/⌘+K. */
const AskOverlay = ({ open, onClose, onAsk }) => {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-[#141414]/40 px-4 pt-[12vh]" onMouseDown={onClose}>
      <form
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) onAsk(q.trim());
        }}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#E3DED3] bg-[#FFFDF8] shadow-2xl"
        role="search"
      >
        <div className="flex items-center gap-3 border-b border-[#E3DED3] px-4 py-3.5">
          <Search className="h-5 w-5 text-[#9A958B]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            placeholder="Ask about a repair, a part or your warranty…"
            aria-label="Ask the assistant"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-[#141414] outline-none placeholder:text-[#9A958B]"
          />
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-[#9A958B] hover:bg-[#F4F1EA]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-[#9A958B]">
          <span>Answers from repair manuals &amp; warranty policies</span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" /> to ask
          </span>
        </div>
      </form>
    </div>
  );
};

export const AppLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => setAskOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAskOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSignOut = () => {
    navigate('/', { replace: true });
    signOut();
  };

  const tabClass = ({ isActive }) =>
    `relative whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${
      isActive ? 'bg-[#141414] text-[#FFFDF8]' : 'text-[#6B6760] hover:bg-[#EAE5DA] hover:text-[#141414]'
    }`;

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#141414] selection:bg-[#0d5b46] selection:text-white">
      <header className="sticky top-0 z-40 border-b border-[#E3DED3] bg-[#F4F1EA]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/app" className="flex flex-shrink-0 items-center gap-2.5">
            <Mark />
            <span className="font-display text-[22px] leading-none tracking-tight">ReLife-Spark</span>
          </Link>

          <nav aria-label="App" className="mx-auto hidden items-center gap-1 rounded-xl border border-[#E3DED3] bg-[#FFFDF8] p-1 md:flex">
            {appNav.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={tabClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <button
              type="button"
              onClick={() => setAskOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3 py-2 text-sm text-[#9A958B] transition hover:border-[#141414]/30 lg:flex"
            >
              <Search className="h-4 w-4" /> Ask
              <kbd className="rounded border border-[#E3DED3] px-1 font-mono text-[10px]">Ctrl K</kbd>
            </button>
            <button
              type="button"
              onClick={() => setAskOpen(true)}
              aria-label="Ask the assistant"
              className="rounded-lg border border-[#E3DED3] bg-[#FFFDF8] p-2 text-[#6B6760] lg:hidden"
            >
              <Search className="h-4 w-4" />
            </button>
            <Link
              to="/device"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d5b46] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#0a4a39]"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New case</span>
            </Link>
            <AccountMenu user={user} onSignOut={handleSignOut} />
          </div>
        </div>

        {/* Mobile tabs */}
        <nav aria-label="App" className="flex gap-1 overflow-x-auto border-t border-[#E3DED3] px-4 py-2 md:hidden">
          {appNav.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={tabClass}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <AskOverlay
        open={askOpen}
        onClose={() => setAskOpen(false)}
        onAsk={(q) => {
          setAskOpen(false);
          navigate('/assistant', { state: { prompt: q } });
        }}
      />
    </div>
  );
};

export default AppLayout;
