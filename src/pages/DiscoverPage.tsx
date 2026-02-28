import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, AlertTriangle } from 'lucide-react';

export function DiscoverPage({ user }: { user: any }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<any | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch(`/api/discover?userId=${user.id}&gender=${user.gender}`);
      const data = await res.json();
      setProfiles(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (profiles.length === 0) return;
    
    const currentProfile = profiles[0];
    
    // Optimistic UI update
    setProfiles((prev) => prev.slice(1));

    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: currentProfile.id,
          action
        })
      });
      const data = await res.json();
      
      if (data.match) {
        setMatch(currentProfile);
      }
    } catch (error) {
      console.error("Failed to swipe", error);
    }
  };

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
      alert("User reported successfully. Our team will review this.");
      handleSwipe('pass'); // Skip them
    } catch (error) {
      console.error("Failed to report", error);
    }
  };

  if (loading) {
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 h-[calc(100vh-4rem)] flex flex-col items-center justify-center relative overflow-hidden">
      
      {match && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
          >
            <h2 className="text-3xl font-bold text-rose-600 mb-4">It's a Match!</h2>
            <p className="text-slate-600 mb-6">You and {match.name} liked each other.</p>
            <div className="flex justify-center gap-4 mb-8">
              <img src={user.profile_pic_url || "https://picsum.photos/seed/user/200"} className="w-24 h-24 rounded-full border-4 border-rose-100 object-cover" alt="You" />
              <img src={match.profile_pic_url || "https://picsum.photos/seed/match/200"} className="w-24 h-24 rounded-full border-4 border-rose-100 object-cover" alt={match.name} />
            </div>
            <button 
              onClick={() => setMatch(null)}
              className="w-full rounded-full bg-rose-600 py-3 font-semibold text-white hover:bg-rose-500 transition-colors"
            >
              Keep Swiping
            </button>
          </motion.div>
        </div>
      )}

      <div className="relative w-full h-[600px] max-h-[80vh]">
        <AnimatePresence>
          {profiles.length > 0 ? (
            <motion.div
              key={profiles[0].id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0, x: 200 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-slate-100"
            >
              <div className="relative h-2/3 bg-slate-100">
                <img 
                  src={profiles[0].profile_pic_url || `https://picsum.photos/seed/${profiles[0].id}/400/600`} 
                  alt={profiles[0].name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                  <h2 className="text-3xl font-bold text-white">{profiles[0].name}, {profiles[0].year}</h2>
                  <p className="text-white/90 font-medium">{profiles[0].course} • {profiles[0].department}</p>
                </div>
                <button 
                  onClick={() => handleReport(profiles[0].id)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white/80 transition-colors"
                  title="Report User"
                >
                  <AlertTriangle size={20} />
                </button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto">
                <p className="text-slate-700 mb-4">{profiles[0].bio || profiles[0].ai_enhanced_bio}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {profiles[0].ai_tags && JSON.parse(profiles[0].ai_tags).map((tag: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-medium border border-rose-100">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-500">
                  {profiles[0].location && <div>📍 {profiles[0].location}</div>}
                  {profiles[0].hometown && <div>🏠 From {profiles[0].hometown}</div>}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="text-slate-300 w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">You're all caught up!</h3>
              <p className="text-slate-500">Check back later for more profiles.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {profiles.length > 0 && (
        <div className="flex items-center justify-center gap-6 mt-8">
          <button 
            onClick={() => handleSwipe('pass')}
            className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all border border-slate-100"
          >
            <X size={32} />
          </button>
          <button 
            onClick={() => handleSwipe('like')}
            className="w-16 h-16 bg-rose-600 rounded-full shadow-lg shadow-rose-200 flex items-center justify-center text-white hover:bg-rose-500 transition-all"
          >
            <Heart size={32} fill="currentColor" />
          </button>
        </div>
      )}
    </div>
  );
}
