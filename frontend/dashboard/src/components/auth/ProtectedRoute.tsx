import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchCurrentUser } from '../../store/slices/authSlice';
import { getAccessToken } from '../../api/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // If not authenticated in store but we might have a session or access token, attempt fetch
    if (!isAuthenticated && !user && getAccessToken()) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500 font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
