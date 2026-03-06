import React, { useState } from 'react';
import { Music, Plus, Wand2 } from 'lucide-react';
import { Slide } from '../services/presentationService';

interface SongLyricsGeneratorProps {
  onSlidesGenerated: (slides: Slide[]) => void;
  onClose: () => void;
}

export default function SongLyricsGenerator({ onSlidesGenerated, onClose }: SongLyricsGeneratorProps) {
  const [lyrics, setLyrics] = useState('');
  const [autoSplit, setAutoSplit] = useState(true);
  const [maxLinesPerSlide, setMaxLinesPerSlide] = useState(4);

  const generateSlides = () => {
    if (!lyrics.trim()) return;

    let slides: Slide[] = [];

    if (autoSplit) {
      const paragraphs = lyrics.split(/\n\s*\n/).filter(p => p.trim());

      paragraphs.forEach((paragraph) => {
        const lines = paragraph.split('\n').filter(l => l.trim());

        if (lines.length <= maxLinesPerSlide) {
          slides.push({
            id: crypto.randomUUID(),
            content: lines.join('\n')
          });
        } else {
          for (let i = 0; i < lines.length; i += maxLinesPerSlide) {
            const chunk = lines.slice(i, i + maxLinesPerSlide);
            slides.push({
              id: crypto.randomUUID(),
              content: chunk.join('\n')
            });
          }
        }
      });
    } else {
      const paragraphs = lyrics.split(/\n\s*\n/).filter(p => p.trim());
      slides = paragraphs.map(paragraph => ({
        id: crypto.randomUUID(),
        content: paragraph.trim()
      }));
    }

    onSlidesGenerated(slides);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Song Lyrics Generator</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste Song Lyrics
            </label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Verse 1&#10;Amazing grace how sweet the sound&#10;That saved a wretch like me&#10;&#10;Chorus&#10;I once was lost but now am found&#10;Was blind but now I see"
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
            />
            <p className="mt-2 text-sm text-gray-500">
              Separate verses/sections with blank lines. Each section will become a slide.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoSplit"
                checked={autoSplit}
                onChange={(e) => setAutoSplit(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoSplit" className="text-sm font-medium text-gray-700">
                Auto-split long sections
              </label>
            </div>

            {autoSplit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum lines per slide: {maxLinesPerSlide}
                </label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={maxLinesPerSlide}
                  onChange={(e) => setMaxLinesPerSlide(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={generateSlides}
              disabled={!lyrics.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Wand2 className="w-5 h-5" />
              Generate Slides
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
