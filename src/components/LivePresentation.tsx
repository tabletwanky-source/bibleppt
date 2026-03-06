import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Smartphone,
  X,
  Timer,
  Play,
  Square,
  Eye,
  EyeOff,
  QrCode as QrIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../i18n/LanguageContext';
import { RemoteControlManager } from './RemoteControlManager';

interface LivePresentationProps {
  slides: { header?: string; content: string; slideNumber?: number }[];
  userId: string;
  onClose: () => void;
  theme: {
    bg: string;
    text: string;
    accent: string;
  };
  slideStyle: {
    font: string;
    fontSize: number;
    bgColor: string;
    textColor: string;
    bgImage: string | null;
    brightness: number;
  };
}

export default function LivePresentation({ 
  slides, 
  userId, 
  onClose, 
  theme,
  slideStyle 
}: LivePresentationProps) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [showRemoteManager, setShowRemoteManager] = useState(false);
  const [showPresenterNotes, setShowPresenterNotes] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 10).toUpperCase());
  const [networkInfo, setNetworkInfo] = useState<{ localIp: string; port: number } | null>(null);
  const [connectedClients, setConnectedClients] = useState(0);
  const [activeRemoteSession, setActiveRemoteSession] = useState<{ code: string | null; devices: number; allowed: boolean } | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch network info for local IP
    fetch('/api/network-info')
      .then(res => res.json())
      .then(data => setNetworkInfo(data))
      .catch(err => console.error("Failed to fetch network info", err));

    // Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}//${host}`);

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'join',
        role: 'presenter',
        sessionId,
        state: {
          slideIndex: currentIndex,
          totalSlides: slides.length,
          reference: typeof slides[currentIndex] === 'object' ? (slides[currentIndex] as any).header : '',
          content: typeof slides[currentIndex] === 'object' ? (slides[currentIndex] as any).content : slides[currentIndex]
        }
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'sync' && data.sender === 'remote') {
        setCurrentIndex(data.state.slideIndex);
      } else if (data.type === 'client-count') {
        setConnectedClients(data.count);
      }
    };

    ws.current = socket;

    // Discovery Broadcast via Supabase (Cloud Discovery)
    const discoveryChannel = supabase.channel('bibleslide:discovery');
    discoveryChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        discoveryChannel.send({
          type: 'broadcast',
          event: 'server-presence',
          payload: {
            sessionId,
            localIp: networkInfo?.localIp,
            port: networkInfo?.port,
            timestamp: Date.now()
          }
        });
      }
    });

    // Periodically broadcast presence
    const broadcastInterval = setInterval(() => {
      if (discoveryChannel) {
        discoveryChannel.send({
          type: 'broadcast',
          event: 'server-presence',
          payload: {
            sessionId,
            localIp: networkInfo?.localIp,
            port: networkInfo?.port,
            timestamp: Date.now()
          }
        });
      }
    }, 5000);

    return () => {
      if (ws.current) ws.current.close();
      supabase.removeChannel(discoveryChannel);
      clearInterval(broadcastInterval);
    };
  }, [sessionId, networkInfo]);

  // Broadcast current index whenever it changes
  useEffect(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'update',
        sessionId,
        state: { 
          slideIndex: currentIndex, 
          totalSlides: slides.length,
          reference: typeof slides[currentIndex] === 'object' ? (slides[currentIndex] as any).header : '',
          content: typeof slides[currentIndex] === 'object' ? (slides[currentIndex] as any).content : slides[currentIndex]
        }
      }));
    }
  }, [currentIndex, slides.length]);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const localRemoteUrl = networkInfo 
    ? `http://${networkInfo.localIp}:${networkInfo.port}/remote?session=${sessionId}`
    : `${window.location.origin}/remote?session=${sessionId}`;

  const viewerUrl = networkInfo
    ? `http://${networkInfo.localIp}:${networkInfo.port}/viewer?session=${sessionId}`
    : `${window.location.origin}/viewer?session=${sessionId}`;

  const handleRemoteCommand = (command: 'next' | 'previous') => {
    if (command === 'next') {
      setCurrentIndex(prev => Math.min(slides.length - 1, prev + 1));
    } else if (command === 'previous') {
      setCurrentIndex(prev => Math.max(0, prev - 1));
    }
  };

  const currentSlide = slides[currentIndex];
  const nextSlide = currentIndex < slides.length - 1 ? slides[currentIndex + 1] : null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      {/* Header / Controls */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <h2 className="font-semibold hidden sm:block">{t('presentation.title')}</h2>
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Timer size={16} />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
            <button 
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1 hover:text-white transition-colors"
            >
              {isTimerRunning ? <Square size={14} /> : <Play size={14} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowPresenterNotes(!showPresenterNotes)}
            className={`p-2 rounded-lg transition-colors ${showPresenterNotes ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
            title={t('presentation.presenter')}
          >
            {showPresenterNotes ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          <button
            onClick={() => setShowRemoteManager(true)}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${showRemoteManager ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            title={t('presentation.remote')}
          >
            <Smartphone size={20} />
            {activeRemoteSession?.code && (
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                {activeRemoteSession.code}
              </span>
            )}
            {(activeRemoteSession?.devices ?? connectedClients) > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activeRemoteSession?.devices ?? connectedClients}
              </span>
            )}
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Slide View */}
        <div className={`flex-1 flex items-center justify-center p-8 transition-all duration-500 ${showPresenterNotes ? 'w-2/3' : 'w-full'}`}>
          <div 
            className="relative w-full aspect-video rounded-xl shadow-2xl overflow-hidden flex items-center justify-center text-center p-12"
            style={{ 
              backgroundColor: slideStyle.bgColor,
              fontFamily: slideStyle.font,
              backgroundImage: slideStyle.bgImage ? `url(${slideStyle.bgImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Brightness Overlay */}
            {slideStyle.bgImage && (
              <div 
                className="absolute inset-0 bg-black pointer-events-none" 
                style={{ opacity: (100 - slideStyle.brightness) / 100 }}
              />
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 w-full"
                style={{ 
                  color: slideStyle.textColor,
                  fontSize: `${slideStyle.fontSize * 1.5}px`,
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {typeof currentSlide === 'string' ? currentSlide : (
                  <div className="flex flex-col items-center justify-center">
                    {currentSlide.header && (
                      <div className="text-[#F4B400] font-bold mb-4" style={{ fontSize: '0.6em' }}>
                        {currentSlide.header}
                      </div>
                    )}
                    <div>{currentSlide.content}</div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Overlays */}
            <button 
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              className="absolute left-0 inset-y-0 w-20 flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-black/20 to-transparent text-white"
            >
              <ChevronLeft size={48} />
            </button>
            <button 
              onClick={() => setCurrentIndex(prev => Math.min(slides.length - 1, prev + 1))}
              className="absolute right-0 inset-y-0 w-20 flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-l from-black/20 to-transparent text-white"
            >
              <ChevronRight size={48} />
            </button>
          </div>
        </div>

        {/* Presenter Sidebar */}
        <AnimatePresence>
          {showPresenterNotes && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-1/3 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto"
            >
              <div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                  {t('presentation.nextPreview')}
                </h3>
                {nextSlide ? (
                  <div 
                    className="w-full aspect-video rounded-lg border border-slate-700 p-4 text-xs overflow-hidden opacity-60 flex flex-col items-center justify-center text-center"
                    style={{ 
                      backgroundColor: slideStyle.bgColor,
                      color: slideStyle.textColor,
                      fontFamily: slideStyle.font
                    }}
                  >
                    {typeof nextSlide === 'string' ? nextSlide : (
                      <>
                        {nextSlide.header && (
                          <div className="text-[#F4B400] font-bold mb-2" style={{ fontSize: '0.6em' }}>
                            {nextSlide.header}
                          </div>
                        )}
                        <div>{nextSlide.content}</div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-sm">
                    End of Presentation
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                  Slide Navigation ({currentIndex + 1} / {slides.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-10 rounded flex items-center justify-center text-sm font-medium transition-all ${
                        i === currentIndex 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Progress */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
          >
            <ChevronLeft size={20} />
            {t('presentation.previous')}
          </button>
          <button 
            onClick={() => setCurrentIndex(prev => Math.min(slides.length - 1, prev + 1))}
            disabled={currentIndex === slides.length - 1}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
          >
            {t('presentation.next')}
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex-1 mx-8 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-500"
            initial={false}
            animate={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
          />
        </div>

        <div className="text-slate-400 text-sm font-mono">
          {currentIndex + 1} / {slides.length}
        </div>
      </div>

      {/* Remote Control Manager Modal */}
      <AnimatePresence>
        {showRemoteManager && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRemoteManager(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl p-8 max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowRemoteManager(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-10"
              >
                <X size={20} />
              </button>

              <RemoteControlManager
                onCommandReceived={handleRemoteCommand}
                onSessionChange={(info) => setActiveRemoteSession(info)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Legacy Remote Control Modal (WebSocket) */}
      <AnimatePresence>
        {showRemoteModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRemoteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl p-8 max-w-sm w-full text-center"
            >
              <button
                onClick={() => setShowRemoteModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              
              <div className="mb-6 flex justify-center">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <QRCodeSVG value={localRemoteUrl} size={200} />
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">{t('presentation.remote')}</h3>
              <p className="text-slate-500 mb-6">{t('presentation.scan')}</p>

              <div className="space-y-3 mb-6">
                <div className="bg-slate-100 p-3 rounded-lg flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center text-indigo-600">
                    <Smartphone size={16} />
                  </div>
                  <input 
                    readOnly 
                    value={localRemoteUrl} 
                    className="bg-transparent border-none text-[10px] text-slate-600 flex-1 outline-none font-mono"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(localRemoteUrl);
                      alert("Remote link copied!");
                    }}
                    className="text-indigo-600 text-xs font-bold"
                  >
                    Copy
                  </button>
                </div>

                <div className="bg-slate-100 p-3 rounded-lg flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded flex items-center justify-center text-emerald-600">
                    <Eye size={16} />
                  </div>
                  <input 
                    readOnly 
                    value={viewerUrl} 
                    className="bg-transparent border-none text-[10px] text-slate-600 flex-1 outline-none font-mono"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(viewerUrl);
                      alert("Viewer link copied!");
                    }}
                    className="text-indigo-600 text-xs font-bold"
                  >
                    Copy
                  </button>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const text = `Control my BibSlide presentation here: ${localRemoteUrl}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="flex-1 py-3 bg-[#25D366] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(localRemoteUrl);
                      alert("Link copied!");
                    }}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  >
                    Copy Link
                  </button>
                </div>
              </div>

              {connectedClients > 0 && (
                <div className="mb-6 flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  {connectedClients} {connectedClients === 1 ? 'device' : 'devices'} connected
                </div>
              )}

              <button 
                onClick={() => setShowRemoteModal(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
