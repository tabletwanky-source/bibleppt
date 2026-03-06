import { useState, useEffect, useCallback } from 'react';
import { Slide, Theme } from '../services/presentationService';
import { motion, AnimatePresence } from 'motion/react';

interface PresentationViewerProps {
  slides: Slide[];
  theme?: Theme;
  initialSlideIndex?: number;
  onSlideChange?: (index: number) => void;
  mode?: 'audience' | 'stage';
  showTimer?: boolean;
}

export default function PresentationViewer({
  slides,
  theme,
  initialSlideIndex = 0,
  onSlideChange,
  mode = 'audience',
  showTimer = false
}: PresentationViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlideIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    setCurrentSlide(initialSlideIndex);
  }, [initialSlideIndex]);

  useEffect(() => {
    if (showTimer) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showTimer]);

  const goToNextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      const newIndex = currentSlide + 1;
      setCurrentSlide(newIndex);
      onSlideChange?.(newIndex);
    }
  }, [currentSlide, slides.length, onSlideChange]);

  const goToPreviousSlide = useCallback(() => {
    if (currentSlide > 0) {
      const newIndex = currentSlide - 1;
      setCurrentSlide(newIndex);
      onSlideChange?.(newIndex);
    }
  }, [currentSlide, onSlideChange]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          goToNextSlide();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPreviousSlide();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextSlide, goToPreviousSlide, toggleFullscreen, isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSlideStyle = (slide: Slide) => {
    const baseStyle: any = {
      fontFamily: theme?.font_family || 'Inter',
      fontSize: `${theme?.font_size || 48}px`,
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

  if (mode === 'stage') {
    return (
      <div className="w-full h-screen bg-gray-900 flex flex-col">
        <div className="flex-1 flex gap-4 p-4">
          <div className="flex-1 relative">
            <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded text-sm">
              Current
            </div>
            <div
              className="w-full h-full rounded-lg flex items-center justify-center p-12 text-center"
              style={getSlideStyle(slides[currentSlide])}
            >
              <div className="max-w-4xl">
                {slides[currentSlide].reference && (
                  <div className="text-2xl opacity-80 mb-4">{slides[currentSlide].reference}</div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {slides[currentSlide].content}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 relative opacity-60">
            <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded text-sm z-10">
              Next
            </div>
            {currentSlide < slides.length - 1 ? (
              <div
                className="w-full h-full rounded-lg flex items-center justify-center p-12 text-center"
                style={getSlideStyle(slides[currentSlide + 1])}
              >
                <div className="max-w-4xl">
                  {slides[currentSlide + 1].reference && (
                    <div className="text-2xl opacity-80 mb-4">{slides[currentSlide + 1].reference}</div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed text-3xl">
                    {slides[currentSlide + 1].content}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full rounded-lg bg-gray-800 flex items-center justify-center">
                <div className="text-gray-400 text-2xl">End of Presentation</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-white text-xl">
              Slide {currentSlide + 1} / {slides.length}
            </div>
            {showTimer && (
              <div className="text-white text-xl">
                ⏱️ {formatTime(elapsedTime)}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={goToPreviousSlide}
              disabled={currentSlide === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={goToNextSlide}
              disabled={currentSlide === slides.length - 1}
              className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
            <button
              onClick={toggleFullscreen}
              className="px-6 py-2 bg-gray-700 text-white rounded"
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F)'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full flex items-center justify-center p-12 text-center"
          style={getSlideStyle(slides[currentSlide])}
        >
          <div className="max-w-6xl">
            {slides[currentSlide].reference && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 0.9 }}
                transition={{ delay: 0.2 }}
                className="text-3xl mb-6"
              >
                {slides[currentSlide].reference}
              </motion.div>
            )}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="whitespace-pre-wrap leading-relaxed"
            >
              {slides[currentSlide].content}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {!isFullscreen && (
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-4 py-2 rounded">
          {currentSlide + 1} / {slides.length}
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex gap-2">
        <button
          onClick={goToPreviousSlide}
          disabled={currentSlide === 0}
          className="bg-black/50 text-white px-4 py-2 rounded disabled:opacity-30"
        >
          ←
        </button>
        <button
          onClick={goToNextSlide}
          disabled={currentSlide === slides.length - 1}
          className="bg-black/50 text-white px-4 py-2 rounded disabled:opacity-30"
        >
          →
        </button>
      </div>
    </div>
  );
}
