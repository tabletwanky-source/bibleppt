import { useState } from 'react';
import { presentationService, Slide } from '../services/presentationService';
import { Music } from 'lucide-react';

interface LyricsSlideGeneratorProps {
  onSlidesGenerated: (slides: Slide[]) => void;
}

export default function LyricsSlideGenerator({ onSlidesGenerated }: LyricsSlideGeneratorProps) {
  const [lyrics, setLyrics] = useState('');
  const [autoSplit, setAutoSplit] = useState(true);
  const [songTitle, setSongTitle] = useState('');

  const handleGenerate = () => {
    if (!lyrics.trim()) return;

    const slides: Slide[] = [];

    if (songTitle.trim()) {
      slides.push({
        id: crypto.randomUUID(),
        type: 'title',
        content: songTitle.trim()
      });
    }

    const lyricSlides = presentationService.generateSlidesFromLyrics(lyrics, autoSplit);
    slides.push(...lyricSlides);

    onSlidesGenerated(slides);
    setLyrics('');
    setSongTitle('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Music className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-800">Song Lyrics Generator</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Song Title (Optional)
          </label>
          <input
            type="text"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="Amazing Grace"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lyrics
          </label>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Paste or type your song lyrics here...

Verse 1
Amazing grace how sweet the sound
That saved a wretch like me

Chorus
I once was lost but now I'm found
Was blind but now I see"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
            rows={12}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoSplit"
            checked={autoSplit}
            onChange={(e) => setAutoSplit(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <label htmlFor="autoSplit" className="text-sm text-gray-700">
            Auto-split long lyrics into separate slides (by paragraph)
          </label>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Separate verses and choruses with blank lines. Each section will become its own slide when auto-split is enabled.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!lyrics.trim()}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Generate Slides from Lyrics
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-700 mb-2">Preview:</h3>
        <p className="text-sm text-gray-600">
          {lyrics.trim() ? (
            <>
              {songTitle.trim() && `Title slide + `}
              {autoSplit
                ? `${lyrics.split(/\n\s*\n/).filter(p => p.trim()).length} slides`
                : '1 slide'}
            </>
          ) : (
            'Enter lyrics to see preview'
          )}
        </p>
      </div>
    </div>
  );
}
