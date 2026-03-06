import React, { useState, useEffect } from 'react';
import { sessionService } from '../services/presentationService';
import { getTheme } from '../config/themes';
import { supabase } from '../supabaseClient';
import { Eye, Wifi, WifiOff } from 'lucide-react';

export default function ViewerMode() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session');

  const [session, setSession] = useState<any>(null);
  const [presentation, setPresentation] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    loadSession();
    subscribeToUpdates();
  }, [sessionId]);

  const loadSession = async () => {
    if (!sessionId) return;

    const { data: sessionData, error: sessionError } = await supabase
      .from('presentation_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('is_active', true)
      .maybeSingle();

    if (sessionError || !sessionData) {
      setLoading(false);
      return;
    }

    setSession(sessionData);

    const { data: presentationData } = await supabase
      .from('presentations')
      .select('*')
      .eq('id', sessionData.presentation_id)
      .single();

    if (presentationData) {
      setPresentation(presentationData);
    }

    setConnected(true);
    setLoading(false);
  };

  const subscribeToUpdates = () => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`viewer-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'presentation_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          setSession(payload.new);
          setConnected(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Connecting to presentation...</p>
        </div>
      </div>
    );
  }

  if (!sessionId || !session || !presentation) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center text-white max-w-md px-6">
          <WifiOff className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-4">No Active Presentation</h1>
          <p className="text-gray-400">
            {!sessionId
              ? 'No session ID provided. Please use a valid viewer link.'
              : 'This presentation session is not active or does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  const slides = presentation.slides || [];
  const currentSlide = slides[session.current_slide_index];
  const theme = getTheme(presentation.theme);

  if (!currentSlide) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center text-white">
          <Eye className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg">Waiting for presentation to start...</p>
        </div>
      </div>
    );
  }

  const slideTheme = currentSlide.theme || theme;
  const background = currentSlide.background || { type: 'color', value: theme.backgroundColor };

  let backgroundStyle: any = {};

  if (background.type === 'color') {
    backgroundStyle.backgroundColor = background.value;
  } else if (background.type === 'gradient') {
    backgroundStyle.background = background.value;
  } else if (background.type === 'image') {
    backgroundStyle.backgroundImage = `url(${background.value})`;
    backgroundStyle.backgroundSize = 'cover';
    backgroundStyle.backgroundPosition = 'center';
  }

  return (
    <div className="relative w-full h-screen" style={backgroundStyle}>
      {background.type === 'video' && (
        <video
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover"
          src={background.value}
        />
      )}

      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${slideTheme.overlayOpacity || 0.3})`
        }}
      />

      <div
        className="relative z-10 h-full flex items-center justify-center px-8 text-center"
        style={{
          fontFamily: slideTheme.fontFamily,
          fontSize: slideTheme.fontSize,
          color: slideTheme.textColor,
          textShadow: slideTheme.textShadow ? '0 2px 8px rgba(0,0,0,0.8)' : 'none',
          lineHeight: '1.5'
        }}
      >
        <div className="max-w-5xl whitespace-pre-wrap">{currentSlide.content}</div>
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-2 rounded-lg">
        {connected ? (
          <>
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-white text-sm">Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-400" />
            <span className="text-white text-sm">Disconnected</span>
          </>
        )}
      </div>

      <div className="absolute bottom-4 left-4 bg-black/50 text-white text-sm px-3 py-2 rounded-lg">
        Slide {session.current_slide_index + 1} / {slides.length}
      </div>
    </div>
  );
}
