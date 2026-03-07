import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, FolderOpen, Edit, Trash2, Copy, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import CustomSlideEditor from './CustomSlideEditor';

interface Presentation {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomPresentationBuilderProps {
  user: any;
  darkMode?: boolean;
  onBack?: () => void;
}

export default function CustomPresentationBuilder({ user, darkMode = false, onBack }: CustomPresentationBuilderProps) {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPresentation, setSelectedPresentation] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      loadPresentations();
    }
  }, [user]);

  const loadPresentations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('presentations')
        .select('id, title, description, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPresentations(data || []);
    } catch (error) {
      console.error('Error loading presentations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPresentation = async () => {
    if (!newTitle.trim()) return;

    try {
      setCreating(true);
      const { data, error } = await supabase
        .from('presentations')
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          description: newDescription.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setPresentations([data, ...presentations]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setSelectedPresentation(data.id);
    } catch (error) {
      console.error('Error creating presentation:', error);
      alert('Failed to create presentation');
    } finally {
      setCreating(false);
    }
  };

  const deletePresentation = async (id: string) => {
    if (!confirm('Delete this presentation? All slides will be removed.')) return;

    try {
      const { error } = await supabase
        .from('presentations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPresentations(presentations.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting presentation:', error);
      alert('Failed to delete presentation');
    }
  };

  if (selectedPresentation) {
    return (
      <CustomSlideEditor
        presentationId={selectedPresentation}
        user={user}
        onBack={() => setSelectedPresentation(null)}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className={`p-2 rounded-xl transition-colors ${
                  darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold mb-2">Custom Presentations</h1>
              <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Create professional presentations with custom slides
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            New Presentation
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : presentations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-16 rounded-2xl border-2 border-dashed ${
              darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'
            }`}
          >
            <FolderOpen className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
            <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              No presentations yet
            </h3>
            <p className={`mb-6 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              Create your first custom presentation with unique slides
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Presentation
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presentations.map((presentation) => (
              <motion.div
                key={presentation.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-2xl border shadow-sm hover:shadow-lg transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}
              >
                <h3 className="text-lg font-bold mb-2 line-clamp-2">{presentation.title}</h3>
                {presentation.description && (
                  <p className={`text-sm mb-4 line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {presentation.description}
                  </p>
                )}
                <p className={`text-xs mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Updated: {new Date(presentation.updated_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPresentation(presentation.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => deletePresentation(presentation.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md rounded-2xl shadow-2xl ${
              darkMode ? 'bg-slate-800' : 'bg-white'
            }`}
          >
            <div className={`p-6 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <h3 className="text-xl font-bold">Create New Presentation</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Sunday Service Announcements"
                  className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of your presentation"
                  rows={3}
                  className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>
            <div className={`p-6 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex gap-3`}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTitle('');
                  setNewDescription('');
                }}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                  darkMode
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={createPresentation}
                disabled={!newTitle.trim() || creating}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
