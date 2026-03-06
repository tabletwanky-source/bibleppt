import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, Save, Loader as Loader2, User, Globe, Church, BookOpen, Check, CircleAlert as AlertCircle } from 'lucide-react';

interface UserProfileProps {
  user: any;
  onProfileUpdate?: (profile: Profile) => void;
}

interface Profile {
  id: string;
  full_name: string;
  bio: string;
  church_name: string;
  country: string;
  avatar_url: string;
  preferred_language: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string;
}

const LANGUAGES = [
  { code: 'ht', label: 'Kreyòl' },
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

const COUNTRIES = [
  'Haiti', 'Dominican Republic', 'United States', 'Canada', 'France',
  'Belgium', 'Switzerland', 'Guadeloupe', 'Martinique', 'French Guiana',
  'Brazil', 'Mexico', 'Colombia', 'Venezuela', 'Spain', 'Other'
];

export default function UserProfile({ user, onProfileUpdate }: UserProfileProps) {
  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name: '',
    bio: '',
    church_name: '',
    country: '',
    avatar_url: '',
    preferred_language: 'en',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 2MB' });
      return;
    }

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const localPreview = URL.createObjectURL(file);
      setAvatarPreview(localPreview);

      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setAvatarPreview(publicUrl);
      setMessage({ type: 'success', text: 'Photo updated successfully' });
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setMessage({ type: 'error', text: 'Failed to upload photo. Please try again.' });
      setAvatarPreview(profile.avatar_url || null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          church_name: profile.church_name,
          country: profile.country,
          avatar_url: profile.avatar_url,
          preferred_language: profile.preferred_language,
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile saved successfully' });
      if (onProfileUpdate) onProfileUpdate(profile as Profile);
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const initials = (profile.full_name || user.email || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Your Profile</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your personal information and preferences</p>
      </div>

      {/* Avatar Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-white">{initials}</span>
              )}
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow-lg transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {profile.full_name || 'Your Name'}
            </h3>
            <p className="text-slate-500 text-sm">{user.email}</p>
            {profile.role === 'admin' && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
                Admin
              </span>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="mt-2 text-xs text-blue-600 hover:underline font-medium block"
            >
              {uploadingAvatar ? 'Uploading...' : 'Change photo'}
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success'
            ? <Check className="w-5 h-5 shrink-0" />
            : <AlertCircle className="w-5 h-5 shrink-0" />
          }
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">
          Personal Information
        </h3>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={profile.full_name || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Your full name"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email Address
          </label>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm">
            {user.email}
            <span className="ml-auto text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-md">Read-only</span>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Bio
          </label>
          <textarea
            value={profile.bio || ''}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="A short description about yourself..."
            rows={3}
            maxLength={280}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none transition-all"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">
            {(profile.bio || '').length} / 280
          </p>
        </div>

        {/* Church Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Church Name
          </label>
          <div className="relative">
            <Church className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={profile.church_name || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, church_name: e.target.value }))}
              placeholder="Your church or organization"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Country
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={profile.country || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm appearance-none bg-white transition-all"
            >
              <option value="">Select country</option>
              {COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preferred Language */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Preferred Language
          </label>
          <div className="grid grid-cols-4 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setProfile(prev => ({ ...prev, preferred_language: lang.code }))}
                className={`py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${
                  profile.preferred_language === lang.code
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Changes
          </>
        )}
      </button>

      {/* Account Info */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Member since</p>
          <p className="text-sm font-semibold text-slate-700">
            {profile.created_at
              ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Last login</p>
          <p className="text-sm font-semibold text-slate-700">
            {profile.last_login
              ? new Date(profile.last_login).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
