import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { setAuth } from '../../store/slices/authSlice';
import { authApi } from '../../api/authApi';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button } from '../../components/common/Button';
import { Loader2, XCircle } from 'lucide-react';

export const OAuthCallbackPage: React.FC = () => {
  const { provider } = useParams<{ provider: 'github' | 'google' }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const code = searchParams.get('code');
  const state = searchParams.get('state') || undefined;
  const errorParam = searchParams.get('error');

  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam ? `Authorization was cancelled or denied by ${provider}.` : null
  );

  useEffect(() => {
    if (errorParam || !code || !provider) {
      if (!errorParam && (!code || !provider)) {
        setErrorMessage('Missing authorization code from OAuth provider.');
      }
      return;
    }

    const exchangeCode = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
        const response = await authApi.oauthCallback(provider, code, state, redirectUri);
        dispatch(setAuth({ user: response.user, accessToken: response.tokens.access }));
        navigate('/', { replace: true });
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : `Failed to complete ${provider} authentication.`
        );
      }
    };

    exchangeCode();
  }, [code, provider, state, errorParam, dispatch, navigate]);

  return (
    <AuthLayout
      title={`Authenticating with ${provider ? provider.toUpperCase() : 'OAuth'}`}
      subtitle="Please wait while we connect your account..."
    >
      <div className="py-8 text-center space-y-4">
        {errorMessage ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Authentication Failed</h3>
            <p className="text-xs text-rose-600 max-w-sm">{errorMessage}</p>
            <div className="pt-4 border-t border-slate-200 w-full">
              <Link to="/login">
                <Button className="w-full">Return to Sign In</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-600 font-medium">Completing secure sign in...</p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default OAuthCallbackPage;
