'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConvexError } from 'convex/values';
import { useAuthActions } from '@convex-dev/auth/react';
import { AlertCircle, Mail } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

type AuthStep = 'signIn' | 'signUp' | 'forgotPassword' | 'resetPassword';

export const LoginForm = () => {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<AuthStep>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetFormState = () => {
    setEmail('');
    setPassword('');
    setCode('');
    setNewPassword('');
    setError('');
    setLoading(false);
  };

  const changeStep = (newStep: AuthStep) => {
    resetFormState();
    setStep(newStep);
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setError('Please enter a valid email address.');
      return false;
    }
    setError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (
      value.length < 8 ||
      !/\d/.test(value) ||
      !/[a-z]/.test(value) ||
      !/[A-Z]/.test(value)
    ) {
      setError(
        'Password must be 8+ characters with uppercase, lowercase, and numbers.'
      );
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!validateEmail(email) || !validatePassword(password)) return;

    setLoading(true);
    setError('');

    try {
      await signIn('password', { name, email, password, flow: step });

      if (step === 'signUp') {
        setPassword('');
      }
    } catch (err: any) {
      console.error(`${step} error:`, err);
      setError('Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);

    if (error) {
      // Clear error when user starts typing again
      validateEmail(e.target.value);
    }
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    try {
      void signIn('google');
    } catch (error) {
      console.error(error);

      toast.error('Could not login with Google', {
        description: 'Please try again later.',
      });

      setLoading(false);
    }
  };

  return (
    <div className='w-full max-w-sm'>
      <Card>
        <CardHeader className='text-center'>
          {/* <CardDescription>{`Acquire fluency one lesson at a time with your AI language teacher`}</CardDescription> */}
        </CardHeader>
        <CardContent>
          <div className='grid gap-6'>
            <div className='flex flex-col gap-4'>
              <Button
                variant='outline'
                className='w-full'
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg
                  className='mr-2 h-4 w-4'
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                >
                  <path
                    d='M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z'
                    fill='currentColor'
                  />
                </svg>
                Login with Google
              </Button>
            </div>

            <div className='relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border'>
              <span className='relative z-10 bg-card px-2 text-muted-foreground'>
                Or continue with
              </span>
            </div>

            {error && (
              <div className='bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center'>
                <AlertCircle className='h-4 w-4 mr-2' />
                {error}
              </div>
            )}

            <form className='flex flex-col' onSubmit={handleSubmit}>
              <div className='grid gap-6'>
                <div className='grid gap-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    name='email'
                    autoComplete='email'
                    placeholder='m@example.com'
                    required
                    value={email}
                    onChange={handleEmailChange}
                    className={error ? 'border-destructive' : ''}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='password'>Password</Label>
                  <Input
                    id='password'
                    type='password'
                    name='password'
                    autoComplete='password'
                    placeholder='Password'
                    required
                    value={password}
                    onChange={(value) => setPassword(value.target.value)}
                    className={error ? 'border-destructive' : ''}
                  />
                </div>

                <Button type='submit' disabled={loading} className='mt-4'>
                  {loading ? (
                    <svg
                      className='mr-2 h-4 w-4 animate-spin'
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
                  ) : null}
                  Login with Email
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
