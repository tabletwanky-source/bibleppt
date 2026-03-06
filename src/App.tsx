/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Download, Settings, BookOpen, Layers, Palette, ChevronRight, Loader as Loader2, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, X, Music, Type, ClipboardPaste, ArrowLeft, ArrowRight, Sun, Moon, Sparkles, Image, LayoutGrid as Layout, Play, CreditCard as Edit3, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import pptxgen from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from './supabaseClient';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SlideOptions from './components/SlideOptions';
import SlidePreview from './components/SlidePreview';
import CanvaIntegration from './components/CanvaIntegration';
import ContactForm from './components/ContactForm';
import AboutContent from './components/AboutContent';
import BibleSearch from './components/BibleSearch';
import LivePresentation from './components/LivePresentation';
import RemoteControl from './components/RemoteController';
import RemoteViewer from './components/RemoteViewer';
import { RemoteControlPage } from './components/RemoteControlPage';
import PresentationController from './components/PresentationController';
import ViewerMode from './components/ViewerMode';
import bibleFallback from './bible_fallback.json';
import { useLanguage } from './i18n/LanguageContext';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { normalizeBibleReference } from './services/bibleNormalization';

interface Verse {
  number: number;
  text: string;
}

interface BibleData {
  book: string;
  chapter: number;
  verses: Verse[];
  language: string;
  source: string;
}

interface SongPart {
  part: string;
  lines: string[];
}

interface SongData {
  title: string;
  collection?: string;
  author?: string;
  language: string;
  license: string;
  lyrics: SongPart[];
}

const LANGUAGES = [
  { id: 'Kreyòl', label: 'Kreyòl' },
  { id: 'Français', label: 'Français' },
  { id: 'English', label: 'English' },
];

const BIBLE_TRANSLATIONS = [
  { id: 'Louis Segond 1910', label: 'Louis Segond 1910' },
  { id: 'King James Version (KJV)', label: 'KJV' },
  { id: 'Reina-Valera 1960', label: 'RVR60' },
];

const THEMES = (t: any) => [
  { id: 'light', label: t('labels.themeLight'), bg: '#ffffff', text: '#1e293b', accent: '#4f46e5' },
  { id: 'dark', label: t('labels.themeDark'), bg: '#0f172a', text: '#f8fafc', accent: '#6366f1' },
  { id: 'bibslide', label: 'BibSlide', bg: '#1E3A8A', text: '#FFFFFF', accent: '#F4B400' },
  { id: 'worship', label: t('labels.themeWorship'), bg: '#1e3a8a', text: '#eff6ff', accent: '#60a5fa' },
  { id: 'gold', label: 'Doré', bg: '#78350f', text: '#fffbeb', accent: '#f59e0b' },
  { id: 'nature', label: t('labels.themeNature'), bg: '#064e3b', text: '#ecfdf5', accent: '#34d399' },
];

import { logUserActivity } from "./services/activityService";

