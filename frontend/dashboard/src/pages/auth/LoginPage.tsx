import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { loginUser } from '../../store/slices/authSlice';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { OAuthButtons } from '../../components/auth/OAuthButtons';
import { loginSchema, LoginFormData } from '../../validation/authSchemas';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const [serverError, setServerError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const result = await dispatch(loginUser({ email: data.email, password: data.password }));
      if (loginUser.fulfilled.match(result)) {
        navigate(from, { replace: true });
      } else if (loginUser.rejected.match(result)) {
        setServerError(result.payload || 'Invalid email or password.');
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'An error occurred during login.');
    }
  };

  return (
    <AuthLayout
      title="Welcome back to IdeaRelay"
      subtitle="Sign in to your account to manage feedback and projects."
    >
      <div className="space-y-6">
        <OAuthButtons mode="login" />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-500 font-medium">Or continue with email</span>
          </div>
        </div>

        {serverError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                {...register('rememberMe')}
              />
              <span>Remember me</span>
            </label>

            <Link
              to="/forgot-password"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign up for free
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
