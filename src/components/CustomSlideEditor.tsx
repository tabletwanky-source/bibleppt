import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { GripVertical, Trash2, Plus, Eye, Save, ArrowLeft, Type, Palette, Image as ImageIcon, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Slide {
  id: string;
  presentation_id: string;
  slide_order: number;
  title: string;
  body: string;
  slide_theme?: string;
  background_image?: string;
  background_video?: string;
  text_style: {
    fontSize: number;
    color: string;
    bold: boolean;
    italic: boolean;
  };
}

interface CustomSlideEditorProps {
  presentationId: string;
  user: any;
  onBack: () => void;
  darkMode?: boolean;
}

export default function CustomSlideEditor({ presentationId, user, onBack, darkMode = false }: CustomSlideEditorProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [presentationTitle, setPresentationTitle] = useState('');

  useEffect(() => {
    loadSlides();
    loadPresentation();
  }, [presentationId]);

  const loadPresentation = async () => {
    try {
      const { data, error } = await supabase
        .from('presentations')
        .select('title')
        .eq('id', presentationId)
        .single();

      if (error) throw error;
      setPresentationTitle(data.title);
    } catch (error) {
      console.error('Error loading presentation:', error);
    }
  };

  const loadSlides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .eq('presentation_id', presentationId)
        .order('slide_order');

      if (error) throw error;

      if (!data || data.length === 0) {
        const defaultSlide: Omit<Slide, 'id'> = {
          presentation_id: presentationId,
          slide_order: 0,
          title: 'Welcome',
          body: 'Welcome to our presentation',
          text_style: {
            fontSize: 48,
            color: '#ffffff',
            bold: false,
            italic: false
          }
        };

        const { data: newSlide, error: insertError } = await supabase
          .from('slides')
          .insert(defaultSlide)
          .select()
          .single();

        if (insertError) throw insertError;
        setSlides([newSlide]);
      } else {
        setSlides(data);
      }
    } catch (error) {
      console.error('Error loading slides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlideUpdate = async (index: number, updates: Partial<Slide>) => {
    const updatedSlide = { ...slides[index], ...updates };
    const newSlides = [...slides];
    newSlides[index] = updatedSlide;
    setSlides(newSlides);

    try {
      const { error } = await supabase
        .from('slides')
        .update(updates)
        .eq('id', updatedSlide.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating slide:', error);
    }
  };

  const handleAddSlide = async () => {
    try {
      const newSlide: Omit<Slide, 'id'> = {
        presentation_id: presentationId,
        slide_order: slides.length,
        title: '',
        body: '',
        text_style: {
          fontSize: 48,
          color: '#ffffff',
          bold: false,
          italic: false
        }
      };

      const { data, error } = await supabase
        .from('slides')
        .insert(newSlide)
        .select()
        .single();

      if (error) throw error;

      setSlides([...slides, data]);
      setSelectedIndex(slides.length);
    } catch (error) {
      console.error('Error adding slide:', error);
    }
  };

  const handleDeleteSlide = async (index: number) => {
    if (slides.length === 1) {
      alert('Cannot delete the last slide');
      return;
    }

    if (!confirm('Delete this slide?')) return;

    try {
      const slideToDelete = slides[index];
      const { error } = await supabase
        .from('slides')
        .delete()
        .eq('id', slideToDelete.id);

      if (error) throw error;

      const newSlides = slides.filter((_, i) => i !== index);

      for (let i = 0; i < newSlides.length; i++) {
        newSlides[i].slide_order = i;
        await supabase
          .from('slides')
          .update({ slide_order: i })
          .eq('id', newSlides[i].id);
      }

      setSlides(newSlides);
      if (selectedIndex >= newSlides.length) {
        setSelectedIndex(newSlides.length - 1);
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSlides = [...slides];
    const [draggedSlide] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(index, 0, draggedSlide);

    for (let i = 0; i < newSlides.length; i++) {
      newSlides[i].slide_order = i;
    }

    setSlides(newSlides);
    setDraggedIndex(index);

    try {
      for (const slide of newSlides) {
        await supabase
          .from('slides')
          .update({ slide_order: slide.slide_order })
          .eq('id', slide.id);
      }
    } catch (error) {
      console.error('Error reordering slides:', error);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const currentSlide = slides[selectedIndex];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="border-b sticky top-0 z-10 backdrop-blur-sm" style={{
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)'
      }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={`p-2 rounded-xl transition-colors ${
                darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{presentationTitle}</h1>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {slides.length} {slides.length === 1 ? 'slide' : 'slides'}
              </p>
            </div>
          </div>
          <button
            onClick={handleAddSlide}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Slide
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className={`col-span-3 rounded-2xl p-4 ${
            darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
          } max-h-[calc(100vh-200px)] overflow-y-auto`}>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Type className="w-4 h-4" />
              Slides
            </h3>
            <div className="space-y-2">
              {slides.map((slide, index) => (
                <motion.div
                  key={slide.id}
                  layout
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedIndex(index)}
                  className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                    selectedIndex === index
                      ? 'border-indigo-600 shadow-md'
                      : darkMode ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="absolute top-1 left-1 cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
                  <div className={`aspect-video p-3 flex flex-col items-center justify-center text-center overflow-hidden ${
                    darkMode ? 'bg-slate-900' : 'bg-slate-100'
                  }`}>
                    {slide.title && (
                      <div className="text-xs font-bold mb-1 text-indigo-500 line-clamp-1">{slide.title}</div>
                    )}
                    <div className="text-xs line-clamp-2 opacity-70">{slide.body || 'Empty slide'}</div>
                  </div>
                  <div className={`px-2 py-1 text-xs text-center border-t ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    Slide {index + 1}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="col-span-6 space-y-4">
            <div className={`rounded-2xl p-6 ${
              darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
            }`}>
              <h3 className="font-semibold mb-4">Edit Slide {selectedIndex + 1}</h3>

              {currentSlide && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Slide Title</label>
                    <input
                      type="text"
                      value={currentSlide.title}
                      onChange={(e) => handleSlideUpdate(selectedIndex, { title: e.target.value })}
                      placeholder="Enter slide title..."
                      className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${
                        darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Slide Content</label>
                    <textarea
                      value={currentSlide.body}
                      onChange={(e) => handleSlideUpdate(selectedIndex, { body: e.target.value })}
                      placeholder="Enter slide content..."
                      rows={8}
                      className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${
                        darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Text Color
                      </label>
                      <input
                        type="color"
                        value={currentSlide.text_style.color}
                        onChange={(e) => handleSlideUpdate(selectedIndex, {
                          text_style: { ...currentSlide.text_style, color: e.target.value }
                        })}
                        className="w-full h-12 rounded-xl cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Font Size</label>
                      <input
                        type="number"
                        value={currentSlide.text_style.fontSize}
                        onChange={(e) => handleSlideUpdate(selectedIndex, {
                          text_style: { ...currentSlide.text_style, fontSize: Number(e.target.value) }
                        })}
                        min="12"
                        max="96"
                        className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${
                          darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSlide.text_style.bold}
                        onChange={(e) => handleSlideUpdate(selectedIndex, {
                          text_style: { ...currentSlide.text_style, bold: e.target.checked }
                        })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm font-medium">Bold</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSlide.text_style.italic}
                        onChange={(e) => handleSlideUpdate(selectedIndex, {
                          text_style: { ...currentSlide.text_style, italic: e.target.checked }
                        })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm font-medium">Italic</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-3">
            <div className={`rounded-2xl p-4 sticky top-24 ${
              darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
            }`}>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Live Preview
              </h3>
              {currentSlide && (
                <div
                  className="aspect-video rounded-lg flex flex-col items-center justify-center p-4 text-center"
                  style={{
                    backgroundColor: '#1e293b',
                    backgroundImage: currentSlide.background_image ? `url(${currentSlide.background_image})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {currentSlide.title && (
                    <div
                      className="text-xs font-bold mb-2 text-indigo-400"
                      style={{
                        color: currentSlide.text_style.color,
                        fontSize: `${currentSlide.text_style.fontSize * 0.4}px`,
                        fontWeight: currentSlide.text_style.bold ? 'bold' : 'normal',
                        fontStyle: currentSlide.text_style.italic ? 'italic' : 'normal'
                      }}
                    >
                      {currentSlide.title}
                    </div>
                  )}
                  <div
                    className="whitespace-pre-wrap text-xs leading-relaxed max-w-full overflow-hidden"
                    style={{
                      color: currentSlide.text_style.color,
                      fontSize: `${currentSlide.text_style.fontSize * 0.3}px`,
                      fontWeight: currentSlide.text_style.bold ? 'bold' : 'normal',
                      fontStyle: currentSlide.text_style.italic ? 'italic' : 'normal'
                    }}
                  >
                    {currentSlide.body || 'Empty slide'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
