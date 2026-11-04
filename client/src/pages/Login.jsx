import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { Check, CircleAlert, LoaderCircle, LockKeyhole, ArrowRight } from 'lucide-react';
import { useAuth, GOOGLE_CLIENT_ID } from '../context/AuthContext';

const benefits = [
  'Save your devices and pick up where you left off',
  'Keep a history of photo diagnoses and quote checks',
  'Track your Repair Scores and environmental impact',
];

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

export const Login = () => {
  const { user, loading, signInWithGoogle, signInDemo, googleEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSignup = location.pathname === '/signup';
  const redirectTo = location.state?.from || '/app';

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(false);

  if (!loading && user && !submitting) return <Navigate to={redirectTo} replace />;

  const handleCredential = (credential) => {
    setError('');
    setSubmitting(true);
    try {
      signInWithGoogle(credential);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid min-h-[calc(100svh-7rem)] max-w-7xl gap-6 px-3 py-6 sm:px-6 lg:grid-cols-2">
      {/* Form side */}
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-14 shadow-sm sm:px-12">
        <div className="w-full max-w-[400px]">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#0d4a3e]">
            {isSignup ? 'Get started free' : 'Welcome back'}
          </span>
          <h1 className="mt-3 text-[2.1rem] font-medium leading-tight tracking-tight text-[#16201d]">
            {isSignup ? 'Create your ReLife-Spark account' : 'Sign in to ReLife-Spark'}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            {isSignup
              ? 'Sign up with your Google account. No new password to remember.'
              : 'Continue with the Google account you used before.'}
          </p>

          <div className="mt-9">
            {googleEnabled ? (
              <div className={`relative flex justify-center ${submitting ? 'pointer-events-none opacity-60' : ''}`}>
                <GoogleSignInButton
                  clientId={GOOGLE_CLIENT_ID}
                  onCredential={handleCredential}
                  onError={(err) => setError(err.message || 'Google sign-in failed. Please try again.')}
                  text={isSignup ? 'signup_with' : 'continue_with'}
                />
              </div>
            ) : (
              <>
                {/* Shown until a Google client ID is connected; same look as Google's outline button */}
                <button
                  type="button"
                  onClick={() => setNotice(true)}
                  className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[#dadce0] bg-white text-[15px] font-medium text-[#3c4043] transition hover:border-[#d2e3fc] hover:bg-[#f8faff] active:bg-[#ecf3fe]"
                >
                  <GoogleLogo />
                  {isSignup ? 'Sign up with Google' : 'Continue with Google'}
                </button>
                {notice && (
                  <p role="status" className="mt-3 text-center text-sm text-slate-500">
                    Google sign-in is coming soon. Please check back shortly.
                  </p>
                )}
                <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    signInDemo();
                    navigate(redirectTo, { replace: true });
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0d5b46] text-[15px] font-medium text-white transition hover:bg-[#0a4a39]"
                >
                  Explore with a demo account <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}

            {submitting && (
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600" role="status">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Signing you in…
              </p>
            )}

            {error && (
              <div role="alert" className="mt-4 flex gap-2.5 rounded-md border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
                <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isSignup ? 'Already have an account? ' : 'New to ReLife-Spark? '}
            <Link
              to={isSignup ? '/login' : '/signup'}
              state={location.state}
              className="font-medium text-[#0d4a3e] hover:underline"
            >
              {isSignup ? 'Sign in' : 'Create an account'}
            </Link>
          </p>

          <div className="mt-10 border-t border-slate-100 pt-8">
            <ul className="space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex gap-2.5 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0d5b46]" />
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-8 flex gap-2 text-xs leading-relaxed text-slate-500">
              <LockKeyhole className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              We only receive your name, email and profile photo from Google. We never see your Google password.
            </p>
          </div>
        </div>
      </div>

      {/* Visual side */}
      <div className="relative hidden overflow-hidden rounded-xl bg-[#E3E5E7] lg:block">
        <img
          src="/phone-hero.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[75%_center]"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0d3a31]/85 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="text-xs uppercase tracking-[0.14em] text-[#9fe3c9]">Know before you pay</p>
          <p className="mt-3 max-w-md text-[1.9rem] font-medium leading-tight">
            A second opinion on every repair, before you spend a rupee.
          </p>
          <Link to="/" className="mt-5 inline-flex items-center gap-2 text-sm text-white/85 hover:text-white">
            Back to home <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Login;
