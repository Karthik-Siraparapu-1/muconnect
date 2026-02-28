import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, User, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white">
              <Heart size={18} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">MU Connect</span>
          </Link>
          
          {user && (
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Discover
              </Link>
              <Link to="/profile" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Profile
              </Link>
              <span className="hidden text-sm font-medium text-slate-300 sm:block">|</span>
              <span className="hidden text-sm font-medium text-slate-600 sm:block">{user.email}</span>
              <button 
                onClick={onLogout}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
