import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();
  
  const langs = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  return (
    <div className="flex gap-2">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`rounded-full p-2 transition-all duration-300 hover:bg-[#F4B400] hover:shadow-[0_0_15px_rgba(244,180,0,0.5)] ${
            lang === l.code 
            ? 'bg-[#F4B400]/20 shadow-[0_0_10px_rgba(244,180,0,0.3)]' 
            : 'bg-white/10'
          }`}
          title={l.label}
        >
          <span className="text-xl">{l.flag}</span>
        </button>
      ))}
    </div>
  );
};
