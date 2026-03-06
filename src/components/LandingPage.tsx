import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Presentation, 
  Moon, 
  Sun, 
  LogIn, 
  LogOut,
  ArrowRight,
  HeartHandshake,
  Layout,
  Check,
  Smartphone,
  Monitor,
  Download,
  Palette,
  Star,
  Quote,
  ChevronRight,
  ExternalLink,
  Play,
  Music,
  Clock,
  Cloud,
  Shield,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';
import ContactForm from './ContactForm';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import VerseOfDayWidget from './VerseOfDayWidget';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  onShowAbout: () => void;
  onShowTerms: () => void;
  onShowPrivacy: () => void;
  onShowDonation: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  user: any;
}

export default function LandingPage({ 
  onStart, 
  onLogin, 
  onShowAbout, 
  onShowTerms,
  onShowPrivacy,
  onShowDonation,
  darkMode, 
  setDarkMode, 
  user 
}: LandingPageProps) {
  const { t, lang } = useLanguage();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const features = [
    { icon: Search, title: t('features.bible.title'), desc: t('features.bible.desc') },
    { icon: Music, title: t('features.songs.title'), desc: t('features.songs.desc') },
    { icon: Palette, title: t('features.templates.title'), desc: t('features.templates.desc') },
    { icon: Smartphone, title: t('features.remote.title'), desc: t('features.remote.desc') },
    { icon: Clock, title: t('features.timer.title'), desc: t('features.timer.desc') },
    { icon: Cloud, title: t('features.cloud.title'), desc: t('features.cloud.desc') }
  ];

  const missionText = t('mission.text');
  const comparison = t('comparison');

  return (
    <div className={`min-h-screen font-poppins transition-colors duration-500 ${darkMode ? 'dark bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b transition-all ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-[#1E3A8A] border-blue-900'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="https://i.postimg.cc/X7j5bZCj/biblslide.png" alt="Logo" className="w-10 h-10 object-contain" />
            <h1 className={`text-2xl font-montserrat font-black tracking-tighter ${darkMode ? 'text-blue-500' : 'text-white'}`}>BibSlide</h1>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-2xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-blue-800/50 border-blue-700 text-white hover:bg-blue-700'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={onStart}
                  className={`hidden md:flex items-center gap-2 font-bold hover:underline ${darkMode ? 'text-blue-400' : 'text-white'}`}
                >
                  <Layout className="w-4 h-4" /> {t('nav.dashboard')}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-400 font-bold hover:underline"
                >
                  <LogOut className="w-4 h-4" /> {t('buttons.logout')}
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 bg-[#F4B400] text-[#1E3A8A] px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-yellow-500/20 hover:bg-yellow-500 transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" /> {t('buttons.login')}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`relative pt-40 pb-24 px-6 overflow-hidden ${darkMode ? 'bg-slate-900' : 'bg-[#1E3A8A]'} text-white`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="text-5xl md:text-7xl font-montserrat font-black tracking-tight leading-[1.1]">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-blue-100 max-w-lg leading-relaxed italic">
              {t('hero.subtitle')}
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={onStart}
                className="bg-[#F4B400] text-[#1E3A8A] px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-yellow-500/20 hover:bg-yellow-500 transition-all active:scale-95 flex items-center gap-2"
              >
                {t('hero.cta')} <ArrowRight className="w-5 h-5" />
              </button>
              <a 
                href="#tutorial"
                className="px-8 py-4 rounded-2xl font-bold text-lg border border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                {t('hero.watchTutorial')}
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <img 
              src="https://i.postimg.cc/FKXsTgLq/1.png" 
              alt="BibSlide Hero" 
              className="w-full rounded-[2.5rem] shadow-2xl border-4 border-white/20"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* Verse of the Day Section */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        <VerseOfDayWidget />
      </section>

      {/* Mission Section */}
      <section className="py-32 px-6 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <img 
              src="https://i.postimg.cc/k5PXTFbj/2.png" 
              alt="Mission" 
              className="w-full rounded-[2.5rem] shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8 order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-[#1E3A8A] font-bold text-sm uppercase tracking-wider border border-blue-100">
              <Shield className="w-4 h-4 text-[#F4B400]" /> Our Mission
            </div>
            <h2 className="text-4xl md:text-5xl font-montserrat font-black tracking-tight leading-tight text-[#1E3A8A] dark:text-blue-400">
              {t('mission.title')}
            </h2>
            <div className="space-y-6 text-xl text-[#555] dark:text-slate-400 leading-relaxed">
              <p>{missionText}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Remote Control Feature Showcase */}
      <section className={`py-32 px-6 overflow-hidden transition-colors ${darkMode ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm uppercase tracking-wider border border-indigo-100">
                  <Globe className="w-4 h-4" /> New Feature
                </div>
                <h2 className="text-5xl md:text-6xl font-montserrat font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white">
                  Control Your Slides <br />
                  <span className="text-indigo-600">From Anywhere.</span>
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                  Turn any phone or tablet into a powerful remote control. No apps to install, no internet required. Just scan the QR code and take command of your presentation.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg dark:text-white">Mobile Remote</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Large touch-friendly buttons for seamless navigation during your sermon.</p>
                </div>
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg dark:text-white">Stage Monitor</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Real-time viewer mode for musicians and worship teams on stage.</p>
                </div>
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg dark:text-white">Local Network</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Works on your church Wi-Fi. Fast, secure, and reliable synchronization.</p>
                </div>
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg dark:text-white">Zero Config</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Auto IP detection and QR code generation. Start in seconds.</p>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={onStart}
                  className="bg-slate-900 dark:bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-3"
                >
                  Try Remote Now <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[3rem] blur-2xl opacity-20 animate-pulse" />
              <div className="relative bg-white dark:bg-slate-800 p-4 rounded-[3rem] shadow-2xl border-8 border-slate-100 dark:border-slate-700">
                <img 
                  src="https://i.postimg.cc/W4cb56kW/3.png" 
                  alt="Remote Control Interface" 
                  className="w-full rounded-[2rem]"
                  referrerPolicy="no-referrer"
                />
                {/* Floating UI Element */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-12 top-1/4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 hidden md:block"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Remote Active</div>
                      <div className="font-black text-slate-900 dark:text-white">iPhone 15 Pro</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-2 w-12 bg-indigo-600 rounded-full" />
                    <div className="h-2 w-4 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="h-2 w-4 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-32 px-6 transition-colors ${darkMode ? 'bg-slate-800/50' : 'bg-[#F9FAFB]'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-4xl md:text-5xl font-montserrat font-black tracking-tight text-[#1E3A8A] dark:text-blue-400">
                {t('features.title')}
              </h2>
              <p className="text-xl font-bold text-[#F4B400]">
                {t('features.subtitle')}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <img 
                src="https://i.postimg.cc/W4cb56kW/3.png" 
                alt="Features" 
                className="w-full rounded-[2.5rem] shadow-xl border-4 border-white dark:border-slate-700"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className={`p-10 rounded-[2.5rem] border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}
              >
                <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <feat.icon className="w-8 h-8 text-[#1E3A8A] dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-montserrat font-bold mb-3 text-[#1E3A8A] dark:text-blue-400">{feat.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                <button className="mt-6 text-sm font-bold text-[#1E3A8A] dark:text-blue-400 flex items-center gap-2 hover:text-[#F4B400] transition-colors">
                  Learn More <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className={`py-32 px-6 transition-colors ${darkMode ? 'bg-slate-900' : 'bg-[#F9FAFB]'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-montserrat font-black tracking-tight text-[#1E3A8A] dark:text-blue-400">
              {comparison.title}
            </h2>
            <p className="text-xl text-[#555] dark:text-slate-400 max-w-3xl mx-auto">
              {comparison.subtitle}
            </p>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse bg-white dark:bg-slate-900">
              <thead className="bg-[#1E3A8A] text-white">
                <tr>
                  {comparison.headers.map((header: string, i: number) => (
                    <th key={i} className="p-6 font-montserrat font-bold uppercase tracking-wider text-sm">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {comparison.rows.map((row: string[], i: number) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {row.map((cell: string, j: number) => (
                      <td key={j} className={`p-6 text-sm ${j === 1 ? 'font-bold text-[#F4B400]' : 'text-slate-600 dark:text-slate-400'}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-6">
            {comparison.rows.map((row: string[], i: number) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-[#1E3A8A] dark:text-blue-400 border-b pb-2">{row[0]}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {comparison.headers.slice(1).map((header: string, j: number) => (
                    <div key={j} className="space-y-1">
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">{header}</p>
                      <p className={j === 0 ? 'font-bold text-[#F4B400]' : 'text-slate-600 dark:text-slate-400'}>{row[j+1]}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tutorial Section */}
      <section id="tutorial" className={`py-32 px-6 ${darkMode ? 'bg-slate-800' : 'bg-[#1E3A8A]'} text-white`}>
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-montserrat font-black tracking-tight">
              {t('tutorial.title')}
            </h2>
            <p className="text-xl text-blue-100">
              {t('tutorial.subtitle')}
            </p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-8 border-[#F4B400]"
          >
            <iframe 
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/gd5XIJXmzRM" 
              title="BibSlide Tutorial" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-6xl mx-auto bg-[#F4B400] rounded-[3.5rem] p-12 md:p-24 text-[#1E3A8A] shadow-2xl shadow-yellow-500/20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white rounded-full blur-3xl" />
             <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-400 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 space-y-12">
            <h2 className="text-4xl md:text-6xl font-montserrat font-black tracking-tight leading-tight">
              {t('ctaSection.title')}
            </h2>
            <p className="text-2xl font-bold opacity-80">
              {t('ctaSection.subtext')}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <button 
                onClick={onStart}
                className="bg-[#1E3A8A] text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl hover:bg-blue-900 transition-all active:scale-95 flex items-center gap-3"
              >
                {t('ctaSection.button1')} <ChevronRight className="w-6 h-6" />
              </button>
              <button 
                onClick={onShowDonation}
                className="bg-white/20 text-[#1E3A8A] border border-[#1E3A8A]/30 backdrop-blur-md px-10 py-5 rounded-2xl font-bold text-xl hover:bg-white/30 transition-all active:scale-95"
              >
                {t('ctaSection.button2')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactForm darkMode={darkMode} />

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-600 bg-gray-100 border-t">
        © 2026 BibSlide — Tool for Churches. Powered by Wanky Massenat.  
        <a href="mailto:support@bibleslide.org" className="text-[#1E3A8A] hover:text-[#F4B400] ml-1">support@bibleslide.org</a>
      </footer>
    </div>
  );
}


