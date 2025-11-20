import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      // If the client is a stub (or using a different supabase-js version) the
      // method may be missing. Provide a helpful message in that case.
      const authAny = (supabase.auth as any);
      if (typeof authAny?.signInWithOtp !== 'function') {
        setStatus('Supabase auth client is not configured for magic links in this environment.\nPlease set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and restart the dev server.');
        console.warn('signInWithOtp missing on supabase.auth', { auth: !!supabase });
        return;
      }

  const redirectTo = `${window.location.origin}/admin`;
  // signInWithOtp signature may accept options object with redirectTo
  const resp = await authAny.signInWithOtp({ email }, { redirectTo });
      if (resp?.error) {
        setStatus(`Error: ${resp.error.message || resp.error}`);
      } else {
        setStatus('Magic link sent. Check your email.');
      }
    } catch (err: any) {
      setStatus('Failed to send magic link: ' + String(err?.message || err));
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-24 p-6 bg-white/80 dark:bg-slate-900/80 rounded-md shadow">
      <h2 className="text-2xl font-semibold mb-4">Admin sign in</h2>
      <p className="text-sm text-muted-foreground mb-4">Enter your admin email to receive a magic link.</p>
      <form onSubmit={sendMagicLink} className="space-y-4">
        <input
          type="email"
          placeholder="you@domain.com"
          className="w-full border rounded px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="flex items-center gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Send magic link</button>
          <button type="button" className="px-3 py-2 border rounded" onClick={() => navigate('/')}>Cancel</button>
        </div>
      </form>
      {status && <p className="mt-4 text-sm">{status}</p>}
    </div>
  );
};

export default Login;
