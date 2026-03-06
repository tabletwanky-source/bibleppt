import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Square, 
  RefreshCw,
  Wifi,
  WifiOff,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../i18n/LanguageContext';

interface RemoteControlProps {
  sessionId: string;
  userId: string;
}

export default function RemoteControl({ sessionId, userId }: RemoteControlProps) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [goToValue, setGoToValue] = useState('');
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const channelName = `presentation:${userId}:${sessionId}`;
    channelRef.current = supabase.channel(channelName);

    channelRef.current
      .on('broadcast', { event: 'slide-update' }, (payload: any) => {
        const { index, total } = payload.payload;
        setCurrentSlide(index);
        setTotalSlides(total);
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setStatus('disconnected');
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId, sessionId]);

  const sendAction = (action: string, value?: any) => {
    if (channelRef.current && status === 'connected') {
      channelRef.current.send({
        type: 'broadcast',
        event: 'remote-control',
        payload: { action, value }
      });
    }
  };

  const handleGoTo = (e: React.FormEvent) => {
    e.preventDefault();
    const index = parseInt(goToValue) - 1;
    if (!isNaN(index)) {
      sendAction('GOTO', index);
      setGoToValue('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col p-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <h1 className="text-xl font-bold tracking-tight">BibSlide Remote</h1>
        </div>
        <div className="text-slate-500">
          {status === 'connected' ? <Wifi size={20} /> : <WifiOff size={20} />}
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-center shadow-2xl border border-slate-800">
        <div className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-2">
          {t('presentation.current')}
        </div>
        <div className="text-7xl font-black text-indigo-500 mb-2">
          {currentSlide + 1}
        </div>
        <div className="text-slate-400 font-medium">
          of {totalSlides || '?'} slides
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-6 h-48">
          <button 
            onClick={() => sendAction('PREV')}
            disabled={status !== 'connected' || currentSlide === 0}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-50 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all shadow-lg border border-slate-700"
          >
            <ChevronLeft size={48} className="text-slate-300" />
            <span className="font-bold uppercase tracking-wider text-xs text-slate-400">{t('presentation.previous')}</span>
          </button>
          <button 
            onClick={() => sendAction('NEXT')}
            disabled={status !== 'connected' || (totalSlides > 0 && currentSlide === totalSlides - 1)}
            className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
          >
            <ChevronRight size={48} className="text-white" />
            <span className="font-bold uppercase tracking-wider text-xs text-indigo-200">{t('presentation.next')}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <button 
            onClick={() => {
              sendAction('TOGGLE_TIMER');
              setIsTimerRunning(!isTimerRunning);
            }}
            className={`h-24 rounded-3xl flex items-center justify-center gap-3 font-bold transition-all border ${
              isTimerRunning 
                ? 'bg-red-500/10 border-red-500/50 text-red-500' 
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            {isTimerRunning ? <Square size={24} /> : <Play size={24} />}
            {t('presentation.timer')}
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="h-24 bg-slate-800 border border-slate-700 rounded-3xl flex items-center justify-center gap-3 font-bold text-slate-300 active:rotate-180 transition-all duration-500"
          >
            <RefreshCw size={24} />
            Sync
          </button>
        </div>

        {/* Go To Slide */}
        <form onSubmit={handleGoTo} className="mt-4">
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
              <Hash size={20} />
            </div>
            <input 
              type="number"
              value={goToValue}
              onChange={(e) => setGoToValue(e.target.value)}
              placeholder={t('presentation.goToSlide')}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 pl-14 pr-6 text-lg font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <button 
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm"
            >
              Go
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-slate-600 text-xs font-medium uppercase tracking-widest">
          Connected to Session: <span className="text-slate-500">{sessionId.substring(0, 8)}</span>
        </p>
      </div>
    </div>
  );
}
