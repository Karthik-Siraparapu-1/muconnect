import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, MessageCircle, AlertTriangle, BookOpen, MapPin, Calendar, Instagram, Facebook, Linkedin, Twitter } from 'lucide-react';

interface Profile {
  id: number;
  name: string;
  ai_enhanced_bio: string;
  ai_tags: string; // JSON string
  course: string;
  year: string;
  profile_pic_url?: string;
  social_links?: string;
  nicknames?: string;
  habits?: string;
  department?: string;
  class_section?: string;
  location?: string;
  dob?: string;
  hometown?: string;
}

export function DashboardPage({ user }: { user: any }) {
  const [connections, setConnections] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await fetch(`/api/connections/${user.id}`);
        const data = await res.json();
        setConnections(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [user]);

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

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-500">Loading connections...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Connections</h1>
          <p className="text-slate-600">People who liked you back. Start chatting!</p>
        </div>
        <div className="flex gap-4">
          <Link to="/discover" className="rounded-full bg-rose-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 transition-colors">
            Discover
          </Link>
          <Link to="/search" className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors">
            Search
          </Link>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-slate-100">
          <Heart className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No connections yet</h3>
          <p className="mt-2 text-slate-500">Head over to Discover to start swiping and finding matches!</p>
          <Link to="/discover" className="mt-6 inline-block rounded-full bg-rose-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 transition-colors">
            Start Swiping
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {connections.map((profile, index) => {
            let tags: string[] = [];
            let social: any = {};
            try {
              tags = JSON.parse(profile.ai_tags || '[]');
              social = JSON.parse(profile.social_links || '{}');
            } catch (e) {
              tags = [];
            }

            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 transition-shadow hover:shadow-md flex flex-col"
              >
                <div className="relative h-48 bg-slate-100">
                  {profile.profile_pic_url ? (
                    <img src={profile.profile_pic_url} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <Heart size={48} />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                     <h3 className="text-xl font-bold">{profile.name} {profile.nicknames && <span className="text-sm font-normal text-white/80">({profile.nicknames})</span>}</h3>
                     <p className="text-sm opacity-90">{profile.course} • {profile.year}</p>
                  </div>
                  <button 
                    onClick={() => handleReport(profile.id)}
                    className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white/80 transition-colors"
                    title="Report User"
                  >
                    <AlertTriangle size={16} />
                  </button>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-500">
                    {profile.department && (
                      <span className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 border border-slate-100">
                        <BookOpen size={12} /> {profile.department}
                      </span>
                    )}
                    {profile.location && (
                      <span className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 border border-slate-100">
                        <MapPin size={12} /> {profile.location}
                      </span>
                    )}
                    {profile.dob && (
                      <span className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 border border-slate-100">
                        <Calendar size={12} /> {new Date(profile.dob).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-1">{profile.ai_enhanced_bio || profile.bio}</p>
                  
                  <div className="mb-6 flex flex-wrap gap-2">
                    {tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-600 border border-rose-100">
                        {tag}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500 border border-slate-100">
                        +{tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="mt-auto flex justify-center gap-4 border-t border-slate-100 pt-4 mb-4">
                    {social.instagram && (
                      <a href={`https://instagram.com/${social.instagram}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-rose-600">
                        <Instagram size={20} />
                      </a>
                    )}
                    {social.facebook && (
                      <a href={`https://facebook.com/${social.facebook}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600">
                        <Facebook size={20} />
                      </a>
                    )}
                    {social.linkedin && (
                      <a href={`https://linkedin.com/in/${social.linkedin}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-700">
                        <Linkedin size={20} />
                      </a>
                    )}
                    {social.twitter && (
                      <a href={`https://twitter.com/${social.twitter}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-sky-500">
                        <Twitter size={20} />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/chat/${profile.id}`)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100"
                  >
                    <MessageCircle size={18} />
                    Message
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
