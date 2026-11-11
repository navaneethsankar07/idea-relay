import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/common/Button';
import { OAuthButtons } from '../../components/auth/OAuthButtons';
import { Link2, CheckCircle2, AlertCircle, Trash2, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LinkedAccountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['linked-accounts'],
    queryFn: () => authApi.getLinkedAccounts(),
  });

  const unlinkMutation = useMutation({
    mutationFn: (provider: string) => authApi.unlinkAccount(provider),
    onSuccess: (_, provider) => {
      setErrorMessage(null);
      setSuccessMessage(`${provider.toUpperCase()} disconnected successfully.`);
      queryClient.invalidateQueries({ queryKey: ['linked-accounts'] });
    },
    onError: (err: unknown) => {
      setSuccessMessage(null);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to disconnect account.');
    },
  });

  const linkedProviders = data?.linked_providers || [];
  const hasUsablePassword = Boolean(data?.has_usable_password);

  const isConnected = (provider: 'github' | 'google') =>
    linkedProviders.some((item) => item.provider === provider);

  const canDisconnect = (provider: 'github' | 'google') => {
    if (hasUsablePassword) return true;
    const otherProviders = linkedProviders.filter((item) => item.provider !== provider);
    return otherProviders.length > 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Linked Accounts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Connect external OAuth providers to log in to IdeaRelay quickly and securely.
          </p>
        </div>

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Connected Authentication Providers</h2>
              <p className="text-xs text-slate-500">
                You must always retain at least one usable authentication method (password or OAuth provider).
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading linked providers...</div>
          ) : (
            <div className="space-y-4">
              {/* Password Auth Status */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Password Authentication</h3>
                    <p className="text-xs text-slate-500">
                      {hasUsablePassword ? 'Password is configured for this account' : 'No password set'}
                    </p>
                  </div>
                </div>
                <div>
                  {hasUsablePassword ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  ) : (
                    <Link to="/profile">
                      <Button variant="outline" size="sm">
                        Set Password
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* GitHub Provider */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">GitHub</h3>
                    <p className="text-xs text-slate-500">
                      {isConnected('github')
                        ? `Connected (${linkedProviders.find((p) => p.provider === 'github')?.provider_email || 'Linked'})`
                        : 'Not connected'}
                    </p>
                  </div>
                </div>
                <div>
                  {isConnected('github') ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                      disabled={!canDisconnect('github') || unlinkMutation.isPending}
                      onClick={() => unlinkMutation.mutate('github')}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Disconnect
                    </Button>
                  ) : (
                    <div className="w-36">
                      <OAuthButtons mode="connect" />
                    </div>
                  )}
                </div>
              </div>

              {/* Google Provider */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Google</h3>
                    <p className="text-xs text-slate-500">
                      {isConnected('google')
                        ? `Connected (${linkedProviders.find((p) => p.provider === 'google')?.provider_email || 'Linked'})`
                        : 'Not connected'}
                    </p>
                  </div>
                </div>
                <div>
                  {isConnected('google') ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                      disabled={!canDisconnect('google') || unlinkMutation.isPending}
                      onClick={() => unlinkMutation.mutate('google')}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Disconnect
                    </Button>
                  ) : (
                    <div className="w-36">
                      <OAuthButtons mode="connect" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LinkedAccountsPage;
