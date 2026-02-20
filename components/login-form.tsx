'use client';

import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const LoginForm = () => {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const validatePassword = (value: string) =>
    value.length >= 8 &&
    /\d/.test(value) &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!validatePassword(password)) {
      setError(
        'Password must be 8+ characters with uppercase, lowercase, and numbers.',
      );
      return;
    }

    setLoading(true);
    try {
      await signIn('password', { email, password, flow: 'signIn' });
    } catch {
      setError('Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    try {
      void signIn('google');
    } catch {
      toast.error('Could not login with Google', {
        description: 'Please try again later.',
      });
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className='rounded-2xl border border-black/10 bg-white/70 backdrop-blur-md shadow-xl shadow-black/10 p-7'
      style={{
        boxShadow:
          '0 8px 48px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.9) inset',
      }}
    >
      {/* Google button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        className='w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-black/15 bg-white hover:bg-black/[0.03] active:scale-[0.98] transition-all duration-150 font-semibold text-sm text-black disabled:opacity-50 shadow-sm'
      >
        {googleLoading ? (
          <Spinner />
        ) : (
          <svg className='w-4 h-4' viewBox='0 0 24 24'>
            <path
              d='M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z'
              fill='currentColor'
            />
          </svg>
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className='relative my-5 flex items-center'>
        <div className='flex-1 border-t border-black/10' />
        <span className='mx-4 text-xs font-medium text-black/35 tracking-wide uppercase'>
          or
        </span>
        <div className='flex-1 border-t border-black/10' />
      </div>

      {/* Error */}
      {error && (
        <div className='mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600'>
          <AlertCircle className='h-4 w-4 mt-0.5 shrink-0' />
          <span>{error}</span>
        </div>
      )}

      {/* Email/Password form */}
      <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
        <div className='flex flex-col gap-1.5'>
          <label
            htmlFor='email'
            className='text-xs font-semibold text-black/50 uppercase tracking-wide'
          >
            Email
          </label>
          <input
            id='email'
            type='email'
            autoComplete='email'
            placeholder='you@example.com'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='h-11 w-full rounded-xl border border-black/15 bg-white/80 px-4 text-sm text-black placeholder:text-black/30 outline-none focus:border-black/40 focus:ring-2 focus:ring-black/10 transition-all duration-150'
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <label
            htmlFor='password'
            className='text-xs font-semibold text-black/50 uppercase tracking-wide'
          >
            Password
          </label>
          <input
            id='password'
            type='password'
            autoComplete='current-password'
            placeholder='••••••••'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='h-11 w-full rounded-xl border border-black/15 bg-white/80 px-4 text-sm text-black placeholder:text-black/30 outline-none focus:border-black/40 focus:ring-2 focus:ring-black/10 transition-all duration-150'
          />
        </div>

        <button
          type='submit'
          disabled={loading || googleLoading}
          className='mt-1 h-11 w-full rounded-xl bg-black text-[#FAD40B] font-bold text-sm tracking-wide hover:bg-black/80 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-black/20'
        >
          {loading ? <Spinner light /> : null}
          Sign in
        </button>
      </form>
    </div>
  );
};

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <svg
      className={`h-4 w-4 animate-spin ${light ? 'text-[#FAD40B]' : 'text-black'}`}
      viewBox='0 0 24 24'
    >
      <circle
        className='opacity-25'
        cx='12'
        cy='12'
        r='10'
        stroke='currentColor'
        strokeWidth='4'
        fill='none'
      />
      <path
        className='opacity-75'
        fill='currentColor'
        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
      />
    </svg>
  );
}
