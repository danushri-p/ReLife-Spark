import React, { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
let gsiPromise;

/** Loads Google Identity Services once and resolves with window.google.accounts.id. */
export const loadGoogleIdentity = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google.accounts.id);
      script.onerror = () => {
        gsiPromise = undefined;
        reject(new Error('Could not load Google sign-in. Check your connection and try again.'));
      };
      document.head.appendChild(script);
    });
  }
  return gsiPromise;
};

/**
 * Renders Google's official "Sign in with Google" button.
 * onCredential receives the Google ID token (a JWT) after the user picks an account.
 */
export const GoogleSignInButton = ({ clientId, onCredential, onError, text = 'continue_with', width = 400 }) => {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Keep the latest callbacks without re-initialising Google on every render
  const handlers = useRef({ onCredential, onError });
  handlers.current = { onCredential, onError };

  useEffect(() => {
    let cancelled = false;

    loadGoogleIdentity()
      .then((gsi) => {
        if (cancelled || !containerRef.current) return;
        gsi.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) handlers.current.onCredential(response.credential);
            else handlers.current.onError?.(new Error('Google did not return a credential.'));
          },
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        gsi.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          logo_alignment: 'center',
          width,
        });
        setReady(true);
      })
      .catch((err) => !cancelled && handlers.current.onError?.(err));

    return () => {
      cancelled = true;
    };
  }, [clientId, text, width]);

  return (
    <div className="relative flex min-h-[44px] justify-center">
      {!ready && (
        <span className="absolute inset-0 flex items-center justify-center gap-2 rounded-md border border-slate-200 text-sm text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Loading Google sign-in…
        </span>
      )}
      <div ref={containerRef} />
    </div>
  );
};

export default GoogleSignInButton;
