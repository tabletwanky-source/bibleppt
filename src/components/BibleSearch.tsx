import React, { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Book, History, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import bibleFr from '../bible_fr.json';
import bibleFallback from '../bible_fallback.json';
import { useLanguage } from '../i18n/LanguageContext';
import { normalizeBibleReference } from '../services/bibleNormalization';

interface BibleSearchProps {
  darkMode: boolean;
  onAddVerse: (text: string) => void;
}

interface VerseData {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translations?: Record<string, string>;
}

export default function BibleSearch({ darkMode, onAddVerse }: BibleSearchProps) {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<VerseData[]>([]);

  const API_KEY = import.meta.env.VITE_BIBLIA_API_KEY || 'a885981dd77323d92bb9190a36c6ea24';
  const bibliaTranslation = lang === 'pt' ? 'OL' : lang === 'es' ? 'RVR60' : lang === 'en' ? 'KJV' : 'LSG';
  const BASE_URL = `https://api.biblia.com/v1/bible/content/${bibliaTranslation}.txt.json`;

  const languages = [
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
    { code: "es", label: "Español" },
    { code: "pt", label: "Português" },
  ];

  useEffect(() => {
    const cached = localStorage.getItem('bibslide_recent_verses');
    if (cached) {
      setRecentSearches(JSON.parse(cached));
    }
  }, []);

  const saveToCache = (verse: VerseData) => {
    const updated = [verse, ...recentSearches.filter(v => v.text !== verse.text)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('bibslide_recent_verses', JSON.stringify(updated));
  };

  const translateText = async (text: string, targetLang: string) => {
    try {
      const fetchRes = await fetch("https://libretranslate.de/translate", {
        method: "POST",
        body: JSON.stringify({
          q: text,
          source: "auto",
          target: targetLang,
          format: "text",
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (!fetchRes.ok) return null;
      const data = await fetchRes.json();
      return data.translatedText;
    } catch (e) {
      console.error(`Translation error for ${targetLang}:`, e);
      return null;
    }
  };

  const highlightKeywords = (text: string) => {
    const keywords = [
      'Dieu', 'Jésus', 'Seigneur', 'Christ', 'Eternel', 'Bondye', 'Seyè',
      'God', 'Jesus', 'Lord', 'Christ',
      'Dios', 'Jesús', 'Señor', 'Cristo',
      'Deus', 'Jesus', 'Senhor', 'Cristo'
    ];
    let highlighted = text;
    keywords.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      highlighted = highlighted.replace(regex, '<span class="text-indigo-600 font-bold">$1</span>');
    });
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const normalizedQuery = normalizeBibleReference(query);
    const searchQuery = normalizedQuery.trim();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Offline: Try local fallback first
      if (!navigator.onLine) {
        const fallbackKey = Object.keys(bibleFallback).find(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
        if (fallbackKey) {
          const text = bibleFallback[fallbackKey as keyof typeof bibleFallback];
          const [bookRef, verseRef] = fallbackKey.split(' ');
          const [chapter, verse] = verseRef.split(':');
          const data: VerseData = {
            book: bookRef,
            chapter: parseInt(chapter),
            verse: parseInt(verse),
            text: text,
            translations: {}
          };
          setResult(data);
          saveToCache(data);
          setLoading(false);
          return;
        }
      }

      if (navigator.onLine) {
        const translation = lang === 'pt' ? 'ol' : lang === 'en' ? 'kjv' : lang === 'es' ? 'rvr60' : 'lsg';

        // Biblia API
        const bibliaTranslation = translation.toUpperCase();
        const fetchResponse = await fetch(`https://api.biblia.com/v1/bible/content/${bibliaTranslation}.txt.json?passage=${encodeURIComponent(searchQuery)}&key=${API_KEY}`);
        if (!fetchResponse.ok) {
          if (fetchResponse.status === 404) throw new Error(t('messages.errorNoVerse'));
          throw new Error(t('messages.errorAPI'));
        }
        const data = await fetchResponse.json();
        
        if (!data.text || data.text.trim() === "") {
          throw new Error(t('messages.errorNoVerse'));
        }

        // Split text into multiple verses if it's a range
        const verseParts = data.text.split(/\n(?=\d+\s)/).filter((v: string) => v.trim() !== "");
        const formattedText = verseParts.length > 1 
          ? verseParts.map((v: string) => v.trim()).join('\n')
          : data.text;

        const verseData: VerseData = {
          book: searchQuery.split(' ')[0],
          chapter: 0,
          verse: 0,
          text: formattedText,
          translations: {}
        };

        // Fetch translations in parallel
        const translationPromises = languages.map(async (l) => {
          if (l.code === lang) return; // Skip current language
          const translated = await translateText(formattedText, l.code);
          if (translated) {
            verseData.translations![l.code] = translated;
          }
        });

        await Promise.all(translationPromises);

        setResult(verseData);
        saveToCache(verseData);
      } else {
        throw new Error(t('messages.errorOffline'));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full mb-8 space-y-4`}>
      <form onSubmit={handleSearch} className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('labels.enterVerse')}
          className={`w-full pl-12 pr-24 py-4 rounded-2xl border-2 transition-all outline-none text-lg font-medium ${
            darkMode 
            ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' 
            : 'bg-white border-slate-100 text-slate-900 focus:border-indigo-500 shadow-xl shadow-indigo-50'
          }`}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('buttons.search')}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium"
          >
            <AlertCircle className="w-4 h-4" /> {error}
          </motion.div>
        )}

        {result && (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-3xl border-2 transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-50 shadow-xl shadow-indigo-100/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-xs">
                    <Book className="w-4 h-4" /> {result.book} {result.chapter > 0 ? `${result.chapter}:${result.verse}` : ''}
                  </div>
                  <p className={`text-xl leading-relaxed font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {highlightKeywords(result.text)}
                  </p>
                </div>
                <button
                  onClick={() => onAddVerse(result.text)}
                  className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-lg shadow-emerald-100 transition-all active:scale-95 group"
                  title="Ajoute nan Slide"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                </button>
              </div>
            </motion.div>

            {result.translations && Object.keys(result.translations).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {languages.map((lang) => (
                  result.translations![lang.code] && (
                    <motion.div
                      key={lang.code}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-2xl border transition-all ${
                        darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{lang.label}</span>
                          <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {highlightKeywords(result.translations![lang.code])}
                          </p>
                        </div>
                        <button
                          onClick={() => onAddVerse(result.translations![lang.code])}
                          className="shrink-0 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                          title={`Ajoute ${lang.label} nan Slide`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {!result && !loading && recentSearches.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-2">
              <History className="w-3 h-3" /> {t('labels.recentSearches')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((v, i) => (
                <button
                  key={i}
                  onClick={() => setResult(v)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                    darkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600 shadow-sm'
                  }`}
                >
                  {v.book} {v.chapter}:{v.verse}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
