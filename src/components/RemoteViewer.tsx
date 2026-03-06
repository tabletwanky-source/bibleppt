import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Wifi, WifiOff, Loader2 } from 'lucide-react';

export default function RemoteViewer() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    if (session) {
      setSessionId(session);
      connect(session);
    }
  }, []);

  const connect = (id: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}//${host}`);

    socket.onopen = () => {
      setConnected(true);
      socket.send(JSON.stringify({
        type: 'join',
        role: 'viewer',
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
      setTimeout(() => connect(id), 3000);
    };

    ws.current = socket;
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white text-center">
        <div className="space-y-4">
          <Smartphone className="w-16 h-16 mx-auto text-indigo-400" />
          <h1 className="text-2xl font-bold">Invalid Session</h1>
          <p className="text-slate-400">Please use a valid viewer link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
      {/* Status Bar (Subtle) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
        {connected ? (
          <Wifi className="w-4 h-4 text-emerald-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-rose-400" />
        )}
        <span className="text-[10px] font-mono">{sessionId.slice(0, 6)}</span>
      </div>

      {!state ? (
        <div className="flex-grow flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Connecting to Presentation...</p>
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
          <div className="max-w-4xl w-full space-y-8">
            {/* Header / Reference */}
            <div className="text-indigo-400 font-bold text-2xl tracking-tight">
              {state.reference || "BibleSlide Viewer"}
            </div>

            {/* Content (Actual Slide Content) */}
            <div className="text-4xl md:text-6xl font-medium leading-tight text-slate-100 whitespace-pre-wrap">
              {state.content || `Slide ${state.slideIndex + 1} of ${state.totalSlides}`}
            </div>
            
            <div className="pt-12">
              <div className="inline-block px-6 py-2 bg-slate-900 rounded-full text-slate-500 font-bold text-sm">
                {state.mode === 'bible' ? 'Bible Verse' : 'Song Lyrics'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {state && (
        <div className="h-1 w-full bg-slate-900">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${((state.slideIndex + 1) / state.totalSlides) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
