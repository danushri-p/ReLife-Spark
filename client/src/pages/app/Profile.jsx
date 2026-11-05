import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, ShieldCheck, Clock, Scale, Wrench, Wallet, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import assessmentService from '../../services/assessmentService';
import { Avatar } from '../../components/app/AppLayout';
import { formatINR } from '../../utils/format';
import History from './History';

const StatTile = ({ icon: Icon, label, value, hint }) => (
  <div className="min-w-0 rounded-2xl border border-slate-200/70 bg-white p-5">
    <span className="flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-slate-500">
      <Icon className="h-4 w-4" /> {label}
    </span>
    <p className="mt-3 truncate text-2xl font-medium tabular-nums text-[#16201d]">{value}</p>
    {hint && <p className="mt-0.5 truncate text-xs text-slate-500">{hint}</p>}
  </div>
);

/** Signed-in user's profile: account details, a summary of their cases, and their full history. */
export const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    assessmentService
      .stats(user?.id)
      .then((res) => !cancelled && setStats(res.personal || null))
      .catch(() => !cancelled && setStats(null));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleSignOut = () => {
    navigate('/', { replace: true });
    signOut();
  };

  if (!user) return null;

  const s = stats || { total: 0, complete: 0, inProgress: 0, repaired: 0, moneyKept: 0 };

  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      {/* Account card */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#0d2f27] p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#2feaa8]/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <Avatar user={user} className="h-16 w-16 text-lg ring-4 ring-white/10 sm:h-20 sm:w-20 sm:text-xl" />
            <div className="min-w-0">
              <p className="text-[13px] uppercase tracking-[0.16em] text-[#7fffd4]">Your profile</p>
              <h2 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-medium tracking-tight sm:text-[1.9rem]">
                <span className="min-w-0 truncate">{user.name}</span>
                {user.demo && (
                  <span className="rounded bg-[#2feaa8] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#0b2a23]">Demo</span>
                )}
              </h2>
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-white/70">
                <Mail className="h-4 w-4 flex-shrink-0" /> <span className="truncate">{user.email}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 self-start rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 sm:self-auto"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        <dl className="relative mt-6 grid gap-4 border-t border-white/10 pt-5 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 text-white/70">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-[#7fffd4]" />
            <dt>Signed in with</dt>
            <dd className="font-medium text-white">{user.demo ? 'Demo account' : 'Google'}</dd>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <Clock className="h-4 w-4 flex-shrink-0 text-[#7fffd4]" />
            <dt>Signed in since</dt>
            <dd className="font-medium text-white">{user.signedInAt ? new Date(user.signedInAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</dd>
          </div>
        </dl>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={ClipboardList} label="Devices checked" value={s.total} hint={`${s.inProgress} still in progress`} />
        <StatTile icon={Scale} label="Decisions" value={s.complete} hint="cases with a saved verdict" />
        <StatTile icon={Wrench} label="Repaired" value={s.repaired} hint="kept in use instead of replaced" />
        <StatTile icon={Wallet} label="Money kept" value={formatINR(s.moneyKept)} hint="compared with buying new" />
      </section>

      {/* History */}
      <History embedded />
    </div>
  );
};

export default Profile;
