import React, { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export function SearchPage({ user }: { user: any }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    city: '',
    interest: ''
  });

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        userId: user.id,
        gender: user.gender,
        ...filters
      });
      const res = await fetch(`/api/search?${queryParams}`);
      const data = await res.json();
      setProfiles(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const handleReport = async (reportedId: number) => {
    const reason = prompt("Why are you reporting this user?");
    if (!reason) return;

    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: user.id,
          reportedId,
          reason
        })
      });
      alert("User reported successfully.");
    } catch (error) {
      console.error("Failed to report", error);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Search Profiles</h1>
        <p className="text-slate-600">Find people by department, year, city, or shared interests.</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <input 
              type="text" 
              placeholder="e.g. Computer Science"
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
              value={filters.department}
              onChange={e => setFilters({...filters, department: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
            <select 
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
              value={filters.year}
              onChange={e => setFilters({...filters, year: e.target.value})}
            >
              <option value="">Any Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
            <input 
              type="text" 
              placeholder="e.g. Rajkot"
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
              value={filters.city}
              onChange={e => setFilters({...filters, city: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Interest</label>
            <input 
              type="text" 
              placeholder="e.g. Coding, Music"
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
              value={filters.interest}
              onChange={e => setFilters({...filters, interest: e.target.value})}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            type="submit"
            className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            <Search size={16} />
            Search
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Searching...</div>
      ) : profiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map(profile => (
            <motion.div 
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col"
            >
              <div className="h-48 bg-slate-100 relative">
                <img 
                  src={profile.profile_pic_url || `https://picsum.photos/seed/${profile.id}/400/300`} 
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => handleReport(profile.id)}
                  className="absolute top-2 right-2 p-1.5 bg-white/50 hover:bg-white backdrop-blur-sm rounded-full text-slate-600 transition-colors"
                  title="Report User"
                >
                  <AlertTriangle size={16} />
                </button>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900">{profile.name}, {profile.year}</h3>
                <p className="text-sm text-slate-500 mb-3">{profile.course} • {profile.department}</p>
                <p className="text-sm text-slate-700 line-clamp-2 mb-4 flex-1">
                  {profile.bio || profile.ai_enhanced_bio}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {profile.ai_tags && JSON.parse(profile.ai_tags).slice(0, 3).map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link 
                  to={`/chat/${profile.id}`}
                  className="w-full text-center rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  Message
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
          <Search className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No profiles found</h3>
          <p className="text-slate-500">Try adjusting your filters to see more results.</p>
        </div>
      )}
    </div>
  );
}