export default function App() {
  const { lang, t } = useLanguage();
  const [view, setView] = useState<'landing' | 'generator' | 'auth' | 'dashboard' | 'live-presentation' | 'remote' | 'viewer' | 'presentations'>('landing');
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);

  const [mode, setMode] = useState<'bible' | 'song' | 'paste'>('bible');
  const [reference, setReference] = useState('');
  const [themeInput, setThemeInput] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [pasteType, setPasteType] = useState<'bible' | 'song'>('bible');
  const [language, setLanguage] = useState('Kreyòl');
  const [bibleTranslation, setBibleTranslation] = useState('Bib Kreyòl 1985');
  const [loading, setLoading] = useState(false);
  const [bibleData, setBibleData] = useState<BibleData | null>(null);
  const [songData, setSongData] = useState<SongData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState('');
  
  // Slide Options
  const [versesPerSlide, setVersesPerSlide] = useState(1);
  const [linesPerSlide, setLinesPerSlide] = useState(2);
  const [selectedTheme, setSelectedTheme] = useState(THEMES(t)[1]);
  const [churchName, setChurchName] = useState('');

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Update default translation when language changes
  useEffect(() => {
    if (lang === 'en') setBibleTranslation('King James Version (KJV)');
    else if (lang === 'es') setBibleTranslation('Reina-Valera 1960');
    else setBibleTranslation('Louis Segond 1910');
  }, [lang]);

  const [slideStyle, setSlideStyle] = useState({
    font: "Arial",
    fontSize: 32,
    bgColor: "#ffffff",
    brightness: 100,
    textColor: "#000000",
    bgImage: null as string | null,
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

  // Handle Routing from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const sessionParam = params.get('session');
    const userParam = params.get('user');
    const path = window.location.pathname;

    if ((viewParam === 'remote' || path === '/remote') && sessionParam) {
      setView('remote');
    }
    if ((viewParam === 'viewer' || path === '/viewer') && sessionParam) {
      setView('viewer');
    }
    if (viewParam === 'presentations' || path === '/presentations') {
      setView('presentations');
    }
  }, []);

  // Auto Save & Load
  useEffect(() => {
    const saved = localStorage.getItem('bibslide_autosave');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.slideStyle) setSlideStyle(data.slideStyle);
        if (data.bibleData) setBibleData(data.bibleData);
        if (data.songData) setSongData(data.songData);
        if (data.pastedText) setPastedText(data.pastedText);
        if (data.mode) setMode(data.mode);
        if (data.reference) setReference(data.reference);
      } catch (e) {
        console.error("Failed to load autosave", e);
      }
    }
  }, []);

  useEffect(() => {
    const dataToSave = {
      slideStyle,
      bibleData,
      songData,
      pastedText,
      mode,
      reference
    };
    localStorage.setItem('bibslide_autosave', JSON.stringify(dataToSave));
  }, [slideStyle, bibleData, songData, pastedText, mode, reference]);

  const adjustBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * (percent - 100));
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  };

  const getSlidesForPreview = () => {
    if (mode === 'bible' && bibleData) {
      const grouped: { header?: string; content: string; slideNumber: number }[] = [];
      for (let i = 0; i < bibleData.verses.length; i += versesPerSlide) {
        const group = bibleData.verses.slice(i, i + versesPerSlide);
        const startVerse = group[0].number;
        const endVerse = group[group.length - 1].number;
        
        const header = `${bibleData.book} ${bibleData.chapter > 0 ? bibleData.chapter + ':' : ''}${startVerse}${group.length > 1 ? '-' + endVerse : ''}`;
        
        // Clean up content: remove leading numbers if they are redundant or just ensure they are formatted nicely
        const content = group.map(v => {
          // Remove any leading "0." or blank lines if they somehow got in
          // Also remove the verse number if it's at the start of the text to avoid "1. 1. Text"
          let cleanText = v.text.replace(/^0\.\s*/, '').trim();
          
          // If the text starts with the verse number followed by a dot or space, remove it
          const verseNumRegex = new RegExp(`^${v.number}[\\.\\s]+\\s*`);
          cleanText = cleanText.replace(verseNumRegex, '');
          
          return versesPerSlide === 1 ? cleanText : `${v.number}. ${cleanText}`;
        }).join('\n\n');
        
        grouped.push({ 
          header, 
          content,
          slideNumber: Math.floor(i / versesPerSlide) + 1
        });
      }
      return grouped;
    } else if (mode === 'song' && songData) {
      const allLines: { header?: string; content: string; slideNumber: number }[] = [];
      let slideCount = 0;
      songData.lyrics.forEach(part => {
        for (let i = 0; i < part.lines.length; i += linesPerSlide) {
          slideCount++;
          allLines.push({ 
            header: part.part ? `${songData.title} - ${part.part}` : songData.title,
            content: part.lines.slice(i, i + linesPerSlide).join('\n'),
            slideNumber: slideCount
          });
        }
      });
      return allLines;
    } else if (mode === 'paste' && pastedText) {
      const lines = pastedText.split(/\r?\n/).filter(l => l.trim() !== "");
      const chunkSize = pasteType === 'bible' ? versesPerSlide : linesPerSlide;
      const grouped: { header?: string; content: string; slideNumber: number }[] = [];
      for (let i = 0; i < lines.length; i += chunkSize) {
        grouped.push({ 
          content: lines.slice(i, i + chunkSize).join('\n'),
          slideNumber: Math.floor(i / chunkSize) + 1
        });
      }
      return grouped;
    }
    return [];
  };

  const previewSlides = getSlidesForPreview();

  useEffect(() => {
    if (previewSlides.length > 0) {
      console.log("Generated slides:", previewSlides);
    }
  }, [previewSlides]);

  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [previewSlides.length]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        console.error("Supabase auth error:", error.message);
        if (error.message.includes("Refresh Token Not Found") || error.message.includes("invalid_refresh_token")) {
          supabase.auth.signOut();
          setUser(null);
        } else {
          setUser(user);
        }
      } else {
        setUser(user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event as string) === 'USER_DELETED') {
        setUser(null);
        localStorage.removeItem('supabase.auth.token'); // Force clear if needed
      } else {
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        setSlideStyle(data.preferences);
      }
    } catch (err) {
      console.error("Error loading preferences:", err);
    }
  };

  const handleSaveDesign = async (options: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user.id, 
          preferences: options,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      alert("Design ou sove ak siksè! 🎉");
    } catch (err) {
      console.error("Error saving design:", err);
      alert("Gen yon erè ki rive lè n ap sove design ou.");
    }
  };

  const handleFetchVerses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setLoading(true);
    setError(null);
    setBibleData(null);
    setSongData(null);

    const BIBLIA_KEY = import.meta.env.VITE_BIBLIA_API_KEY || 'a885981dd77323d92bb9190a36c6ea24';
    const translationMap: Record<string, string> = {
      'Louis Segond 1910': 'lsg',
      'King James Version (KJV)': 'kjv',
      'Reina-Valera 1960': 'rvr60'
    };

    try {
      if (mode === 'bible') {
        const normalizedRef = normalizeBibleReference(reference);
        const ref = normalizedRef.trim();
        const match = ref.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);
        
        // Offline: Try local fallback first
        if (!navigator.onLine) {
          if (match) {
            const [_, book, chapter, verseStart, verseEnd] = match;
            const searchKey = `${book} ${chapter}`;
            
            const fallbackKeys = Object.keys(bibleFallback);
            const foundKey = fallbackKeys.find(k => k.toLowerCase().includes(searchKey.toLowerCase()));
            
            if (foundKey) {
              const text = bibleFallback[foundKey as keyof typeof bibleFallback];
              setBibleData({
                book: book,
                chapter: parseInt(chapter),
                verses: [{ number: parseInt(verseStart) || 1, text }],
                language: 'Kreyòl',
                source: 'Offline Fallback'
              });
              setLoading(false);
              return;
            }
          }
        }

        const translation = translationMap[bibleTranslation] || (lang === 'en' ? 'kjv' : lang === 'es' ? 'rvr60' : 'lsg');
        
        // Biblia API
        const bibliaTranslation = translation.toUpperCase();
        const BIBLIA_KEY = import.meta.env.VITE_BIBLIA_API_KEY || 'a885981dd77323d92bb9190a36c6ea24';
        const url = `https://api.biblia.com/v1/bible/content/${bibliaTranslation}.txt.json?passage=${encodeURIComponent(ref)}&key=${BIBLIA_KEY}`;
        
        const fetchResponse = await fetch(url);
        if (!fetchResponse.ok) throw new Error(t('messages.errorSearch'));
        const data = await fetchResponse.json();
        
        if (!data.text) throw new Error(t('messages.errorNoVerse'));

        // Split text into multiple verses if it's a range
        // Biblia often returns text with verse numbers like "1 For God... 2 For God..."
        // We split by verse numbers that are followed by a space or period
        const verseParts = data.text.split(/(?=\d+[\.\s])/).filter((v: string) => v.trim() !== "");
        
        const verses: Verse[] = verseParts.map((part: string, index: number) => {
          const vMatch = part.trim().match(/^(\d+)[\.\s]+(.*)/);
          if (vMatch) {
            return { number: parseInt(vMatch[1]), text: vMatch[2].trim() };
          }
          // If no number found at start, use index + start verse from match
          const startVerse = match ? parseInt(match[3]) || 1 : 1;
          return { number: startVerse + index, text: part.trim() };
        });

        const fullText = verses.map(v => `${v.number} ${v.text}`).join('\n');
        setEditableText(fullText);
        setIsEditing(true);

        console.log("Generated slides:", verses);

        setBibleData({
          book: match ? match[1] : ref.split(' ')[0],
          chapter: match ? parseInt(match[2]) : 0,
          verses: verses,
          language: language,
          source: bibleTranslation
        });
        if (user) {
          await supabase.from('slides').insert({
            user_id: user.id,
            title: match ? `${match[1]} ${match[2]}` : ref,
            created_at: new Date().toISOString()
          });
          logUserActivity(user.id);
        }
      } else {
        setError(t('messages.songSearchNotAvailable'));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSlidesFromEdit = async () => {
    if (!editableText.trim()) return;

    // Smart Splitting Logic
    // 1. Split by verse numbers: \s*(?=\d+\s)
    let parts = editableText.split(/\s*(?=\d+[\s\.])/).filter(v => v.trim() !== "");
    
    // 2. If no verse numbers detected, split by sentences
    if (parts.length <= 1) {
      parts = editableText.split(/(?<=[.!?])\s+/).filter(v => v.trim() !== "");
    }

    // 3. Further split long parts (max 250 chars)
    const finalParts: string[] = [];
    parts.forEach(part => {
      if (part.length > 250) {
        // Split by words to avoid cutting in the middle of a word
        const words = part.split(' ');
        let currentPart = '';
        words.forEach(word => {
          if ((currentPart + ' ' + word).length > 250) {
            finalParts.push(currentPart.trim());
            currentPart = word;
          } else {
            currentPart += (currentPart ? ' ' : '') + word;
          }
        });
        if (currentPart) finalParts.push(currentPart.trim());
      } else {
        finalParts.push(part.trim());
      }
    });

    const newVerses: Verse[] = finalParts.map((text, index) => {
      // Try to extract verse number if it exists at the start
      const vMatch = text.match(/^(\d+)[\s\.]+(.*)/);
      if (vMatch) {
        return { number: parseInt(vMatch[1]), text: vMatch[2] };
      }
      return { number: index + 1, text };
    });

    if (bibleData) {
      setBibleData({
        ...bibleData,
        verses: newVerses
      });
    }

    // Bonus: Save to Supabase
    if (user && bibleData) {
      try {
        await supabase.from('user_edits').insert({
          user_id: user.id,
          original_passage: reference,
          edited_text: editableText,
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error saving edit:", err);
      }
    }

    setIsEditing(false);
  };

  const getPptxBackground = (bgImage: string | null, adjustedBg: string) => {
    if (!bgImage) return { color: adjustedBg.replace('#', '') };
    if (bgImage.startsWith('data:')) {
      const base64 = bgImage.split(',')[1];
      return { data: base64 };
    }
    return { path: bgImage };
  };

  const getPdfFont = (font: string) => {
    const standardFonts: Record<string, string> = {
      'Arial': 'helvetica',
      'Times New Roman': 'times',
      'Courier New': 'courier',
      'Verdana': 'helvetica',
      'Montserrat': 'helvetica',
      'Poppins': 'helvetica',
      'Open Sans': 'helvetica',
      'Playfair Display': 'times',
      'Space Grotesk': 'helvetica',
      'JetBrains Mono': 'courier'
    };
    return standardFonts[font] || 'helvetica';
  };

  const generatePPTX = () => {
    if (!bibleData && !songData && !pastedText) return;

    const pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';

    const themeColors = {
      light: { bg: 'FFFFFF', text: '1E293B', accent: '4F46E5' },
      dark: { bg: '0F172A', text: 'F8FAFC', accent: '6366F1' },
      bibslide: { bg: '1E3A8A', text: 'FFFFFF', accent: 'F4B400' },
      worship: { bg: '1E3A8A', text: 'EFF6FF', accent: '60A5FA' },
      gold: { bg: '78350F', text: 'FFFBEB', accent: 'F59E0B' },
      nature: { bg: '064E3B', text: 'ECFDF5', accent: '34D399' },
    }[selectedTheme.id as 'light' | 'dark' | 'bibslide' | 'worship' | 'gold' | 'nature'] || { bg: 'FFFFFF', text: '000000', accent: '4F46E5' };

    const adjustedBg = adjustBrightness(slideStyle.bgColor, slideStyle.brightness).replace('#', '');
    const isDarkBg = slideStyle.brightness < 50 || (parseInt(slideStyle.bgColor.replace('#', ''), 16) < 0x888888 && slideStyle.brightness < 80);
    const calculatedTextColor = isDarkBg ? 'FFFFFF' : '000000';
    const textColor = (slideStyle.textColor || calculatedTextColor).replace('#', '');

    if (mode === 'bible' && bibleData) {
      previewSlides.forEach((slideData) => {
        const slide = pres.addSlide();
        slide.background = getPptxBackground(slideStyle.bgImage, adjustedBg);
        
        if (slideStyle.bgImage && slideStyle.brightness < 100) {
          slide.addShape(pres.ShapeType.rect, {
            x: 0, y: 0, w: '100%', h: '100%',
            fill: { color: '000000', transparency: 100 - slideStyle.brightness }
          });
        }

        if (churchName) {
          slide.addText(churchName, {
            x: 0.5, y: 0.3, w: '90%',
            fontSize: 14,
            color: themeColors.accent,
            align: 'right',
            italic: true
          });
        }

        if (slideData.header) {
          slide.addText(slideData.header, {
            x: 0.5, y: 0.5, w: '90%',
            fontSize: 24,
            color: themeColors.accent,
            bold: true,
            fontFace: slideStyle.font
          });
        }

        slide.addText(slideData.content, {
          x: 1, y: 1.2, w: '80%', h: '60%',
          fontSize: slideStyle.fontSize,
          color: textColor,
          align: 'center',
          valign: 'middle',
          fontFace: slideStyle.font
        });
      });

      pres.writeFile({ fileName: `${bibleData.book}_${bibleData.chapter}.pptx` });
    } else if (mode === 'song' && songData) {
      previewSlides.forEach((slideData) => {
        const slide = pres.addSlide();
        slide.background = getPptxBackground(slideStyle.bgImage, adjustedBg);
        
        if (slideStyle.bgImage && slideStyle.brightness < 100) {
          slide.addShape(pres.ShapeType.rect, {
            x: 0, y: 0, w: '100%', h: '100%',
            fill: { color: '000000', transparency: 100 - slideStyle.brightness }
          });
        }

        if (churchName) {
          slide.addText(churchName, {
            x: 0.5, y: 0.3, w: '90%',
            fontSize: 14,
            color: themeColors.accent,
            align: 'right',
            italic: true
          });
        }

        if (slideData.header) {
          slide.addText(slideData.header, {
            x: 0.5, y: 0.5, w: '90%',
            fontSize: 24,
            color: themeColors.accent,
            bold: true,
            fontFace: slideStyle.font
          });
        }

        slide.addText(slideData.content, {
          x: 1, y: 1.2, w: '80%', h: '60%',
          fontSize: slideStyle.fontSize,
          color: textColor,
          align: 'center',
          valign: 'middle',
          fontFace: slideStyle.font
        });
      });

      pres.writeFile({ fileName: `${songData.title.replace(/\s+/g, '_')}.pptx` });
    } else if (mode === 'paste' && pastedText) {
      previewSlides.forEach((slideData) => {
        const slide = pres.addSlide();
        slide.background = getPptxBackground(slideStyle.bgImage, adjustedBg);
        
        if (slideStyle.bgImage && slideStyle.brightness < 100) {
          slide.addShape(pres.ShapeType.rect, {
            x: 0, y: 0, w: '100%', h: '100%',
            fill: { color: '000000', transparency: 100 - slideStyle.brightness }
          });
        }

        if (churchName) {
          slide.addText(churchName, {
            x: 0.5, y: 0.3, w: '90%',
            fontSize: 14,
            color: themeColors.accent,
            align: 'right',
            italic: true
          });
        }

        slide.addText(slideData.content, {
          x: 1, y: 1.2, w: '80%', h: '60%',
          fontSize: slideStyle.fontSize,
          color: textColor,
          align: 'center',
          valign: 'middle',
          fontFace: slideStyle.font
        });
      });
      pres.writeFile({ fileName: `BibSlide_Pasted.pptx` });
    }
  };

  const generatePDF = () => {
    if (!bibleData && !songData && !pastedText) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1280, 720]
    });

    const themeColors = {
      light: { bg: '#FFFFFF', text: '#1E293B', accent: '#4F46E5' },
      dark: { bg: '#0F172A', text: '#F8FAFC', accent: '#6366F1' },
      worship: { bg: '#1E3A8A', text: '#EFF6FF', accent: '#60A5FA' },
      nature: { bg: '#064E3B', text: '#ECFDF5', accent: '#34D399' },
    }[selectedTheme.id as 'light' | 'dark' | 'worship' | 'nature'];

    const adjustedBg = adjustBrightness(slideStyle.bgColor, slideStyle.brightness);
    const isDarkBg = slideStyle.brightness < 50 || (parseInt(slideStyle.bgColor.replace('#', ''), 16) < 0x888888 && slideStyle.brightness < 80);
    const calculatedTextColor = isDarkBg ? '#FFFFFF' : '#000000';
    const textColor = slideStyle.textColor || calculatedTextColor;

    if (mode === 'bible' && bibleData) {
      previewSlides.forEach((slideData, index) => {
        if (index > 0) doc.addPage([1280, 720], 'landscape');
        
        if (slideStyle.bgImage) {
          doc.addImage(slideStyle.bgImage, 'JPEG', 0, 0, 1280, 720);
          if (slideStyle.brightness < 100) {
            doc.setFillColor(0, 0, 0);
            doc.setGState(new (doc as any).GState({ opacity: (100 - slideStyle.brightness) / 100 }));
            doc.rect(0, 0, 1280, 720, 'F');
            doc.setGState(new (doc as any).GState({ opacity: 1 }));
          }
        } else {
          doc.setFillColor(adjustedBg);
          doc.rect(0, 0, 1280, 720, 'F');
        }

        if (churchName) {
          doc.setFontSize(24);
          doc.setTextColor(themeColors.accent);
          doc.text(churchName, 1200, 40, { align: 'right' });
        }

        if (slideData.header) {
          doc.setFontSize(32);
          doc.setTextColor(themeColors.accent);
          doc.setFont(getPdfFont(slideStyle.font), 'bold');
          doc.text(slideData.header, 40, 40);
        }

        doc.setTextColor(textColor);
        doc.setFont(getPdfFont(slideStyle.font), 'normal');
        const fontSize = slideStyle.fontSize * 1.5;
        doc.setFontSize(fontSize);
        const splitText = doc.splitTextToSize(slideData.content, 1000);
        const textHeight = splitText.length * fontSize * 1.2;
        const yPos = (720 - textHeight) / 2 + fontSize;
        doc.text(splitText, 640, yPos, { align: 'center' });
      });

      doc.save(`${bibleData.book}_${bibleData.chapter}.pdf`);
    } else if (mode === 'song' && songData) {
      previewSlides.forEach((slideData, index) => {
        if (index > 0) doc.addPage([1280, 720], 'landscape');
        
        if (slideStyle.bgImage) {
          doc.addImage(slideStyle.bgImage, 'JPEG', 0, 0, 1280, 720);
          if (slideStyle.brightness < 100) {
            doc.setFillColor(0, 0, 0);
            doc.setGState(new (doc as any).GState({ opacity: (100 - slideStyle.brightness) / 100 }));
            doc.rect(0, 0, 1280, 720, 'F');
            doc.setGState(new (doc as any).GState({ opacity: 1 }));
          }
        } else {
          doc.setFillColor(adjustedBg);
          doc.rect(0, 0, 1280, 720, 'F');
        }

        if (churchName) {
          doc.setFontSize(24);
          doc.setTextColor(themeColors.accent);
          doc.text(churchName, 1200, 40, { align: 'right' });
        }

        if (slideData.header) {
          doc.setFontSize(32);
          doc.setTextColor(themeColors.accent);
          doc.setFont(getPdfFont(slideStyle.font), 'bold');
          doc.text(slideData.header, 40, 40);
        }

        doc.setTextColor(textColor);
        doc.setFont(getPdfFont(slideStyle.font), 'normal');
        const fontSize = slideStyle.fontSize * 1.5;
        doc.setFontSize(fontSize);
        const splitText = doc.splitTextToSize(slideData.content, 1000);
        const textHeight = splitText.length * fontSize * 1.2;
        const yPos = (720 - textHeight) / 2 + fontSize;
        doc.text(splitText, 640, yPos, { align: 'center' });
      });

      doc.save(`${songData.title.replace(/\s+/g, '_')}.pdf`);
    } else if (mode === 'paste' && pastedText) {
      previewSlides.forEach((slideData, index) => {
        if (index > 0) doc.addPage([1280, 720], 'landscape');
        
        if (slideStyle.bgImage) {
          doc.addImage(slideStyle.bgImage, 'JPEG', 0, 0, 1280, 720);
          if (slideStyle.brightness < 100) {
            doc.setFillColor(0, 0, 0);
            doc.setGState(new (doc as any).GState({ opacity: (100 - slideStyle.brightness) / 100 }));
            doc.rect(0, 0, 1280, 720, 'F');
            doc.setGState(new (doc as any).GState({ opacity: 1 }));
          }
        } else {
          doc.setFillColor(adjustedBg);
          doc.rect(0, 0, 1280, 720, 'F');
        }

        if (churchName) {
          doc.setFontSize(24);
          doc.setTextColor(themeColors.accent);
          doc.text(churchName, 1200, 40, { align: 'right' });
        }

        doc.setTextColor(textColor);
        doc.setFont(getPdfFont(slideStyle.font), 'normal');
        const fontSize = slideStyle.fontSize * 1.5;
        doc.setFontSize(fontSize);
        const splitText = doc.splitTextToSize(slideData.content, 1000);
        const textHeight = splitText.length * fontSize * 1.2;
        const yPos = (720 - textHeight) / 2 + fontSize;
        doc.text(splitText, 640, yPos, { align: 'center' });
      });
      doc.save(`BibSlide_Pasted.pdf`);
    }
  };

  const generatePNG = async () => {
    const previewElement = document.querySelector('.actual-slide-content') as HTMLElement;
    if (previewElement) {
      try {
        const canvas = await html2canvas(previewElement, {
          useCORS: true,
          scale: 2,
          backgroundColor: null,
        });
        const link = document.createElement('a');
        link.download = `BibSlide_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error("Error generating PNG:", err);
      }
    }
  };

  const exportToHTML = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="ht">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BibSlide Presentation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; background: #000; color: #fff; font-family: ${slideStyle.font}, sans-serif; overflow: hidden; }
        .slide { display: none; height: 100vh; width: 100vw; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; box-sizing: border-box; background-size: cover; background-position: center; }
        .slide.active { display: flex; }
        .text { font-size: ${slideStyle.fontSize * 1.5}px; line-height: 1.4; white-space: pre-wrap; max-width: 90%; }
        .controls { position: fixed; bottom: 20px; right: 20px; display: flex; gap: 10px; opacity: 0.3; transition: opacity 0.3s; }
        .controls:hover { opacity: 1; }
        button { background: rgba(255,255,255,0.2); border: none; color: white; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    ${previewSlides.map((slide, i) => `
    <div class="slide ${i === 0 ? 'active' : ''}" style="background-color: ${slideStyle.bgColor}; color: ${slideStyle.textColor}; background-image: ${slideStyle.bgImage ? `url(${slideStyle.bgImage})` : 'none'}">
        <div class="text">${typeof slide === 'string' ? slide : `
            <div style="color: #F4B400; font-size: 0.6em; margin-bottom: 0.5em; font-weight: bold;">${slide.header || ''}</div>
            <div>${slide.content}</div>
        `}</div>
    </div>`).join('')}
    <div class="controls">
        <button onclick="prev()">Anvan</button>
        <button onclick="next()">Apre</button>
    </div>
    <script>
        let current = 0;
        const slides = document.querySelectorAll('.slide');
        function show(n) {
            slides[current].classList.remove('active');
            current = (n + slides.length) % slides.length;
            slides[current].classList.add('active');
        }
        function next() { show(current + 1); }
        function prev() { show(current - 1); }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') next();
            if (e.key === 'ArrowLeft') prev();
        });
    </script>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BibSlide_${Date.now()}.html`;
    link.click();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('landing');
  };

  if (view === 'remote') {
    return <RemoteControlPage />;
  }

  if (view === 'viewer') {
    return <ViewerMode />;
  }

  if (view === 'presentations') {
    return <PresentationController />;
  }

  if (view === 'live-presentation') {
    return (
      <LivePresentation
        slides={previewSlides}
        userId={user?.id || 'anonymous'}
        onClose={() => setView('generator')}
        theme={selectedTheme}
        slideStyle={slideStyle}
      />
    );
  }

  if (view === 'dashboard' && user) {
    return (
      <Dashboard
        user={user}
        darkMode={darkMode}
        onLogout={handleLogout}
        onCreateNew={() => setView('generator')}
      />
    );
  }

  if (view === 'landing') {
    return (
      <LandingPage 
        onStart={() => setView(user ? 'dashboard' : 'generator')} 
        onLogin={() => setView('auth')}
        onShowAbout={() => setShowAbout(true)}
        onShowTerms={() => setShowTerms(true)}
        onShowPrivacy={() => setShowPrivacy(true)}
        onShowDonation={() => setShowDonation(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
      />
    );
  }

  if (view === 'auth') {
    return (
      <Auth 
        onBack={() => setView('landing')}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-10 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setView('landing')} className="p-1 hover:opacity-80 transition-opacity">
              <img 
                src="https://i.postimg.cc/X7j5bZCj/biblslide.png" 
                alt="BibSlide Logo" 
                className="w-10 h-10 object-contain"
                referrerPolicy="no-referrer"
              />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-indigo-600">BibSlide</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {THEMES(t).map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`w-6 h-6 rounded-lg border-2 transition-all ${selectedTheme.id === theme.id ? 'border-indigo-600 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: theme.bg.replace('bg-', '') }}
                  title={theme.label}
                />
              ))}
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-50 border-slate-200 text-indigo-600'}`}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {user && (
                <>
                  <button
                    onClick={() => setView('presentations')}
                    className="hidden sm:flex items-center gap-2 text-sm font-bold text-emerald-600 hover:underline"
                  >
                    <Play className="w-4 h-4" /> {t('nav.presentations')}
                  </button>
                  <button
                    onClick={() => setView('dashboard')}
                    className="hidden sm:flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
                  >
                    <Layout className="w-4 h-4" /> {t('nav.dashboard')}
                  </button>
                </>
              )}
              <button
                onClick={() => setView('landing')}
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> {t('buttons.prev')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Bible Search API Integration */}
        <BibleSearch 
          darkMode={darkMode} 
          onAddVerse={(text) => {
            setMode('paste');
            setPasteType('bible');
            setPastedText(text);
            // Scroll to editor
            window.scrollTo({ top: 400, behavior: 'smooth' });
          }} 
        />

        {/* Mode Switcher */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => { setMode('bible'); setError(null); setBibleData(null); setSongData(null); }}
            className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'bible' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-5 h-5" /> {t('labels.bible')}
          </button>
          <button 
            onClick={() => { setMode('song'); setError(null); setBibleData(null); setSongData(null); }}
            className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'song' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Music className="w-5 h-5" /> {t('nav.create')}
          </button>
          <button 
            onClick={() => { setMode('paste'); setError(null); setBibleData(null); setSongData(null); }}
            className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'paste' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ClipboardPaste className="w-5 h-5" /> {t('labels.paste')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Input & Config */}
          <div className="lg:col-span-1 space-y-6">
            <section className={`p-6 rounded-2xl shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Search className="w-4 h-4" /> {mode === 'bible' ? t('auth.searchPassage') : mode === 'song' ? t('auth.searchSong') : t('auth.pasteText')}
              </h2>
              {mode === 'paste' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mode Manuel</span>
                  </div>
                    <textarea
                      rows={8}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder={t('auth.pastePlaceholder')}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPasteType('bible')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                          pasteType === 'bible' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {t('labels.bible')} 📖
                      </button>
                      <button
                        onClick={() => setPasteType('song')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                          pasteType === 'song' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {t('labels.paste')} 🎵
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={generatePPTX}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                      >
                        <Download className="w-4 h-4" /> PPTX
                      </button>
                      <button 
                        onClick={generatePDF}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                      >
                        <Download className="w-4 h-4" /> PDF
                      </button>
                    </div>
                </div>
              ) : (
                <form onSubmit={handleFetchVerses} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      {mode === 'bible' ? t('labels.referenceBible') : t('labels.referenceSong')}
                    </label>
                      <input 
                        type="text" 
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder={mode === 'bible' ? t('labels.placeholderBible') : t('labels.placeholderSong')}
                        className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                      />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      {mode === 'bible' ? t('labels.bibleVersion') : t('labels.songLanguage')}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {mode === 'bible' ? (
                        BIBLE_TRANSLATIONS.map((trans) => (
                          <button
                            key={`bible-trans-${trans.id}`}
                            type="button"
                            onClick={() => setBibleTranslation(trans.id)}
                            className={`py-2 text-[10px] font-medium rounded-lg border transition-all ${
                              bibleTranslation === trans.id 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {trans.label}
                          </button>
                        ))
                      ) : (
                        LANGUAGES.map((lang) => (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => setLanguage(lang.id)}
                            className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                              language === lang.id 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {lang.label}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  <button 
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    {mode === 'bible' ? t('buttons.search') : t('buttons.search')}
                  </button>
                </form>
              )}

              {isEditing && mode === 'bible' && (
                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2">
                      <Edit3 className="w-4 h-4" /> {t('labels.editPassage') || 'Edit Passage'}
                    </h3>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      {t('buttons.cancel') || 'Cancel'}
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={editableText}
                    onChange={(e) => setEditableText(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <button
                    onClick={handleGenerateSlidesFromEdit}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" /> {t('buttons.generateSlides') || 'Generate Slides'}
                  </button>
                </div>
              )}
            </section>

            <section className={`p-6 rounded-2xl shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" /> {t('labels.slideStyle')}
              </h2>
              <div className="space-y-4">
                {(mode === 'bible' || (mode === 'paste' && pasteType === 'bible')) ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> {t('labels.versesPerSlide') || 'Verses per Slide'}
                    </label>
                    <select 
                      id="versesPerSlide"
                      value={versesPerSlide}
                      onChange={(e) => setVersesPerSlide(Number(e.target.value))}
                      className={`w-full px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <option value={1}>1 {t('labels.oneVersePerSlide') || 'Verse per Slide'}</option>
                      <option value={2}>2 {t('labels.twoVersesPerSlide') || 'Verses per Slide'}</option>
                      <option value={3}>3 {t('labels.threeVersesPerSlide') || 'Verses per Slide'}</option>
                      <option value={4}>4 {t('labels.fourVersesPerSlide') || 'Verses per Slide'}</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                      <Type className="w-3 h-3" /> {t('labels.linesPerSlide')}
                    </label>
                    <select 
                      value={linesPerSlide}
                      onChange={(e) => setLinesPerSlide(Number(e.target.value))}
                      className={`w-full px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <option value={1}>1 {t('labels.linesPerSlide')}</option>
                      <option value={2}>2 {t('labels.linesPerSlide')}</option>
                      <option value={3}>3 {t('labels.linesPerSlide')}</option>
                      <option value={4}>4 {t('labels.linesPerSlide')}</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> {t('labels.presentationTheme')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {THEMES(t).map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          setSelectedTheme(theme);
                          setSlideStyle(prev => ({
                            ...prev,
                            bgColor: theme.bg,
                            textColor: theme.text
                          }));
                        }}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          selectedTheme.id === theme.id 
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                          : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="w-full h-8 rounded-lg border border-slate-200 mb-2" style={{ backgroundColor: theme.bg }} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{t('labels.churchName')}</label>
                  <input 
                    type="text" 
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    placeholder={t('labels.churchNamePlaceholder')}
                    className={`w-full px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>
            </section>

            <SlideOptions 
              onChange={setSlideStyle} 
              onSave={handleSaveDesign}
              darkMode={darkMode} 
              isLoggedIn={!!user}
            />
          </div>

          {/* Right Column: Preview & Download */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  key="error-alert"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-700"
                >
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{t('auth.searchError')}</p>
                    <p className="text-xs opacity-80">{error}</p>
                  </div>
                </motion.div>
              )}

              {bibleData || songData || (mode === 'paste' && pastedText) ? (
                <motion.div 
                  key={mode === 'bible' ? "bible-results" : mode === 'song' ? "song-results" : "paste-results"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Preview Section */}
                  <div className={`p-8 rounded-3xl shadow-xl border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {mode === 'bible' && bibleData ? `${bibleData.book} ${bibleData.chapter}` : mode === 'song' ? songData?.title : t('auth.textPreview')}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                          {mode === 'bible' && bibleData ? `${bibleData.source} • ${bibleData.language}` : mode === 'song' ? `${songData?.collection || 'Chante'} • ${songData?.language}` : t('auth.pasteConvert')}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button 
                          onClick={generatePPTX}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                        >
                          <Download className="w-5 h-5" /> PPTX
                        </button>
                        <button 
                          onClick={generatePDF}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                          <Download className="w-5 h-5" /> PDF
                        </button>
                        <button 
                          onClick={generatePNG}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
                        >
                          <Image className="w-5 h-5" /> PNG
                        </button>
                        <button 
                          onClick={exportToHTML}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-100 transition-all active:scale-95"
                        >
                          <BookOpen className="w-5 h-5" /> HTML Share
                        </button>
                        {mode === 'bible' && bibleData && (
                          <button 
                            id="editPassage"
                            onClick={() => {
                              if (!isEditing) {
                                const fullText = bibleData.verses.map(v => `${v.number} ${v.text}`).join('\n');
                                setEditableText(fullText);
                                setIsEditing(true);
                                // Scroll to editor
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              } else {
                                setIsEditing(false);
                              }
                            }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${
                              isEditing 
                              ? 'bg-[#F4B400] text-[#1E3A8A]' 
                              : 'bg-[#1E3A8A] text-white hover:bg-[#F4B400] hover:text-[#1E3A8A]'
                            }`}
                          >
                            {isEditing ? (
                              <><Check className="w-5 h-5" /> {t('buttons.done') || 'Done'}</>
                            ) : (
                              <><Edit3 className="w-5 h-5" /> {t('buttons.edit') || 'Edit Text'}</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {mode === 'bible' && bibleData ? (
                        bibleData.verses.map((verse, idx) => (
                          <div key={`${verse.number}-${idx}`} className={`group flex gap-4 p-4 rounded-2xl transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                            <span className="text-indigo-600 font-bold text-lg leading-none pt-1">{verse.number}</span>
                            <p className={`${darkMode ? 'text-slate-200' : 'text-slate-700'} leading-relaxed`}>{verse.text}</p>
                          </div>
                        ))
                      ) : mode === 'song' && songData ? (
                        songData.lyrics.map((part, pIdx) => (
                          <div key={`part-${pIdx}`} className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-600">{part.part}</h4>
                            <div className={`p-4 rounded-2xl space-y-1 ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                              {part.lines.map((line, lIdx) => (
                                <p key={`line-${pIdx}-${lIdx}`} className={`${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{line}</p>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : mode === 'paste' && pastedText ? (
                        <div className={`p-6 rounded-2xl whitespace-pre-wrap leading-relaxed ${darkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
                          {pastedText}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Live Preview Section */}
                  <div className="slide-preview-container">
                    <SlidePreview 
                      slides={previewSlides} 
                      current={currentSlideIndex}
                      setCurrent={setCurrentSlideIndex}
                      options={slideStyle} 
                      darkMode={darkMode} 
                    />
                    
                    <div className="mt-4 flex justify-center">
                      <button 
                        onClick={() => setView('live-presentation')}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all hover:scale-105 active:scale-95"
                      >
                        <Play className="w-5 h-5" />
                        {t('presentation.start')}
                      </button>
                    </div>
                  </div>

                  {/* Canva Integration Section */}
                  <CanvaIntegration 
                    currentText={typeof previewSlides[currentSlideIndex] === 'string' ? previewSlides[currentSlideIndex] : (previewSlides[currentSlideIndex] as any)?.content || ""} 
                    darkMode={darkMode} 
                  />
                </motion.div>
              ) : !loading && (
                <motion.div 
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-[400px] flex flex-col items-center justify-center text-center space-y-4 bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl"
                >
                  <div className="bg-slate-100 p-4 rounded-full">
                    <BookOpen className="w-12 h-12 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-400">{t('auth.nothingHere')}</h3>
                    <p className="text-sm text-slate-400 max-w-xs">{t('auth.nothingHereSubtitle')}</p>
                  </div>
                </motion.div>
              )}

              {loading && (
                <div 
                  key="loading-state"
                  className="h-[400px] flex flex-col items-center justify-center space-y-4"
                >
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <BookOpen className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-indigo-600 font-medium animate-pulse">
                    {mode === 'bible' ? t('auth.searchingBible') : t('auth.searchingSong')}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* App Info Section */}
        <section className={`mt-16 p-8 rounded-[2rem] border transition-all text-center max-w-4xl mx-auto ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-indigo-50/50 border-indigo-100'}`}>
          <div className="bg-indigo-600/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            {t('about.title')}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-2xl mx-auto mb-6">
            {t('about.tagline')}. {t('about.description1').replace(/<\/?[^>]+(>|$)/g, "")}
          </p>
          <button 
            onClick={() => setShowAbout(true)}
            className="text-indigo-600 font-bold text-sm hover:underline flex items-center justify-center gap-2 mx-auto"
          >
            {t('buttons.learnMore')} <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </main>

      <footer className="py-6 text-center text-sm text-gray-600 bg-gray-100 border-t">
        © 2026 BibSlide — Tool for Churches. Powered by Wanky Massenat.  
        <a href="mailto:support@bibleslide.org" className="text-[#1E3A8A] hover:text-[#F4B400] ml-1">support@bibleslide.org</a>
      </footer>

      {/* Modals */}
      <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title={t('nav.terms')}>
        <TermsContent />
      </Modal>

      <Modal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title={t('nav.privacy')}>
        <PrivacyContent />
      </Modal>

      <Modal isOpen={showDonation} onClose={() => setShowDonation(false)} title={t('nav.donation')}>
        <DonationContent />
      </Modal>

      <Modal isOpen={showContact} onClose={() => setShowContact(false)} title={t('nav.contact')}>
        <ContactForm darkMode={darkMode} />
      </Modal>

      <Modal isOpen={showAbout} onClose={() => setShowAbout(false)} title={t('labels.aboutTitle')}>
        <AboutContent />
      </Modal>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-8 overflow-y-auto custom-scrollbar text-slate-600 leading-relaxed">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const TermsContent = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6 text-sm sm:text-base">
      <section>
        <h4 className="font-bold text-slate-900 mb-2">{t('terms.section1Title')}</h4>
        <p dangerouslySetInnerHTML={{ __html: t('terms.section1Desc') }} />
      </section>
      <section>
        <h4 className="font-bold text-slate-900 mb-2">{t('terms.section2Title')}</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('terms.section2Item1')}</li>
          <li dangerouslySetInnerHTML={{ __html: t('terms.section2Item2') }} />
          <li>{t('terms.section2Item3')}</li>
        </ul>
      </section>
      <section>
        <h4 className="font-bold text-slate-900 mb-2">{t('terms.section3Title')}</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('terms.section3Item1')}</li>
          <li>{t('terms.section3Item2')}</li>
          <li>{t('terms.section3Item3')}</li>
        </ul>
      </section>
      <section>
        <h4 className="font-bold text-slate-900 mb-2">{t('terms.section4Title')}</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li dangerouslySetInnerHTML={{ __html: t('terms.section4Item1') }} />
          <li>{t('terms.section4Item2')}</li>
          <li>{t('terms.section4Item3')}</li>
        </ul>
      </section>
      <section>
        <h4 className="font-bold text-slate-900 mb-2">{t('terms.section5Title')}</h4>
        <p>{t('terms.section5Desc')}</p>
      </section>
      <section>
        <h4 className="font-bold text-slate-900 mb-2">{t('terms.section6Title')}</h4>
        <p>{t('terms.section6Desc')}</p>
      </section>
    </div>
  );
};

const PrivacyContent = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-4 text-sm sm:text-base">
      <p>{t('privacy.desc1')}</p>
      <p dangerouslySetInnerHTML={{ __html: t('privacy.desc2') }} />
    </div>
  );
};

const DonationContent = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-8 text-sm sm:text-base text-slate-600 leading-relaxed">
      <div className="text-center space-y-4">
        <p>
          {t('labels.aboutSubtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="bg-indigo-100 p-1.5 rounded-lg">💳</span> {t('labels.electronicDonation')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="flex flex-col items-center gap-4">
            <a 
              href="https://www.paypal.com/paypalme/wankym" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl shadow-lg shadow-blue-100 font-bold text-center transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              PayPal
            </a>
            <div className="bg-white p-2 rounded-xl shadow-md border border-slate-100">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.paypal.com/paypalme/wankym" alt="PayPal QR" className="w-32 h-32" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <a 
              href="https://donate.stripe.com/6oUbJ3fDU59O8369e6awo0b?locale=en&__embed_source=buy_btn_1SaoLdRpnzu1xmnI6UMOWfGF" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl shadow-lg shadow-indigo-100 font-bold text-center transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Stripe
            </a>
            <div className="bg-white p-2 rounded-xl shadow-md border border-slate-100">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://donate.stripe.com/6oUbJ3fDU59O8369e6awo0b" alt="Stripe QR" className="w-32 h-32" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="bg-emerald-100 p-1.5 rounded-lg">🏦</span> {t('labels.bankTransfer')}
        </h4>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Banreservas</p>
            <p className="text-slate-900 font-medium">Cuenta de Ahorro: <span className="font-bold text-indigo-600">960-469-7671</span></p>
            <p className="text-slate-600">Titular: <strong>Wanky Massenat</strong></p>
          </div>
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Banco BHD</p>
            <p className="text-slate-900 font-medium">Cuenta: <span className="font-bold text-indigo-600">36-475-68-0012</span></p>
            <p className="text-slate-600">Titular: <strong>Wanky Massenat</strong></p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-slate-500 italic text-center border-t border-slate-100 pt-6">
        {t('labels.bibleQuote')}
      </p>
    </div>
  );
};
