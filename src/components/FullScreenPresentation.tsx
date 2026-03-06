import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize, X, Clock, Eye } from 'lucide-react';
import { Slide } from '../services/presentationService';
import { getTheme } from '../config/themes';

interface FullScreenPresentationProps {
  slides: Slide[];
  theme: string;
  sessionId?: string;
  onClose: () => void;
  onSlideChange?: (index: number) => void;
}

export default function FullScreenPresentation({
  slides,
  theme,
  sessionId,
  onClose,
  onSlideChange
}: FullScreenPresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showStageView, setShowStageView] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const themeConfig = getTheme(theme);
  const currentSlideData = slides[currentSlide];

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    let timeout: any;
    if (showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls, currentSlide]);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case ' ':
          nextSlide();
          break;
        case 'ArrowLeft':
          previousSlide();
          break;
        case 'f':
        case 'F':
          toggleFullScreen();
          break;
        case 'Escape':
          if (isFullScreen) {
            exitFullScreen();
          } else {
            onClose();
          }
          break;
        case 's':
        case 'S':
          setShowStageView(!showStageView);
          break;
      }
    },
    [currentSlide, isFullScreen, showStageView]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      const newIndex = currentSlide + 1;
      setCurrentSlide(newIndex);
      onSlideChange?.(newIndex);
      setShowControls(true);
    }
  };

  const previousSlide = () => {
    if (currentSlide > 0) {
      const newIndex = currentSlide - 1;
      setCurrentSlide(newIndex);
      onSlideChange?.(newIndex);
      setShowControls(true);
    }
  };

  const toggleFullScreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const exitFullScreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    setIsFullScreen(false);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const renderSlide = (slide: Slide, isPreview = false) => {
    const slideTheme = slide.theme || themeConfig;
    const background = slide.background || { type: 'color', value: themeConfig.backgroundColor };

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
      <div
        className={`relative w-full h-full flex items-center justify-center ${isPreview ? 'text-sm' : ''}`}
        style={backgroundStyle}
      >
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
          className={`relative z-10 max-w-5xl mx-auto px-8 text-center whitespace-pre-wrap ${isPreview ? 'text-base' : ''}`}
          style={{
            fontFamily: slideTheme.fontFamily,
            fontSize: isPreview ? '1rem' : slideTheme.fontSize,
            color: slideTheme.textColor,
            textShadow: slideTheme.textShadow ? '0 2px 8px rgba(0,0,0,0.8)' : 'none',
            lineHeight: '1.5'
          }}
        >
          {slide.content}
        </div>
      </div>
    );
  };

  if (showStageView) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            {renderSlide(currentSlideData)}
          </div>

          <div className="h-16 bg-gray-900 flex items-center justify-between px-6 text-white">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg">{formatTime(elapsed)}</span>
              </div>
              <div className="text-gray-400">
                Slide {currentSlide + 1} / {slides.length}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowStageView(false)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Eye className="w-4 h-4" />
                Audience View
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="w-80 bg-gray-800 p-4 flex flex-col gap-4">
          <div className="text-white font-semibold">Next Slide</div>
          {currentSlide < slides.length - 1 ? (
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              {renderSlide(slides[currentSlide + 1], true)}
            </div>
          ) : (
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center text-gray-500">
              End of presentation
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentSlide(index);
                  onSlideChange?.(index);
                }}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  index === currentSlide
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="text-xs font-semibold mb-1">Slide {index + 1}</div>
                <div className="text-xs line-clamp-2">{slide.content}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black z-50"
      onMouseMove={() => setShowControls(true)}
    >
      {renderSlide(currentSlideData)}

      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={previousSlide}
                disabled={currentSlide === 0}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={nextSlide}
                disabled={currentSlide === slides.length - 1}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>

              <div className="text-white font-medium">
                {currentSlide + 1} / {slides.length}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-5 h-5" />
                <span className="font-mono">{formatTime(elapsed)}</span>
              </div>

              <button
                onClick={() => setShowStageView(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <Eye className="w-5 h-5" />
                Stage View
              </button>

              <button
                onClick={toggleFullScreen}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Maximize className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={onClose}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-6 left-6 text-white/60 text-sm">
        Press F for fullscreen • Arrow keys to navigate • S for stage view • ESC to exit
      </div>
    </div>
  );
}
