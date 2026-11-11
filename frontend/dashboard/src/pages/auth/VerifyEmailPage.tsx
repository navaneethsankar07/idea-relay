import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CheckCircle2, XCircle, Mail, Loader2 } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');
  const isSentNotification = searchParams.get('sent') === 'true';

  const [isLoading, setIsLoading] = useState<boolean>(Boolean(uid && token));
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (uid && token) {
      const verify = async () => {
        try {
          setIsLoading(true);
          await authApi.verifyEmail(uid, token);
          setIsSuccess(true);
        } catch (err: unknown) {
          setIsSuccess(false);
          setErrorMessage(err instanceof Error ? err.message : 'Invalid or expired verification link.');
        } finally {
          setIsLoading(false);
        }
      };
      verify();
    }
  }, [uid, token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    try {
      setIsResending(true);
      await authApi.resendVerificationEmail(resendEmail);
      setResendSuccess(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Email Verification"
      subtitle="Confirm your email address to access your IdeaRelay account."
    >
      <div className="space-y-6 text-center">
        {isLoading && (
          <div className="py-8 flex flex-col items-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-600 font-medium">Verifying your email address...</p>
          </div>
        )}

        {!isLoading && isSuccess && (
          <div className="py-6 flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Email Verified Successfully!</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Your email address has been verified. You can now access all IdeaRelay features.
            </p>
            <Link to="/login" className="w-full">
              <Button className="w-full">Proceed to Sign In</Button>
            </Link>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="py-6 flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Verification Failed</h3>
            <p className="text-xs text-rose-600 max-w-sm">{errorMessage}</p>

            <div className="w-full pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-600 mb-3">Need a new verification link?</p>
              <form onSubmit={handleResend} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="outline" className="w-full" isLoading={isResending}>
                  Resend Verification Email
                </Button>
              </form>
              {resendSuccess && (
                <p className="mt-2 text-xs text-emerald-600 font-medium">
                  Verification email sent! Please check your inbox.
                </p>
              )}
            </div>
          </div>
        )}

        {isSentNotification && !uid && (
          <div className="py-6 flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Verification Email Sent</h3>
            <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
              We've dispatched a confirmation link to your email address. Please click the link inside to activate your account.
            </p>
            <div className="pt-4 border-t border-slate-200 w-full flex justify-between items-center text-xs text-slate-500">
              <span>Didn't receive it?</span>
              <button
                type="button"
                onClick={() => setErrorMessage('Please enter your email address to request a new link.')}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Resend email
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
