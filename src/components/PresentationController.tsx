import React, { useState, useEffect } from 'react';
import { Presentation, presentationService } from '../services/presentationService';
import { sessionService } from '../services/sessionService';
import SlideEditor from './SlideEditor';
import FullScreenPresentation from './FullScreenPresentation';
import PresentationManager from './PresentationManager';
import { exportService } from '../services/exportService';
import { Download, FileDown, Image } from 'lucide-react';

export default function PresentationController() {
  const [currentView, setCurrentView] = useState<'manager' | 'editor' | 'present'>('manager');
  const [currentPresentation, setCurrentPresentation] = useState<Presentation | null>(null);
  const [presentationSession, setPresentationSession] = useState<any>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    if (presentationSession) {
      const channel = sessionService.subscribeToSession(
        presentationSession.id,
        handleSessionUpdate
      );

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [presentationSession]);

  const handleSessionUpdate = (payload: any) => {
    if (payload.new.current_slide_index !== currentSlideIndex) {
      setCurrentSlideIndex(payload.new.current_slide_index);
    }
  };

  const handleNewPresentation = () => {
    const newPresentation: Presentation = {
      id: crypto.randomUUID(),
      user_id: '',
      title: 'Untitled Presentation',
      slides: [],
      theme: 'classic',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_template: false
    };
    setCurrentPresentation(newPresentation);
    setCurrentView('editor');
  };

  const handleOpenPresentation = (presentation: Presentation) => {
    setCurrentPresentation(presentation);
    setCurrentView('editor');
  };

  const handleUpdatePresentation = async (updates: Partial<Presentation>) => {
    if (!currentPresentation) return;

    const updated = { ...currentPresentation, ...updates };
    setCurrentPresentation(updated);

    if (currentPresentation.id && currentPresentation.user_id) {
      await presentationService.updatePresentation(currentPresentation.id, updates);
    }
  };

  const handleSavePresentation = async () => {
    if (!currentPresentation) return;

    if (currentPresentation.user_id) {
      await presentationService.updatePresentation(currentPresentation.id, currentPresentation);
      alert('Presentation saved successfully!');
    } else {
      const saved = await presentationService.createPresentation(
        currentPresentation.title,
        currentPresentation.slides,
        currentPresentation.theme
      );
      if (saved) {
        setCurrentPresentation(saved);
        alert('Presentation created successfully!');
      }
    }
  };

  const handleStartPresentation = async () => {
    if (!currentPresentation || !currentPresentation.slides.length) return;

    if (currentPresentation.id) {
      const session = await sessionService.createSession(currentPresentation.id);
      setPresentationSession(session);
    }

    setCurrentSlideIndex(0);
    setCurrentView('present');
  };

  const handleSlideChange = async (index: number) => {
    setCurrentSlideIndex(index);

    if (presentationSession) {
      await sessionService.updateSessionSlide(presentationSession.id, index);
    }
  };

  const handleEndPresentation = async () => {
    if (presentationSession) {
      await sessionService.endSession(presentationSession.id);
      setPresentationSession(null);
    }
    setCurrentView('editor');
  };

  const handleExportPPTX = async () => {
    if (!currentPresentation) return;
    await exportService.exportToPPTX(
      currentPresentation.slides,
      currentPresentation.theme,
      currentPresentation.title
    );
    setShowExportMenu(false);
  };

  const handleExportPDF = async () => {
    if (!currentPresentation) return;
    await exportService.exportToPDF(
      currentPresentation.slides,
      currentPresentation.theme,
      currentPresentation.title,
      document.body
    );
    setShowExportMenu(false);
  };

  const handleExportImages = async () => {
    if (!currentPresentation) return;
    await exportService.exportToImages(
      currentPresentation.slides,
      currentPresentation.theme,
      currentPresentation.title
    );
    setShowExportMenu(false);
  };

  if (currentView === 'present' && currentPresentation) {
    return (
      <FullScreenPresentation
        slides={currentPresentation.slides}
        theme={currentPresentation.theme}
        sessionId={presentationSession?.id}
        onClose={handleEndPresentation}
        onSlideChange={handleSlideChange}
      />
    );
  }

  if (currentView === 'editor' && currentPresentation) {
    return (
      <div className="relative">
        <SlideEditor
          presentation={currentPresentation}
          onUpdate={handleUpdatePresentation}
          onPresent={handleStartPresentation}
          onSave={handleSavePresentation}
        />

        {showExportMenu && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowExportMenu(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Export Presentation</h3>

              <div className="space-y-3">
                <button
                  onClick={handleExportPPTX}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">PowerPoint (.pptx)</div>
                    <div className="text-xs text-blue-100">Export as editable presentation</div>
                  </div>
                </button>

                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FileDown className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">PDF Document</div>
                    <div className="text-xs text-red-100">Export as printable PDF</div>
                  </div>
                </button>

                <button
                  onClick={handleExportImages}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Image className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">PNG Images</div>
                    <div className="text-xs text-green-100">Export each slide as image</div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowExportMenu(false)}
                className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowExportMenu(true)}
          className="fixed bottom-6 right-6 flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors z-40"
        >
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>
    );
  }

  return (
    <PresentationManager
      onOpenPresentation={handleOpenPresentation}
      onNewPresentation={handleNewPresentation}
    />
  );
}

import { supabase } from '../supabaseClient';
