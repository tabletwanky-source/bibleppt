import React, { useState, useEffect } from 'react';
import { Presentation, presentationService } from '../services/presentationService';
import { Play, Trash2, Copy, Edit2, Plus, FolderOpen, Edit } from 'lucide-react';
import { motion } from 'motion/react';
import SlideEditor from './SlideEditor';

interface PresentationManagerProps {
  onOpenPresentation: (presentation: Presentation) => void;
  onNewPresentation: () => void;
  user?: any;
  darkMode?: boolean;
}

export default function PresentationManager({ onOpenPresentation, onNewPresentation }: PresentationManagerProps) {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    setLoading(true);
    const data = await presentationService.getUserPresentations();
    setPresentations(data);
    setLoading(false);
  };

  const handleDuplicate = async (id: string) => {
    const newPresentation = await presentationService.duplicatePresentation(id);
    if (newPresentation) {
      await loadPresentations();
    }
  };

  const handleDelete = async (id: string) => {
    const success = await presentationService.deletePresentation(id);
    if (success) {
      await loadPresentations();
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Presentations</h1>
          <p className="text-gray-600 mt-1">Manage your church presentations</p>
        </div>
        <button
          onClick={onNewPresentation}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Presentation
        </button>
      </div>

      {presentations.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No presentations yet</h3>
          <p className="text-gray-500 mb-6">Create your first presentation to get started</p>
          <button
            onClick={onNewPresentation}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Presentation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentations.map((presentation) => (
            <div
              key={presentation.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-6xl font-bold">
                {presentation.slides?.length || 0}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-800 text-lg mb-2 truncate">
                  {presentation.title}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{presentation.slides?.length || 0} slides</span>
                  <span>{new Date(presentation.updated_at).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onOpenPresentation(presentation)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Open
                  </button>

                  <button
                    onClick={() => handleDuplicate(presentation.id)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {deleteConfirm === presentation.id ? (
                    <button
                      onClick={() => handleDelete(presentation.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title="Confirm Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(presentation.id)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {deleteConfirm === presentation.id && (
                  <p className="text-xs text-red-600 mt-2 text-center">
                    Click again to confirm deletion
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
