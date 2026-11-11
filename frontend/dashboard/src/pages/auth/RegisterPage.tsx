import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { registerUser } from '../../store/slices/authSlice';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { OAuthButtons } from '../../components/auth/OAuthButtons';
import { registerSchema, RegisterFormData } from '../../validation/authSchemas';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      password_confirm: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const resultAction = await dispatch(registerUser(data));
      if (registerUser.fulfilled.match(resultAction)) {
        navigate('/verify-email?sent=true');
      } else if (registerUser.rejected.match(resultAction)) {
        setServerError(resultAction.payload || 'Registration failed.');
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  return (
    <AuthLayout
      title="Create your IdeaRelay account"
      subtitle="Start gathering customer feedback and building better products today."
    >
      <div className="space-y-6">
        <OAuthButtons mode="register" />

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
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="Jane"
              error={errors.first_name?.message}
              {...register('first_name')}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              error={errors.last_name?.message}
              {...register('last_name')}
            />
          </div>

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
            helperText="At least 8 characters, with 1 uppercase letter and 1 number."
            {...register('password')}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.password_confirm?.message}
            {...register('password_confirm')}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-xs text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
