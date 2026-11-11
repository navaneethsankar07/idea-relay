import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Navbar } from '../../components/layout/Navbar';
import { Layers, Database, Radio, CheckCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/30 text-indigo-100 border border-indigo-400/30 mb-3">
              Phase 2: Authentication Active
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.first_name || user?.email}!
            </h1>
            <p className="mt-2 text-indigo-100 text-sm max-w-xl">
              IdeaRelay multi-tenant feedback platform authentication and account management is active.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/profile"
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-50 shadow-sm transition-colors"
            >
              Manage Profile
            </Link>
            <Link
              to="/settings/linked-accounts"
              className="px-4 py-2 bg-indigo-700/60 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 border border-indigo-500/40 transition-colors"
            >
              Linked Providers
            </Link>
          </div>
        </div>

        {/* Security & User Status Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Authenticated Session Active</h3>
              <p className="text-xs text-slate-500">
                Logged in as <span className="font-medium text-slate-700">{user?.email}</span>
                {user?.is_email_verified && ' (Verified)'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              JWT Authenticated
            </span>
          </div>
        </div>

        {/* Stack Foundations Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Frontend Dashboard</h2>
            <p className="mt-1 text-xs text-slate-500">
              React 18 + Vite + TypeScript + Tailwind CSS + TanStack Query + Redux Toolkit
            </p>
            <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Operational
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Django Backend</h2>
            <p className="mt-1 text-xs text-slate-500">
              Django 5.1 + DRF + SimpleJWT + Google/GitHub OAuth + Neon PostgreSQL
            </p>
            <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Operational
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Radio className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Realtime Service</h2>
            <p className="mt-1 text-xs text-slate-500">
              Node.js + TypeScript service for Neon Realtime authorized subscriptions
            </p>
            <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Operational
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        IdeaRelay &copy; {new Date().getFullYear()} - Multi-Tenant Feedback Management Platform
      </footer>
    </div>
  );
};

export default DashboardPage;
