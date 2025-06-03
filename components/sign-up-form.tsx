'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import {
  resendVerificationEmail,
  signupWithEmailPassword,
} from '@/lib/services/auth.service';
import { cn } from '@/lib/utils';
import { GoogleButton } from './google-button';

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signupWithEmailPassword(email, password);
      if (result) {
        setSignupSuccess(true);
        setSubmittedEmail(email);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (submittedEmail) {
      await resendVerificationEmail(submittedEmail);
    }
  };

  if (signupSuccess) {
    return (
      <div className='flex flex-col items-center gap-6'>
        <h2 className='text-xl font-semibold'>Check your inbox</h2>
        <p className='text-center'>
          We've sent a confirmation email to{' '}
          <span className='font-medium'>{submittedEmail}</span>. Please verify
          your email to continue.
        </p>
        <button
          className='btn btn-primary w-full'
          onClick={handleResend}
          type='button'
        >
          Resend verification email
        </button>
        <div className='mt-2 flex gap-2'>
          <a
            href='https://mail.google.com'
            target='_blank'
            rel='noopener noreferrer'
            className='btn btn-secondary'
          >
            Open Gmail
          </a>
          <a
            href='https://outlook.live.com'
            target='_blank'
            rel='noopener noreferrer'
            className='btn btn-secondary'
          >
            Open Outlook
          </a>
        </div>
        <button
          className='btn btn-link mt-4'
          type='button'
          onClick={() => router.push('/login')}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google Button */}
          <div className='mb-6'>
            <GoogleButton />
          </div>
          <form onSubmit={handleSignUp}>
            <div className='flex flex-col gap-6'>
              <div className='grid gap-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='m@example.com'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <div className='flex items-center'>
                  <Label htmlFor='password'>Password</Label>
                </div>
                <Input
                  id='password'
                  type='password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <div className='flex items-center'>
                  <Label htmlFor='repeat-password'>Repeat Password</Label>
                </div>
                <Input
                  id='repeat-password'
                  type='password'
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>

              {error && <p className='text-sm text-red-500'>{error}</p>}
              <Button
                type='submit'
                className='w-full'
                disabled={isLoading}
              >
                {isLoading ? 'Creating an account...' : 'Sign up'}
              </Button>
            </div>
            <div className='mt-4 text-center text-sm'>
              Already have an account?{' '}
              <Link
                href='/auth/login'
                className='underline underline-offset-4'
              >
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
