import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, ShieldCheck, Sparkles } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-rose-100 p-3 text-rose-600 ring-8 ring-rose-50">
            <Heart size={48} fill="currentColor" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          <span className="block">Connect with your</span>
          <span className="block text-rose-600">Campus Crush</span>
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-xl text-slate-600">
          The exclusive dating and connection platform for Marwadi University students. 
          Verified profiles, AI-enhanced matching, and a safe community.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            to="/auth"
            className="rounded-full bg-rose-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            Get Started
          </Link>
          <a
            href="#features"
            className="rounded-full bg-white px-8 py-3 text-base font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            Learn more
          </a>
        </div>
      </motion.div>

      <div id="features" className="grid max-w-7xl gap-8 px-4 py-16 sm:grid-cols-3 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 inline-flex rounded-lg bg-blue-100 p-3 text-blue-600">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Verified Students</h3>
          <p className="mt-2 text-slate-600">Only Marwadi University emails allowed. No fakes, just real students.</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 inline-flex rounded-lg bg-purple-100 p-3 text-purple-600">
            <Sparkles size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">AI Enhanced</h3>
          <p className="mt-2 text-slate-600">Our AI polishes your bio and finds the best tags to describe you.</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 inline-flex rounded-lg bg-rose-100 p-3 text-rose-600">
            <Heart size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Smart Matching</h3>
          <p className="mt-2 text-slate-600">Connect with people who share your interests and vibe.</p>
        </div>
      </div>
    </div>
  );
}
