import React, { useEffect } from 'react';
import { Globe } from 'lucide-react';

export default function GoogleSearchWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cse.google.com/cse.js?cx=e02360493be254c06';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg">AI Web Search</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Grounded by Google Search</p>
        </div>
      </div>

      <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Ask anything (e.g., History of the Bible in Haiti)
      </div>

      <div className="gcse-search"></div>

      <style>{`
        .gcse-search {
          width: 100%;
        }
        .gsc-control-cse {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }
        .gsc-input-box {
          border-radius: 12px !important;
          background: rgb(248 250 252) !important;
          border: 1px solid rgb(226 232 240) !important;
        }
        .dark .gsc-input-box {
          background: rgb(15 23 42) !important;
          border: 1px solid rgb(51 65 85) !important;
        }
        .gsc-search-button {
          border-radius: 12px !important;
          background: rgb(79 70 229) !important;
        }
        .gsc-search-button:hover {
          background: rgb(67 56 202) !important;
        }
        .gsc-results {
          width: 100% !important;
        }
        .gsc-result {
          border-radius: 12px !important;
          margin-bottom: 12px !important;
          padding: 12px !important;
          background: rgb(248 250 252) !important;
          border: 1px solid rgb(226 232 240) !important;
        }
        .dark .gsc-result {
          background: rgb(15 23 42) !important;
          border: 1px solid rgb(51 65 85) !important;
        }
        .gs-title {
          color: rgb(79 70 229) !important;
          font-weight: 600 !important;
        }
        .dark .gs-title {
          color: rgb(129 140 248) !important;
        }
      `}</style>
    </div>
  );
}
