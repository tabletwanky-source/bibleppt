import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Sparkles, Loader as Loader2, CircleAlert as AlertCircle, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface AIBibleSearchProps {
  darkMode?: boolean;
  onAddVerses?: (verses: BibleVerse[]) => void;
  onGenerateSlides?: (verses: BibleVerse[]) => void;
}

export default function AIBibleSearch({ darkMode = false, onAddVerses, onGenerateSlides }: AIBibleSearchProps) {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'verse' | 'topic'>('verse');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BibleVerse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-bible-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          query: query.trim(),
          language: lang,
          searchType
        })
      });

      const data = await response.json();

      if (data.fallback || data.error) {
        setError(data.error || 'AI search is temporarily unavailable. Please use standard Bible search.');
        setShowResults(false);
      } else if (data.success && data.verses) {
        setResults(data.verses);
        setShowResults(true);
      } else {
        setError('No verses found. Try a different search query.');
        setShowResults(false);
      }
    } catch (err: any) {
      console.error('AI search error:', err);
      setError('Search failed. Please try again or use standard Bible search.');
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const detectSearchType = (text: string) => {
    const versePattern = /^[A-Za-z0-9\s]+\d+:\d+(-\d+)?$/;
    if (versePattern.test(text.trim())) {
      setSearchType('verse');
    } else {
      setSearchType('topic');
    }
  };

  return (
    <div className={`rounded-2xl p-6 border ${
      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    } shadow-lg`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg">AI Bible Search</h3>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Search by verse reference or topic in natural language
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              detectSearchType(e.target.value);
            }}
            placeholder={searchType === 'verse' ? 'e.g., John 3:16 or Matthew 5:1-10' : 'e.g., verses about faith, love in the Bible'}
            className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSearchType('verse')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              searchType === 'verse'
                ? 'bg-indigo-600 text-white'
                : darkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 inline-block mr-2" />
            Verse Search
          </button>
          <button
            type="button"
            onClick={() => setSearchType('topic')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              searchType === 'topic'
                ? 'bg-indigo-600 text-white'
                : darkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 inline-block mr-2" />
            Topic Search
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching with AI...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search with AI
            </>
          )}
        </button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Search Error</p>
              <p className="text-xs">{error}</p>
            </div>
          </motion.div>
        )}

        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                Found {results.length} {results.length === 1 ? 'verse' : 'verses'}
              </h4>
              {onGenerateSlides && (
                <button
                  onClick={() => onGenerateSlides(results)}
                  className="text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all"
                >
                  Generate Slides
                </button>
              )}
            </div>

            <div className={`space-y-3 max-h-96 overflow-y-auto rounded-xl p-4 ${
              darkMode ? 'bg-slate-900' : 'bg-slate-50'
            }`}>
              {results.map((verse, index) => (
                <motion.div
                  key={`${verse.book}-${verse.chapter}-${verse.verse}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                      {verse.verse}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-indigo-600 mb-1">
                        {verse.book} {verse.chapter}:{verse.verse}
                      </p>
                      <p className={`text-sm leading-relaxed ${
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {verse.text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {onAddVerses && (
              <button
                onClick={() => onAddVerses(results)}
                className="w-full py-2 px-4 border-2 border-dashed border-indigo-300 hover:border-indigo-500 text-indigo-600 rounded-xl font-medium transition-all"
              >
                Add All to Editor
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`mt-4 p-3 rounded-lg text-xs ${
        darkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50 text-slate-500'
      }`}>
        <p className="font-semibold mb-1">Examples:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Verse: "John 3:16" or "Matthew 5:1-10"</li>
          <li>Topic: "verses about faith" or "love in the Bible"</li>
          <li>Question: "What does the Bible say about hope?"</li>
        </ul>
      </div>
    </div>
  );
}
