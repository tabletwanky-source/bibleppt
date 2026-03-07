import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import en from "./en.json";
import fr from "./fr.json";
import es from "./es.json";
import ht from "./ht.json";
import pt from "./pt.json";

type Translations = typeof en;

const translations: Record<string, any> = { en, fr, es, ht, pt };

interface LanguageContextType {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default to browser language or 'en'
  const getInitialLang = () => {
    const saved = localStorage.getItem("bibslide_lang");
    if (saved && translations[saved]) return saved;
    
    const browserLang = navigator.language.split('-')[0];
    if (translations[browserLang]) return browserLang;
    
    return "en"; // Default to English
  };

  const [lang, setLangState] = useState(getInitialLang());

  const setLang = (newLang: string) => {
    if (translations[newLang]) {
      setLangState(newLang);
      localStorage.setItem("bibslide_lang", newLang);
    }
  };

  const t = (key: string): any => {
    const keys = key.split(".");
    let result: any = translations[lang];
    
    for (const k of keys) {
      if (result && result[k]) {
        result = result[k];
      } else {
        // Fallback to English if key not found in current language
        let fallback: any = translations["en"];
        for (const fk of keys) {
          if (fallback && fallback[fk]) {
            fallback = fallback[fk];
          } else {
            return key; // Return the key itself if not found anywhere
          }
        }
        return fallback;
      }
    }
    return result;
  };

  useEffect(() => {
    localStorage.setItem("bibslide_lang", lang);
    // Update document language for accessibility
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
