import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { User as UserIcon, Link2, LogOut, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              IR
            </div>
            <span className="font-semibold text-xl tracking-tight text-slate-900">
              IdeaRelay
            </span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
              <Link
                to="/"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>Profile</span>
              </Link>
              <Link
                to="/settings/linked-accounts"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
              >
                <Link2 className="w-4 h-4" />
                <span>Linked Accounts</span>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <Link to="/profile" className="flex items-center space-x-2 text-sm text-slate-700 hover:text-indigo-600">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-xs">
                    {user.first_name ? user.first_name[0].toUpperCase() : user.email[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline font-medium">{user.full_name}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-50"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-lg shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
