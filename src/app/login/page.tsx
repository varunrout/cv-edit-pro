'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'register') {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }
      // Auto-login after registration
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(mode === 'register' ? 'Account created but login failed. Try logging in.' : 'Invalid email or password');
      setLoading(false);
      return;
    }

    // Refresh the page to pick up the session
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">CV Edit Pro</span>
          </div>
          <p className="text-sm text-gray-500">
            {mode === 'login' ? 'Sign in to access your saved resumes' : 'Create an account to save your work'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button onClick={() => { setMode('register'); setError(''); }} className="text-blue-600 hover:underline font-medium">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); }} className="text-blue-600 hover:underline font-medium">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
