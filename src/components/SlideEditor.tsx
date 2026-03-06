import { useState } from 'react';
import { Slide, Theme } from '../services/presentationService';
import { GripVertical, Trash2, Plus, Eye } from 'lucide-react';

interface SlideEditorProps {
  slides: Slide[];
  theme?: Theme;
  onSlidesChange: (slides: Slide[]) => void;
  onPreview: () => void;
}

export default function SlideEditor({ slides, theme, onSlidesChange, onPreview }: SlideEditorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSlides = [...slides];
    const [draggedSlide] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(index, 0, draggedSlide);

    onSlidesChange(newSlides);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSlideUpdate = (index: number, updates: Partial<Slide>) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    onSlidesChange(newSlides);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length === 1) {
      alert('Cannot delete the last slide');
      return;
    }
    const newSlides = slides.filter((_, i) => i !== index);
    onSlidesChange(newSlides);
    if (selectedIndex >= newSlides.length) {
      setSelectedIndex(newSlides.length - 1);
    }
  };

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: crypto.randomUUID(),
      type: 'custom',
      content: 'New slide content'
    };
    onSlidesChange([...slides, newSlide]);
    setSelectedIndex(slides.length);
  };

  const getSlidePreviewStyle = (slide: Slide) => {
    const baseStyle: any = {
      fontFamily: theme?.font_family || 'Inter',
      fontSize: '12px',
      color: theme?.text_color || '#FFFFFF',
      textShadow: theme?.text_shadow ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
    };

    if (slide.gradient || theme?.background_gradient) {
      return { ...baseStyle, background: slide.gradient || theme?.background_gradient };
    }

    return {
      ...baseStyle,
      backgroundColor: slide.backgroundColor || theme?.background_color || '#000000'
    };
  };

  const currentSlide = slides[selectedIndex];

  return (
    <div className="flex gap-4 h-full">
      <div className="w-64 flex-shrink-0 bg-white rounded-lg shadow-lg p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Slides</h3>
          <button
            onClick={handleAddSlide}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Add slide"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => setSelectedIndex(index)}
              className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                selectedIndex === index
                  ? 'border-blue-600 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="absolute top-1 left-1 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSlide(index);
                  }}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div
                className="aspect-video p-3 flex items-center justify-center text-center overflow-hidden"
                style={getSlidePreviewStyle(slide)}
              >
                <div className="text-xs line-clamp-3">{slide.content}</div>
              </div>

              <div className="px-2 py-1 bg-gray-50 text-xs text-gray-600 border-t border-gray-200">
                Slide {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">
            Edit Slide {selectedIndex + 1}
          </h3>
          <button
            onClick={onPreview}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>

        {currentSlide && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slide Type
              </label>
              <select
                value={currentSlide.type}
                onChange={(e) =>
                  handleSlideUpdate(selectedIndex, {
                    type: e.target.value as Slide['type']
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="verse">Bible Verse</option>
                <option value="lyrics">Song Lyrics</option>
                <option value="title">Title</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {currentSlide.type === 'verse' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference
                </label>
                <input
                  type="text"
                  value={currentSlide.reference || ''}
                  onChange={(e) =>
                    handleSlideUpdate(selectedIndex, { reference: e.target.value })
                  }
                  placeholder="John 3:16"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={currentSlide.content}
                onChange={(e) =>
                  handleSlideUpdate(selectedIndex, { content: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                rows={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <input
                type="color"
                value={currentSlide.backgroundColor || '#000000'}
                onChange={(e) =>
                  handleSlideUpdate(selectedIndex, { backgroundColor: e.target.value })
                }
                className="w-full h-12 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      <div className="w-96 flex-shrink-0 bg-white rounded-lg shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Live Preview</h3>
        {currentSlide && (
          <div
            className="aspect-video rounded-lg flex items-center justify-center p-6 text-center"
            style={getSlidePreviewStyle(currentSlide)}
          >
            <div className="max-w-full">
              {currentSlide.reference && (
                <div className="text-sm mb-2 opacity-90">{currentSlide.reference}</div>
              )}
              <div
                className="whitespace-pre-wrap leading-relaxed text-sm"
                style={{
                  fontFamily: theme?.font_family || 'Inter',
                  color: theme?.text_color || '#FFFFFF'
                }}
              >
                {currentSlide.content}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
