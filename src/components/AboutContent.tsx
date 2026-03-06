import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function AboutContent() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-8 text-slate-600 leading-relaxed">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-indigo-600 mb-2">{t('about.title')}</h2>
        <p className="text-slate-400 font-medium uppercase tracking-widest text-xs">{t('about.tagline')}</p>
      </div>

      <div className="space-y-6">
        <p dangerouslySetInnerHTML={{ __html: t('about.description1') }} />
        <p dangerouslySetInnerHTML={{ __html: t('about.description2') }} />
        <p dangerouslySetInnerHTML={{ __html: t('about.description3') }} />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 border-l-4 border-indigo-600 pl-4">{t('about.missionTitle')}</h3>
        <p dangerouslySetInnerHTML={{ __html: t('about.missionDesc') }} />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 border-l-4 border-indigo-600 pl-4">{t('about.featuresTitle')}</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.isArray(t('about.features')) && (t('about.features') as string[]).map((item, i) => (
            <li key={i} className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl text-sm font-medium border border-slate-100">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 border-l-4 border-indigo-600 pl-4">{t('about.developerTitle')}</h3>
        <p dangerouslySetInnerHTML={{ __html: t('about.developerDesc') }} />
      </div>

      <div className="pt-8 border-t border-slate-100 text-center space-y-4">
        <div className="flex flex-wrap justify-center gap-6 text-sm font-bold">
          <a href="mailto:support@bibleslide.org" className="text-indigo-600 hover:underline">{t('about.supportEmail')}</a>
          <a href="https://www.paypal.com/paypalme/wankym" target="_blank" className="text-indigo-600 hover:underline">{t('about.makeDonation')}</a>
          <a href="https://bibleslide.org" target="_blank" className="text-indigo-600 hover:underline">{t('about.visitOfficial')}</a>
        </div>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          © 2026 BibSlide — {t('labels.copyright').split('—')[1]}
        </p>
      </div>
    </div>
  );
}
