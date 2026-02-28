import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, Upload, Instagram, Facebook, Linkedin, Twitter } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export function OnboardingPage({ user }: { user: any }) {
  const [formData, setFormData] = useState({
    name: '',
    course: '',
    year: '',
    bio: '',
    interests: '',
    profile_pic_url: '',
    social_links: { instagram: '', facebook: '', linkedin: '', twitter: '' },
    nicknames: '',
    habits: '',
    department: '',
    class_section: '',
    location: '',
    dob: '',
    hometown: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            let social = { instagram: '', facebook: '', linkedin: '', twitter: '' };
            try {
              if (data.social_links) social = JSON.parse(data.social_links);
            } catch (e) {}

            setFormData({
              name: data.name || '',
              course: data.course || '',
              year: data.year || '',
              bio: data.bio || '',
              interests: data.interests || '',
              profile_pic_url: data.profile_pic_url || '',
              social_links: social,
              nicknames: data.nicknames || '',
              habits: data.habits || '',
              department: data.department || '',
              class_section: data.class_section || '',
              location: data.location || '',
              dob: data.dob || '',
              hometown: data.hometown || '',
            });
          }
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };
    fetchProfile();
  }, [user.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formDataUpload = new FormData();
      formDataUpload.append('profilePic', file);

      setUploading(true);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });
        const data = await res.json();
        if (data.url) {
          setFormData(prev => ({ ...prev, profile_pic_url: data.url }));
        }
      } catch (error) {
        console.error("Upload failed", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let aiEnhancedBio = formData.bio;
      let aiTags = JSON.stringify(formData.interests.split(',').map(s => s.trim()));

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
          You are a profile optimizer for a university dating app.
          Clean up and enhance the following user data.
          
          Name: ${formData.name}
          Raw Bio: "${formData.bio}"
          Raw Interests: "${formData.interests}"
          Course: ${formData.course}
          
          1. Correct any grammar in the bio and make it sound friendly and professional but approachable.
          2. Extract a list of standardized interest tags (JSON array of strings) from the bio and interests.
          
          Return JSON only:
          {
            "enhancedBio": "string",
            "tags": ["tag1", "tag2"]
          }
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        
        const result = JSON.parse(response.text || "{}");
        if (result.enhancedBio) aiEnhancedBio = result.enhancedBio;
        if (result.tags) aiTags = JSON.stringify(result.tags);
      } catch (aiError) {
        console.error("AI enhancement failed, falling back to raw data", aiError);
      }

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          userId: user.id,
          social_links: JSON.stringify(formData.social_links),
          aiEnhancedBio,
          aiTags
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.error === "User not found") {
          localStorage.removeItem('user');
          window.location.href = '/auth';
          return;
        }
        throw new Error(errorData.error || 'Failed to save profile');
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white p-8 shadow-lg"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Edit Profile</h1>
          <p className="mt-2 text-slate-600">Tell us about yourself. Our AI will help polish your bio!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative h-32 w-32 overflow-hidden rounded-full bg-slate-100 ring-4 ring-white shadow-md">
              {formData.profile_pic_url ? (
                <img src={formData.profile_pic_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <Upload size={32} />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="file-upload" className="cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-semibold text-rose-600 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                {uploading ? 'Uploading...' : 'Change Photo'}
              </label>
              <input id="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700">Nicknames</label>
              <input
                type="text"
                placeholder="e.g. Johnny, Ace"
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                value={formData.nicknames}
                onChange={(e) => setFormData({ ...formData, nicknames: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Course</label>
              <input
                type="text"
                required
                placeholder="e.g. B.Tech CSE"
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Department</label>
              <input
                type="text"
                placeholder="e.g. Computer Engineering"
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Year</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Post Grad">Post Grad</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Class / Section</label>
              <input
                type="text"
                placeholder="e.g. A2"
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                value={formData.class_section}
                onChange={(e) => setFormData({ ...formData, class_section: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Hometown (Own Place)</label>
              <input
                type="text"
                placeholder="e.g. Rajkot, Ahmedabad"
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                value={formData.hometown}
                onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
              />
            </div>
            
             <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Current Location</label>
              <input
                type="text"
                placeholder="e.g. Hostel Block A"
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Bio</label>
              <textarea
                required
                rows={4}
                placeholder="Tell us about your hobbies, what you're looking for..."
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
              <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                <Sparkles size={12} className="text-rose-500" />
                AI will enhance this automatically when you save.
              </p>
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Interests (comma separated)</label>
              <input
                type="text"
                placeholder="Coding, Cricket, Music, Travel"
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Habits</label>
              <input
                type="text"
                placeholder="Early riser, Gym freak, Bookworm"
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-2 border"
                value={formData.habits}
                onChange={(e) => setFormData({ ...formData, habits: e.target.value })}
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4 rounded-lg bg-slate-50 p-4 border border-slate-200">
            <h3 className="text-sm font-medium text-slate-900">Social Links</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Instagram className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-rose-600 sm:text-sm sm:leading-6"
                  placeholder="Instagram Username"
                  value={formData.social_links.instagram}
                  onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, instagram: e.target.value } })}
                />
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Facebook className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-rose-600 sm:text-sm sm:leading-6"
                  placeholder="Facebook Username"
                  value={formData.social_links.facebook}
                  onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, facebook: e.target.value } })}
                />
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Linkedin className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-rose-600 sm:text-sm sm:leading-6"
                  placeholder="LinkedIn Username"
                  value={formData.social_links.linkedin}
                  onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, linkedin: e.target.value } })}
                />
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Twitter className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-rose-600 sm:text-sm sm:leading-6"
                  placeholder="Twitter Username"
                  value={formData.social_links.twitter}
                  onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, twitter: e.target.value } })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-70"
          >
            {loading ? 'Saving & Enhancing...' : 'Save Profile'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
