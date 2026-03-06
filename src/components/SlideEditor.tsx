import React, { useState } from 'react';
import {
  GripVertical,
  Trash2,
  Plus,
  Image as ImageIcon,
  Type,
  Palette,
  Play,
  Save,
  Music,
  Book
} from 'lucide-react';
import { Slide, Presentation } from '../services/presentationService';
import { getTheme } from '../config/themes';
import BackgroundMediaManager from './BackgroundMediaManager';
import SongLyricsGenerator from './SongLyricsGenerator';
import BibleSearch from './BibleSearch';

interface SlideEditorProps {
  presentation: Presentation;
  onUpdate: (updates: Partial<Presentation>) => void;
  onPresent: () => void;
  onSave: () => void;
}

export default function SlideEditor({ presentation, onUpdate, onPresent, onSave }: SlideEditorProps) {
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [draggedSlide, setDraggedSlide] = useState<number | null>(null);
  const [showBackgroundManager, setShowBackgroundManager] = useState(false);
  const [showLyricsGenerator, setShowLyricsGenerator] = useState(false);
  const [showBibleSearch, setShowBibleSearch] = useState(false);

  const slides = presentation.slides || [];
  const currentSlide = slides[selectedSlide];
  const theme = getTheme(presentation.theme);

  const addSlide = () => {
    const newSlide: Slide = {
      id: crypto.randomUUID(),
      content: 'New slide content...'
    };
    onUpdate({ slides: [...slides, newSlide] });
    setSelectedSlide(slides.length);
  };

  const deleteSlide = (index: number) => {
    const newSlides = slides.filter((_, i) => i !== index);
    onUpdate({ slides: newSlides });
    if (selectedSlide >= newSlides.length) {
      setSelectedSlide(Math.max(0, newSlides.length - 1));
    }
  };

  const updateSlideContent = (content: string) => {
    const newSlides = [...slides];
    newSlides[selectedSlide] = { ...newSlides[selectedSlide], content };
    onUpdate({ slides: newSlides });
  };

  const updateSlideBackground = (background: any) => {
    const newSlides = [...slides];
    newSlides[selectedSlide] = { ...newSlides[selectedSlide], background };
    onUpdate({ slides: newSlides });
  };

  const handleDragStart = (index: number) => {
    setDraggedSlide(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSlide === null || draggedSlide === index) return;

    const newSlides = [...slides];
    const draggedItem = newSlides[draggedSlide];
    newSlides.splice(draggedSlide, 1);
    newSlides.splice(index, 0, draggedItem);

    onUpdate({ slides: newSlides });
    setDraggedSlide(index);
  };

  const handleDragEnd = () => {
    setDraggedSlide(null);
  };

  const handleBibleVersesGenerated = (verses: any[]) => {
    const newSlides: Slide[] = verses.map((verse) => ({
      id: crypto.randomUUID(),
      content: `${verse.book} ${verse.chapter}:${verse.verse}\n\n${verse.text}`
    }));
    onUpdate({ slides: [...slides, ...newSlides] });
  };

  const handleLyricsGenerated = (newSlides: Slide[]) => {
    onUpdate({ slides: [...slides, ...newSlides] });
  };

  const renderSlidePreview = (slide: Slide) => {
    const slideTheme = slide.theme || theme;
    const background = slide.background || { type: 'color', value: theme.backgroundColor };

    let backgroundStyle: any = {};

    if (background.type === 'color') {
      backgroundStyle.backgroundColor = background.value;
    } else if (background.type === 'gradient') {
      backgroundStyle.background = background.value;
    } else if (background.type === 'image') {
      backgroundStyle.backgroundImage = `url(${background.value})`;
      backgroundStyle.backgroundSize = 'cover';
      backgroundStyle.backgroundPosition = 'center';
    }

    return (
      <div className="relative w-full h-full" style={backgroundStyle}>
        {background.type === 'video' && (
          <video
            autoPlay
            loop
            muted
            className="absolute inset-0 w-full h-full object-cover"
            src={background.value}
          />
        )}

        <div
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${slideTheme.overlayOpacity || 0.3})`
          }}
        />

        <div
          className="relative z-10 h-full flex items-center justify-center px-2 text-center"
          style={{
            fontFamily: slideTheme.fontFamily,
            fontSize: '0.75rem',
            color: slideTheme.textColor,
            textShadow: slideTheme.textShadow ? '0 1px 2px rgba(0,0,0,0.8)' : 'none'
          }}
        >
          <div className="line-clamp-4">{slide.content}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">Slides</h3>
          <button
            onClick={addSlide}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Slide
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => setSelectedSlide(index)}
              className={`relative group cursor-move ${
                selectedSlide === index
                  ? 'ring-2 ring-blue-500'
                  : 'hover:ring-2 hover:ring-gray-300'
              } rounded-lg overflow-hidden transition-all`}
            >
              <div className="aspect-video bg-gray-900">
                {renderSlidePreview(slide)}
              </div>

              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSlide(index);
                }}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>

              <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => setShowBibleSearch(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Book className="w-4 h-4" />
            Add Bible Verses
          </button>
          <button
            onClick={() => setShowLyricsGenerator(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Music className="w-4 h-4" />
            Add Song Lyrics
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <input
            type="text"
            value={presentation.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="text-2xl font-bold text-gray-800 border-none focus:outline-none"
            placeholder="Presentation Title"
          />

          <div className="flex items-center gap-3">
            <select
              value={presentation.theme}
              onChange={(e) => onUpdate({ theme: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="classic">Classic</option>
              <option value="modern">Modern</option>
              <option value="minimal">Minimal</option>
              <option value="church_dark">Church Dark</option>
            </select>

            <button
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>

            <button
              onClick={onPresent}
              disabled={slides.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-5 h-5" />
              Present
            </button>
          </div>
        </div>

        {slides.length > 0 ? (
          <div className="flex-1 flex">
            <div className="flex-1 flex flex-col p-6">
              <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
                <textarea
                  value={currentSlide?.content || ''}
                  onChange={(e) => updateSlideContent(e.target.value)}
                  className="w-full h-full resize-none border-none focus:outline-none text-lg"
                  placeholder="Enter slide content..."
                />
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowBackgroundManager(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Change Background
                </button>
              </div>
            </div>

            <div className="w-96 p-6">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-3 bg-gray-100 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">Live Preview</h3>
                </div>
                <div className="aspect-video bg-gray-900">
                  {currentSlide && renderSlidePreview(currentSlide)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Type className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No slides yet</p>
              <p className="text-sm">Click "Add Slide" to get started</p>
            </div>
          </div>
        )}
      </div>

      {showBackgroundManager && (
        <BackgroundMediaManager
          onSelectBackground={updateSlideBackground}
          onClose={() => setShowBackgroundManager(false)}
        />
      )}

      {showLyricsGenerator && (
        <SongLyricsGenerator
          onSlidesGenerated={handleLyricsGenerated}
          onClose={() => setShowLyricsGenerator(false)}
        />
      )}

      {showBibleSearch && (
        <BibleSearch
          onSelectVerse={() => {}}
          onGenerateSlides={handleBibleVersesGenerated}
          onClose={() => setShowBibleSearch(false)}
        />
      )}
    </div>
  );
}
