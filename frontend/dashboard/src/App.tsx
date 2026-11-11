import React from 'react';
import { Layers, Activity, Database, Radio, CheckCircle } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              IR
            </div>
            <span className="font-semibold text-xl tracking-tight text-slate-900">
              IdeaRelay
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              Dashboard
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>System Operational</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Platform Foundations Initialized</h1>
          <p className="mt-1 text-sm text-slate-500">
            IdeaRelay multi-tenant feedback management architecture is ready.
          </p>
        </div>

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
              Ready
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Django Backend</h2>
            <p className="mt-1 text-xs text-slate-500">
              Django REST Framework + SimpleJWT + PostgreSQL (Neon)
            </p>
            <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Configured
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
              Configured
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Stack Verification</h3>
          </div>
          <ul className="text-sm text-slate-600 space-y-2">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><strong>Frontend:</strong> React Router, TanStack Query, Redux Toolkit, React Hook Form, Zod</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><strong>Testing:</strong> Vitest &amp; React Testing Library configured</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><strong>Widget:</strong> Standalone embeddable JavaScript widget package</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        IdeaRelay &copy; {new Date().getFullYear()} - Multi-Tenant Feedback Platform
      </footer>
    </div>
  );
};

export default App;
