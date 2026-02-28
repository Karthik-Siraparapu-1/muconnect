import React, { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export function AuthPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('male');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/login' : '/api/signup';
      const body = isLogin ? { email, password } : { email, password, gender };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isLogin) {
        onLogin(data.user);
        navigate('/dashboard');
      } else {
        // Auto login after signup
        onLogin({ id: data.userId, email, gender });
        navigate('/onboarding');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            {isLogin ? 'Welcome back' : 'Join MU Connect'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            {isLogin ? 'Sign in to your account' : 'Connect with your campus crush'}
          </p>
        </div>

        <div className="flex justify-center space-x-4 border-b border-slate-200 pb-4">
          <button
            onClick={() => setIsLogin(true)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              isLogin ? "text-rose-600 border-b-2 border-rose-600" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              !isLogin ? "text-rose-600 border-b-2 border-rose-600" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Sign Up
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="relative block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-rose-600 sm:text-sm sm:leading-6"
                placeholder="Email address (@marwadiuniversity.ac.in)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-rose-600 sm:text-sm sm:leading-6"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {!isLogin && (
              <div>
                <label htmlFor="gender" className="sr-only">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  required
                  className="relative block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-rose-600 sm:text-sm sm:leading-6"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="text-center text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-70"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create account')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
