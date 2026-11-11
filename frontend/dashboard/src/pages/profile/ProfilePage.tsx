import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { updateUser, logoutUser } from '../../store/slices/authSlice';
import { authApi } from '../../api/authApi';
import { Navbar } from '../../components/layout/Navbar';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { User, CheckCircle2, ShieldAlert, KeyRound, AlertTriangle } from 'lucide-react';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  avatar_url: z.string().url('Please enter a valid image URL').or(z.literal('')),
});

const passwordSchema = z
  .object({
    old_password: z.string().optional(),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
      .regex(/[0-9]/, 'Must contain at least 1 number'),
    new_password_confirm: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.new_password_confirm, {
    message: 'Passwords do not match',
    path: ['new_password_confirm'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export const ProfilePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      avatar_url: user?.avatar_url || '',
    },
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      new_password_confirm: '',
    },
  });

  const onUpdateProfile = async (data: ProfileFormData) => {
    setProfileSuccess(false);
    setProfileError(null);
    try {
      const updated = await authApi.updateProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        avatar_url: data.avatar_url || null,
      });
      dispatch(updateUser(updated));
      setProfileSuccess(true);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile.');
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    setPasswordSuccess(false);
    setPasswordError(null);
    try {
      await authApi.changePassword({
        old_password: data.old_password || undefined,
        new_password: data.new_password,
        new_password_confirm: data.new_password_confirm,
      });
      setPasswordSuccess(true);
      resetPasswordForm();
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password.');
    }
  };

  const onDeactivateAccount = async () => {
    try {
      setIsDeactivating(true);
      await authApi.deactivateAccount();
      await dispatch(logoutUser());
      window.location.href = '/login';
    } catch (err: unknown) {
      setIsDeactivating(false);
      setProfileError(err instanceof Error ? err.message : 'Failed to deactivate account.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your personal profile, security credentials, and account status.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Profile Information</h2>
              <p className="text-xs text-slate-500">Update your name and profile picture.</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Profile updated successfully.</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                error={profileErrors.first_name?.message}
                {...registerProfile('first_name')}
              />
              <Input
                label="Last Name"
                error={profileErrors.last_name?.message}
                {...registerProfile('last_name')}
              />
            </div>

            <div>
              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                helperText="Email cannot be changed directly."
              />
              <div className="mt-1 flex items-center space-x-1.5 text-xs">
                {user?.is_email_verified ? (
                  <span className="text-emerald-600 font-medium flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Verified Email
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    Unverified Email
                  </span>
                )}
              </div>
            </div>

            <Input
              label="Avatar Image URL"
              placeholder="https://example.com/avatar.png"
              error={profileErrors.avatar_url?.message}
              helperText="URL to a publicly accessible image."
              {...registerProfile('avatar_url')}
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isProfileSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Security & Password</h2>
              <p className="text-xs text-slate-500">
                {user?.has_usable_password
                  ? 'Update your account password.'
                  : 'You authenticated with OAuth. You can set a password below to enable password login.'}
              </p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Password updated successfully.</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
            {user?.has_usable_password && (
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                error={passwordErrors.old_password?.message}
                {...registerPassword('old_password')}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                error={passwordErrors.new_password?.message}
                helperText="At least 8 characters, 1 uppercase, 1 number."
                {...registerPassword('new_password')}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                error={passwordErrors.new_password_confirm?.message}
                {...registerPassword('new_password_confirm')}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isPasswordSubmitting}>
                {user?.has_usable_password ? 'Update Password' : 'Set Password'}
              </Button>
            </div>
          </form>
        </div>

        {/* Danger Zone: Account Deactivation */}
        <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-rose-100 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
            <h2 className="text-base font-semibold text-rose-900">Danger Zone</h2>
          </div>

          <p className="text-xs text-slate-600">
            Deactivating your account will immediately revoke all active sessions and disable access.
          </p>

          {showDeactivateConfirm ? (
            <div className="p-4 bg-rose-50 rounded-lg border border-rose-200 space-y-3">
              <p className="text-xs font-semibold text-rose-900">
                Are you sure you want to deactivate your account?
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={onDeactivateAccount}
                  isLoading={isDeactivating}
                >
                  Confirm Deactivation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeactivateConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              onClick={() => setShowDeactivateConfirm(true)}
            >
              Deactivate Account
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
