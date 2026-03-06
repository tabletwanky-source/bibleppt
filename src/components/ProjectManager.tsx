import { useState, useEffect } from 'react';
import { presentationService, Presentation } from '../services/presentationService';
import { Folder, Plus, Copy, Trash2, CreditCard as Edit, Play } from 'lucide-react';

interface ProjectManagerProps {
  onOpenPresentation: (presentation: Presentation) => void;
  onCreateNew: () => void;
}

export default function ProjectManager({ onOpenPresentation, onCreateNew }: ProjectManagerProps) {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    setLoading(true);
    const data = await presentationService.getAllPresentations();
    setPresentations(data);
    setLoading(false);
  };

  const handleDuplicate = async (id: string) => {
    const duplicated = await presentationService.duplicatePresentation(id);
    if (duplicated) {
      await loadPresentations();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this presentation?')) {
      await presentationService.deletePresentation(id);
      await loadPresentations();
    }
  };

  const handleRename = async (id: string) => {
    if (editTitle.trim()) {
      await presentationService.updatePresentation(id, { title: editTitle.trim() });
      setEditingId(null);
      setEditTitle('');
      await loadPresentations();
    }
  };

  const startEditing = (presentation: Presentation) => {
    setEditingId(presentation.id);
    setEditTitle(presentation.title);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Folder className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">My Presentations</h2>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Presentation
        </button>
      </div>

      {presentations.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No presentations yet</h3>
          <p className="text-gray-500 mb-6">Create your first presentation to get started</p>
          <button
            onClick={onCreateNew}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Presentation
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {presentations.map((presentation) => (
            <div
              key={presentation.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editingId === presentation.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(presentation.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(presentation.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {presentation.title}
                    </h3>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{presentation.slides?.length || 0} slides</span>
                    <span>Updated {formatDate(presentation.updated_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenPresentation(presentation)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Open"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => startEditing(presentation)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Rename"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(presentation.id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(presentation.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
