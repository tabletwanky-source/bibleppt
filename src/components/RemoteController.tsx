import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { supabase } from '../supabaseClient';
import { 
  ChevronLeft, 
  ChevronRight, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Hash,
  ArrowRight,
  Loader2,
  Search,
  QrCode,
  Link as LinkIcon
} from 'lucide-react';

export default function RemoteController() {
  const { t } = useLanguage();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(true);
  const [manualSessionId, setManualSessionId] = useState('');
  const [goToIndex, setGoToIndex] = useState('');
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoveredServer, setDiscoveredServer] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    
    if (session) {
      setSessionId(session);
      setIsSearching(false);
      connect(session);
    } else {
      // Start discovery
      startDiscovery();
    }
  }, []);

  const startDiscovery = () => {
    setIsSearching(true);
    setDiscoveryError(null);
    setDiscoveredServer(null);

    const discoveryChannel = supabase.channel('bibleslide:discovery');
    
    discoveryChannel
      .on('broadcast', { event: 'server-presence' }, (payload: any) => {
        const { sessionId: foundId, localIp, port } = payload.payload;
        console.log('Discovered server:', foundId, localIp, port);
        
        setDiscoveredServer({ id: foundId, ip: localIp, port });
        
        // Automatically connect after a short delay to show the user we found it
        setTimeout(() => {
          setSessionId(foundId);
          setIsSearching(false);
          connect(foundId, localIp, port);
        }, 1500);
        
        supabase.removeChannel(discoveryChannel);
      })
      .subscribe();

    // Timeout discovery after 8 seconds
    const timer = setTimeout(() => {
      if (isSearching) {
        setIsSearching(false);
        setDiscoveryError('Could not find any active BibleSlide sessions on your network.');
        supabase.removeChannel(discoveryChannel);
      }
    }, 8000);

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(discoveryChannel);
    };
  };

  const connect = (id: string, localIp?: string, port?: number) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = window.location.host;
    
    // If we have a local IP and we are on the same network, we could try it
    // but browsers often block cross-origin WS to local IPs from HTTPS sites.
    // So we'll stick to the current host which is the most reliable.
    if (localIp && port && window.location.hostname === localIp) {
      host = `${localIp}:${port}`;
    }

    const socket = new WebSocket(`${protocol}//${host}`);

    socket.onopen = () => {
      setConnected(true);
      socket.send(JSON.stringify({
        type: 'join',
        role: 'remote',
        sessionId: id
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'sync') {
        setState(data.state);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      // Attempt reconnect if we still have a session ID
      if (id) {
        setTimeout(() => connect(id, localIp, port), 3000);
      }
    };

    ws.current = socket;
  };

  const handleManualConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSessionId.trim()) {
      const id = manualSessionId.trim().toUpperCase();
      setSessionId(id);
      setIsSearching(false);
      connect(id);
    }
  };

  const updateSlide = (newIndex: number) => {
    if (ws.current && connected && state) {
      const index = Math.max(0, Math.min(newIndex, state.totalSlides - 1));
      ws.current.send(JSON.stringify({
        type: 'update',
        sessionId,
        state: { ...state, slideIndex: index }
      }));
    }
  };

  const handleGoTo = (e: React.FormEvent) => {
    e.preventDefault();
    const index = parseInt(goToIndex) - 1;
    if (!isNaN(index)) {
      updateSlide(index);
      setGoToIndex('');
    }
  };

  if (isSearching) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="space-y-8 max-w-sm w-full">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
            {discoveredServer ? (
              <div className="w-20 h-20 mx-auto bg-emerald-500 rounded-2xl flex items-center justify-center relative z-10 animate-bounce">
                <Wifi className="w-10 h-10 text-white" />
              </div>
            ) : (
              <Search className="w-20 h-20 mx-auto text-indigo-400 relative z-10 animate-bounce" />
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">
              {discoveredServer ? 'Found BibleSlide!' : 'Searching...'}
            </h1>
            <p className="text-slate-400 leading-relaxed">
              {discoveredServer 
                ? `Connecting to session ${discoveredServer.id}...`
                : 'Looking for an active BibleSlide presentation on your Wi-Fi network.'}
            </p>
          </div>
          {!discoveredServer && (
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
            </div>
          )}
          <button 
            onClick={() => setIsSearching(false)}
            className="text-slate-500 text-sm font-bold hover:text-slate-300 transition-colors"
          >
            Cancel and enter manually
          </button>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center font-sans">
        <div className="space-y-10 max-w-sm w-full">
          <div className="space-y-4">
            <Smartphone className="w-16 h-16 mx-auto text-indigo-400" />
            <h1 className="text-3xl font-black tracking-tight">Connect Remote</h1>
            {discoveryError && (
              <p className="text-rose-400 text-sm font-medium bg-rose-400/10 p-3 rounded-xl border border-rose-400/20">
                {discoveryError}
              </p>
            )}
            <p className="text-slate-400">
              Please enter the Session ID from the presenter screen or scan the QR code.
            </p>
          </div>

          <form onSubmit={handleManualConnect} className="space-y-4">
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="text"
                value={manualSessionId}
                onChange={(e) => setManualSessionId(e.target.value)}
                placeholder="Enter Session ID"
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500 transition-all font-bold uppercase tracking-widest"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Connect Now <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="p-4 bg-slate-800 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-slate-400 hover:bg-slate-700 transition-colors"
            >
              <Search className="w-5 h-5" />
              Retry Discovery
            </button>
            <div className="p-4 bg-slate-800 rounded-2xl flex flex-col items-center gap-2 text-xs font-bold text-slate-400 opacity-50 cursor-not-allowed">
              <QrCode className="w-5 h-5" />
              Scan QR Code
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">BibleSlide Remote</h1>
            <div className="flex items-center gap-1.5 mt-1">
              {connected ? (
                <><Wifi className="w-3 h-3 text-emerald-400" /> <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Connected</span></>
              ) : (
                <><WifiOff className="w-3 h-3 text-rose-400" /> <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Disconnected</span></>
              )}
            </div>
          </div>
        </div>
        <div className="px-3 py-1 bg-slate-800 rounded-full text-xs font-mono text-slate-400">
          ID: {sessionId.slice(0, 6)}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-center p-6 space-y-12">
        {!state ? (
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-500" />
            <p className="text-slate-400">Waiting for presenter...</p>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <div className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Current Slide</div>
              <div className="text-8xl font-black text-indigo-400 flex items-baseline gap-2 justify-center">
                {state.slideIndex + 1}
                <span className="text-2xl text-slate-700 font-bold">/ {state.totalSlides}</span>
              </div>
              <div className="text-slate-400 font-medium italic mt-2 max-w-xs mx-auto line-clamp-3 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                {state.content || state.reference || "Presentation Active"}
              </div>
            </div>

            {/* Controls */}
            <div className="w-full grid grid-cols-2 gap-4">
              <button 
                onClick={() => updateSlide(state.slideIndex - 1)}
                disabled={state.slideIndex === 0}
                className="aspect-square bg-slate-800 rounded-[2rem] flex flex-col items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30 border border-slate-700"
              >
                <ChevronLeft className="w-10 h-10 text-indigo-400" />
                <span className="font-bold text-sm uppercase tracking-widest">Prev</span>
              </button>
              <button 
                onClick={() => updateSlide(state.slideIndex + 1)}
                disabled={state.slideIndex >= state.totalSlides - 1}
                className="aspect-square bg-indigo-600 rounded-[2rem] flex flex-col items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30 shadow-xl shadow-indigo-900/20"
              >
                <ChevronRight className="w-10 h-10 text-white" />
                <span className="font-bold text-sm uppercase tracking-widest">Next</span>
              </button>
            </div>

            {/* Quick Jump */}
            <form onSubmit={handleGoTo} className="w-full max-w-xs relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Hash className="w-5 h-5" />
              </div>
              <input 
                type="number" 
                value={goToIndex}
                onChange={(e) => setGoToIndex(e.target.value)}
                placeholder="Go to slide..."
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-12 pr-16 outline-none focus:border-indigo-500 transition-all font-bold"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 p-2 rounded-xl hover:bg-indigo-500 transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-8 text-center border-t border-slate-800">
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
          BibleSlide Remote Control System &copy; 2026
        </p>
      </div>
    </div>
  );
}
