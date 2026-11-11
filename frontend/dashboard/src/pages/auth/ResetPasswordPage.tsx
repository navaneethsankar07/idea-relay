import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../api/authApi';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { CheckCircle2 } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    new_password_confirm: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.new_password_confirm, {
    message: 'Passwords do not match',
    path: ['new_password_confirm'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: '',
      new_password_confirm: '',
    },
  });

  if (!uid || !token) {
    return (
      <AuthLayout title="Invalid Reset Link" subtitle="The password reset link is invalid or incomplete.">
        <div className="text-center py-4 space-y-4">
          <p className="text-xs text-rose-600">Please request a new password reset link.</p>
          <Link to="/forgot-password">
            <Button variant="outline" className="w-full">
              Request New Link
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null);
    try {
      await authApi.resetPassword({
        uid,
        token,
        new_password: data.new_password,
        new_password_confirm: data.new_password_confirm,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to reset password. Link may have expired.');
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Your new password must be different from previously used passwords."
    >
      {isSuccess ? (
        <div className="py-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Password Reset Complete</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Button className="w-full" onClick={() => navigate('/login')}>
            Proceed to Sign In
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              {serverError}
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            error={errors.new_password?.message}
            helperText="At least 8 characters, with 1 uppercase letter and 1 number."
            {...register('new_password')}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            error={errors.new_password_confirm?.message}
            {...register('new_password_confirm')}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Reset Password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPasswordPage;
