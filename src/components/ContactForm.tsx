import React, { useState } from 'react';
import { Mail, Send, Star, CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

interface ContactFormProps {
  darkMode: boolean;
}

export default function ContactForm({ darkMode }: ContactFormProps) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.append("rating", rating.toString());

    try {
      const fetchResponse = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      if (fetchResponse.ok) {
        setIsSuccess(true);
        setIsSubmitting(false);
        setRating(0);
        (e.target as HTMLFormElement).reset();
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`rounded-[2.5rem] shadow-xl p-8 md:p-12 max-w-3xl mx-auto my-16 border transition-all relative overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className="bg-emerald-100 dark:bg-emerald-900/30 p-6 rounded-full mb-6"
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-600" />
            </motion.div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{t('contact.thanks')}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">
              Your message has been sent successfully. We'll get back to you soon!
            </p>
            <button 
              onClick={() => setIsSuccess(false)}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95"
            >
              Send another message
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mb-10 space-y-4">
        <div className="bg-indigo-600/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-3xl font-black tracking-tight text-indigo-600">
          {t('contact.title')}
        </h3>
        <p className={`text-sm max-w-md mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('contact.subtitle')}
        </p>
        <div className="pt-4">
          <a 
            href="mailto:support@bibleslide.org" 
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200"
          >
            <Mail className="w-4 h-4" /> Contact Support via Email
          </a>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="space-y-6"
      >
        <input
          type="hidden"
          name="access_key"
          value="68d621a3-6e94-40d6-be64-995498b062fe"
        />
        <input type="hidden" name="subject" value="New BibSlide Feedback" />
        <input type="checkbox" name="botcheck" className="hidden" />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('contact.name')}</label>
            <input
              type="text"
              name="name"
              required
              className={`w-full border rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('contact.email')}</label>
            <input
              type="email"
              name="email"
              required
              className={`w-full border rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('contact.type')}</label>
          <select 
            name="message_type"
            className={`w-full border rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
          >
            <option value="suggestion">{t('contact.types.suggestion')}</option>
            <option value="question">{t('contact.types.question')}</option>
            <option value="bug">{t('contact.types.bug')}</option>
            <option value="partnership">{t('contact.types.partnership')}</option>
            <option value="other">{t('contact.types.other')}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('contact.q1')}</label>
          <textarea
            name="what_liked"
            rows={2}
            className={`w-full border rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
          ></textarea>
          <p className="text-[10px] text-slate-400 italic ml-1">{t('contact.q1_sug')}</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('contact.q2')}</label>
          <textarea
            name="improvement_suggestions"
            rows={2}
            className={`w-full border rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
          ></textarea>
          <p className="text-[10px] text-slate-400 italic ml-1">{t('contact.q2_sug')}</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('contact.q3')}</label>
          <div className="flex gap-6 ml-1">
            {[t('contact.yes'), t('contact.no'), t('contact.maybe')].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                <input type="radio" name="recommend" value={opt} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                <span className="text-sm font-medium group-hover:text-indigo-600 transition-colors">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('contact.rating')}</label>
          <div className="flex gap-2 ml-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform active:scale-90"
              >
                <Star 
                  className={`w-8 h-8 ${
                    (hoverRating || rating) >= star 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-slate-300'
                  } transition-colors`} 
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('contact.message')}</label>
          <textarea
            name="message"
            required
            rows={4}
            className={`w-full border rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
          ></textarea>
        </div>

        <div className="space-y-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {isSubmitting ? 'Sending...' : t('contact.send')}
          </button>
        </div>
      </form>

      <p className="text-[10px] text-center text-slate-400 mt-8 uppercase tracking-widest font-bold">
        {t('contact.thanks')}
      </p>
    </section>
  );
}
