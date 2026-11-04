import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/*
 * Frontend-only Google sign-in.
 * The Google ID token is decoded in the browser to get the user's profile, and the
 * profile is remembered in localStorage. There is no backend verification, so treat
 * this as UI personalisation only — not as protection for server data.
 */

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const STORAGE_KEY = 'relife-spark:user';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

const AuthContext = createContext(null);

/** Decodes the payload of a JWT (base64url) without verifying its signature. */
const decodeJwt = (token) => {
  const part = token.split('.')[1];
  if (!part) throw new Error('Malformed Google credential.');
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('')
  );
  return JSON.parse(json);
};

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (!user?.email || Date.now() - user.signedInAt > SESSION_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  /** Turns a Google ID token into a signed-in user. Throws if the token looks wrong. */
  const signInWithGoogle = useCallback((credential) => {
    const p = decodeJwt(credential);

    if (p.aud !== GOOGLE_CLIENT_ID) throw new Error('This Google sign-in was issued for a different app.');
    if (!['accounts.google.com', 'https://accounts.google.com'].includes(p.iss)) throw new Error('Unexpected sign-in issuer.');
    if (p.exp * 1000 < Date.now()) throw new Error('Google sign-in expired. Please try again.');
    if (!p.email || p.email_verified === false) throw new Error('Your Google account email must be verified.');

    const isNewUser = !localStorage.getItem(`${STORAGE_KEY}:seen:${p.sub}`);
    const next = {
      id: p.sub,
      email: p.email,
      name: p.name || p.email,
      picture: p.picture,
      signedInAt: Date.now(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      localStorage.setItem(`${STORAGE_KEY}:seen:${p.sub}`, '1');
    } catch {
      /* storage blocked (private mode) — stay signed in for this tab only */
    }

    setUser(next);
    return { user: next, isNewUser };
  }, []);

  /** Signs in a local demo account so the app can be explored before Google is connected. */
  const signInDemo = useCallback(() => {
    const next = {
      id: 'demo',
      email: 'demo@relife-spark.app',
      name: 'Demo User',
      picture: null,
      demo: true,
      signedInAt: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setUser(next);
    return { user: next, isNewUser: false };
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    window.google?.accounts?.id?.disableAutoSelect();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading: false, signInWithGoogle, signInDemo, signOut, googleEnabled: Boolean(GOOGLE_CLIENT_ID) }),
    [user, signInWithGoogle, signInDemo, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
