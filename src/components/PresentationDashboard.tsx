import { useState, useEffect } from 'react';
import { presentationService, Presentation, Slide, Theme } from '../services/presentationService';
import { sessionService } from '../services/sessionService';
import ProjectManager from './ProjectManager';
import SlideEditor from './SlideEditor';
import ThemeSelector from './ThemeSelector';
import LyricsSlideGenerator from './LyricsSlideGenerator';
import MediaUploader from './MediaUploader';
import PresentationViewer from './PresentationViewer';
import { Play, Save, FolderOpen, Settings, Music, Image as ImageIcon, Palette } from 'lucide-react';

export default function PresentationDashboard() {
  const [view, setView] = useState<'projects' | 'editor' | 'preview'>('projects');
  const [currentPresentation, setCurrentPresentation] = useState<Presentation | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [showThemes, setShowThemes] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentPresentation) {
      setSlides(currentPresentation.slides || []);
      if (currentPresentation.theme_id) {
        loadTheme(currentPresentation.theme_id);
      }
    }
  }, [currentPresentation]);

  const loadTheme = async (themeId: string) => {
    const themes = await presentationService.getAllThemes();
    const theme = themes.find(t => t.id === themeId);
    if (theme) setSelectedTheme(theme);
  };

  const handleCreateNew = async () => {
    const newPresentation = await presentationService.createPresentation('Untitled Presentation', []);
    if (newPresentation) {
      setCurrentPresentation(newPresentation);
      setSlides([{
        id: crypto.randomUUID(),
        type: 'custom',
        content: 'Welcome'
      }]);
      setView('editor');
    }
  };

  const handleOpenPresentation = (presentation: Presentation) => {
    setCurrentPresentation(presentation);
    setView('editor');
  };

  const handleSave = async () => {
    if (!currentPresentation) return;

    setSaving(true);
    const success = await presentationService.updatePresentation(currentPresentation.id, {
      slides,
      theme_id: selectedTheme?.id,
      updated_at: new Date().toISOString()
    });
    setSaving(false);

    if (success) {
      alert('Presentation saved successfully!');
    }
  };

  const handlePreview = () => {
    setView('preview');
  };

  const handleStartPresentation = async () => {
    if (!currentPresentation) return;

    await handleSave();

    const result = await sessionService.createSession(currentPresentation.id);
    if (result) {
      window.open(`/present?session=${result.code}`, '_blank');
    }
  };

  const handleSlidesGenerated = (newSlides: Slide[]) => {
    setSlides([...slides, ...newSlides]);
    setShowLyrics(false);
  };

  const handleMediaSelected = (url: string, type: 'image' | 'video') => {
    const slideIndex = 0;
    if (slides[slideIndex]) {
      const updatedSlides = [...slides];
      if (url.startsWith('linear-gradient')) {
        updatedSlides[slideIndex] = {
          ...updatedSlides[slideIndex],
          gradient: url
        };
      } else if (type === 'image') {
        updatedSlides[slideIndex] = {
          ...updatedSlides[slideIndex],
          backgroundImage: url
        };
      } else {
        updatedSlides[slideIndex] = {
          ...updatedSlides[slideIndex],
          backgroundVideo: url
        };
      }
      setSlides(updatedSlides);
    }
    setShowMedia(false);
  };

  if (view === 'projects') {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Church Presentations</h1>
            <p className="text-gray-600">Create and manage your sermon and worship presentations</p>
          </div>
          <ProjectManager
            onOpenPresentation={handleOpenPresentation}
            onCreateNew={handleCreateNew}
          />
        </div>
      </div>
    );
  }

  if (view === 'preview') {
    return (
      <div className="relative">
        <button
          onClick={() => setView('editor')}
          className="absolute top-4 left-4 z-50 px-4 py-2 bg-white text-gray-800 rounded-lg shadow-lg hover:bg-gray-100"
        >
          ← Back to Editor
        </button>
        <PresentationViewer
          slides={slides}
          theme={selectedTheme || undefined}
          mode="stage"
          showTimer={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('projects')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {currentPresentation?.title || 'Untitled'}
              </h2>
              <p className="text-sm text-gray-500">{slides.length} slides</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowThemes(!showThemes)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Palette className="w-4 h-4" />
              Themes
            </button>

            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Music className="w-4 h-4" />
              Lyrics
            </button>

            <button
              onClick={() => setShowMedia(!showMedia)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <ImageIcon className="w-4 h-4" />
              Media
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={handleStartPresentation}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Play className="w-4 h-4" />
              Present
            </button>
          </div>
        </div>
      </div>

      {showThemes && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Select Theme</h3>
              <button
                onClick={() => setShowThemes(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <ThemeSelector
                selectedThemeId={selectedTheme?.id}
                onThemeSelect={(theme) => {
                  setSelectedTheme(theme);
                  setShowThemes(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showLyrics && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Generate Lyrics Slides</h3>
              <button
                onClick={() => setShowLyrics(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <LyricsSlideGenerator onSlidesGenerated={handleSlidesGenerated} />
            </div>
          </div>
        </div>
      )}

      {showMedia && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Background Media</h3>
              <button
                onClick={() => setShowMedia(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <MediaUploader onMediaSelected={handleMediaSelected} />
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {slides.length > 0 ? (
          <SlideEditor
            slides={slides}
            theme={selectedTheme || undefined}
            onSlidesChange={setSlides}
            onPreview={handlePreview}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">No slides yet</h3>
            <p className="text-gray-600 mb-6">Add slides from Bible verses or song lyrics</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowLyrics(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Add Song Lyrics
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
