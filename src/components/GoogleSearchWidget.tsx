import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Search, Loader2, Globe, ExternalLink, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function GoogleSearchWidget() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState<string | null>(null);
  const [sources, setSources] = useState<{ uri: string; title: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearchResponse(null);
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY });
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setSearchResponse(result.text || "No response generated.");

      // Extract URLs from grounding metadata
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedSources = chunks
          .filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({
            uri: chunk.web.uri,
            title: chunk.web.title,
          }));
        setSources(extractedSources);
      }
    } catch (err: any) {
      console.error("Gemini Search Error:", err);
      setError("Failed to fetch information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-bold text-lg">AI Web Search</h3>
          <p className="text-xs text-slate-500">Grounded by Google Search</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything (e.g., History of the Bible in Haiti)"
          className="w-full pl-12 pr-12 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-sm mb-4">
          {error}
        </div>
      )}

      {searchResponse && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {searchResponse}
            </p>
          </div>

          {sources.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Sources</h4>
              <div className="flex flex-wrap gap-2">
                {sources.map((source, i) => (
                  <a
                    key={i}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                  >
                    <span className="truncate max-w-[150px]">{source.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!searchResponse && !loading && !error && (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400 italic">
            Ask a question to get up-to-date information from the web.
          </p>
        </div>
      )}
    </div>
  );
}
