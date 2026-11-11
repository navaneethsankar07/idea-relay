import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { MailCheck } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(data.email);
      setIsSubmitted(true);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to request password reset.');
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and we'll send you instructions to reset your password."
    >
      {isSubmitted ? (
        <div className="py-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <MailCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Check your email</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            If an account exists for <span className="font-semibold text-slate-900">{getValues('email')}</span>,
            you will receive an email with password reset instructions shortly.
          </p>
          <div className="pt-4 border-t border-slate-200">
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              {serverError}
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Send Reset Instructions
          </Button>

          <p className="text-center text-xs text-slate-600 pt-2">
            Remembered your password?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
