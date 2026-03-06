import { useState, useEffect } from 'react';
import { sessionService } from '../services/sessionService';
import { presentationService, Slide, Theme } from '../services/presentationService';
import { Eye, Wifi, WifiOff } from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';

export default function ViewerPage() {
  const params = new URLSearchParams(window.location.search);
  const sessionCode = params.get('session');

  const [connected, setConnected] = useState(false);
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (sessionCode) {
      connectToSession(sessionCode);
    }
  }, [sessionCode]);

  const connectToSession = async (code: string) => {
    const result = await sessionService.getSessionByCode(code);

    if (!result) {
      setConnected(false);
      return;
    }

    const { session } = result;
    setSessionId(session.id);

    const presentation = await presentationService.getPresentation(session.presentation_id);
    if (presentation) {
      setSlides(presentation.slides || []);
      setSlideIndex(session.current_slide_index);
      setCurrentSlide(presentation.slides[session.current_slide_index]);

      if (presentation.theme_id) {
        const themes = await presentationService.getAllThemes();
        const selectedTheme = themes.find(t => t.id === presentation.theme_id);
        if (selectedTheme) setTheme(selectedTheme);
      }
    }

    const realtimeChannel = sessionService.subscribeToSession(session.id, (newIndex) => {
      setSlideIndex(newIndex);
      if (presentation?.slides && presentation.slides[newIndex]) {
        setCurrentSlide(presentation.slides[newIndex]);
      }
    });

    setChannel(realtimeChannel);
    setConnected(true);

    await sessionService.trackViewer(session.id);
  };

  useEffect(() => {
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [channel]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionId && connected) {
        sessionService.updateViewerLastSeen(sessionId);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [sessionId, connected]);

  const getSlideStyle = (slide: Slide | null) => {
    if (!slide) return {};

    const baseStyle: any = {
      fontFamily: theme?.font_family || 'Inter',
      fontSize: `${(theme?.font_size || 48) * 0.6}px`,
      color: theme?.text_color || '#FFFFFF',
      textShadow: theme?.text_shadow ? '2px 2px 8px rgba(0,0,0,0.8)' : 'none'
    };

    if (slide.backgroundImage) {
      return {
        ...baseStyle,
        backgroundImage: `linear-gradient(rgba(0,0,0,${theme?.overlay_opacity || 0.3}), rgba(0,0,0,${theme?.overlay_opacity || 0.3})), url(${slide.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }

    if (slide.gradient || theme?.background_gradient) {
      return {
        ...baseStyle,
        background: slide.gradient || theme?.background_gradient
      };
    }

    return {
      ...baseStyle,
      backgroundColor: slide.backgroundColor || theme?.background_color || '#000000'
    };
  };

  if (!sessionCode) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Viewer Mode</h1>
          <p className="text-gray-600 mb-6">
            Enter a session code or scan a QR code to view a presentation
          </p>
          <div className="text-sm text-gray-500">
            Session code required in URL: /viewer?session=CODE
          </div>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Not Connected</h1>
          <p className="text-gray-600 mb-4">
            Session <span className="font-mono bg-gray-100 px-2 py-1 rounded">{sessionCode}</span> not found or inactive
          </p>
          <p className="text-sm text-gray-500">
            Waiting for presenter to start...
          </p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wifi className="w-5 h-5 text-green-500" />
          <span className="text-white text-sm font-medium">Connected</span>
          <span className="text-gray-400 text-sm">
            Session: {sessionCode}
          </span>
        </div>
        <div className="text-white text-sm">
          Slide {slideIndex + 1} / {slides.length}
        </div>
      </div>

      <div className="h-[calc(100vh-56px)] flex items-center justify-center p-4">
        {currentSlide ? (
          <div
            className="w-full max-w-4xl aspect-video rounded-lg shadow-2xl flex items-center justify-center p-8 text-center"
            style={getSlideStyle(currentSlide)}
          >
            <div className="max-w-3xl">
              {currentSlide.reference && (
                <div className="text-xl mb-4 opacity-90">
                  {currentSlide.reference}
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">
                {currentSlide.content}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-white text-2xl">Waiting for presentation to start...</div>
        )}
      </div>
    </div>
  );
}
