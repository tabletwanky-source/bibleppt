import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../i18n/LanguageContext";
import {
  User,
  FileText,
  Settings,
  LogOut,
  PlusCircle,
  Paintbrush,
  HeartHandshake,
  ChevronRight,
  Layout,
  Clock,
  Mail,
  Shield,
  Bell,
  Filter,
  ArrowUpDown,
  BookOpen,
  Search,
  Sparkles,
  Presentation,
  FileUp,
  Download,
  Trash2,
  Star,
  Loader2,
  Play,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Legend
} from 'recharts';

import { logUserActivity } from "../services/activityService";
import VerseOfDayWidget from "./VerseOfDayWidget";
import GoogleSearchWidget from "./GoogleSearchWidget";

interface DashboardProps {
  user: any;
  onLogout: () => void;
  onCreateNew: () => void;
  darkMode: boolean;
}

export default function Dashboard({ user, onLogout, onCreateNew, darkMode }: DashboardProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'presentations' | 'templates' | 'settings'>('overview');
  const [presentations, setPresentations] = useState<any[]>([
    { id: 1, title: "Sermon: Lafwa nan Aksyon", date: "2026-02-22", type: "PDF" },
    { id: 2, title: "Sòm 23 Adorasyon", date: "2026-02-18", type: "PPTX" },
  ]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [filterType, setFilterType] = useState<'All' | 'PPTX' | 'PDF'>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [fouyeSearch, setFouyeSearch] = useState('');
  const [cesperanceSearch, setCesperanceSearch] = useState('');
  
  const [stats, setStats] = useState({
    slides: 0,
    templates: 0,
    songs: 0,
    activeDays: 0
  });
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('monthly');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    if (user) logUserActivity(user.id);
  }, [user]);

  const processAnalytics = (slides: any[], songs: any[], templates: any[], range: 'weekly' | 'monthly') => {
    const dataMap: Record<string, any> = {};

    const addToData = (items: any[], key: string) => {
      items.forEach(item => {
        const date = new Date(item.created_at);
        let label = '';
        if (range === 'monthly') {
          label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        } else {
          const week = Math.ceil(date.getDate() / 7);
          label = `W${week} ${date.toLocaleString('default', { month: 'short' })}`;
        }
        
        if (!dataMap[label]) {
          dataMap[label] = { name: label, slides: 0, songs: 0, templates: 0, timestamp: date.getTime() };
        }
        dataMap[label][key]++;
        // Update timestamp to the latest one for sorting
        if (date.getTime() < dataMap[label].timestamp) {
           dataMap[label].timestamp = date.getTime();
        }
      });
    };

    addToData(slides, 'slides');
    addToData(songs, 'songs');
    addToData(templates, 'templates');

    return Object.values(dataMap).sort((a, b) => a.timestamp - b.timestamp);
  };

  useEffect(() => {
    const handleFetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Dynamic Counts
        const [slidesCount, pptxTemplatesCount, prefTemplatesCount, songsCount, logsData] = await Promise.all([
          supabase.from('slides').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('templates').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('user_preferences').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('songs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('activity_logs').select('date').eq('user_id', user.id)
        ]);

        const activeDays = logsData.data ? new Set(logsData.data.map((l: any) => l.date)).size : 0;

        setStats({
          slides: slidesCount.count || 0,
          templates: (pptxTemplatesCount.count || 0) + (prefTemplatesCount.count || 0),
          songs: songsCount.count || 0,
          activeDays
        });

        // 2. Fetch data for charts
        const [slidesData, songsData, pptxTemplatesData, prefTemplatesData] = await Promise.all([
          supabase.from('slides').select('created_at').eq('user_id', user.id),
          supabase.from('songs').select('created_at').eq('user_id', user.id),
          supabase.from('templates').select('created_at').eq('user_id', user.id),
          supabase.from('user_preferences').select('created_at').eq('user_id', user.id)
        ]);

        const analytics = processAnalytics(
          slidesData.data || [], 
          songsData.data || [], 
          [...(pptxTemplatesData.data || []), ...(prefTemplatesData.data || [])], 
          timeRange
        );
        setAnalyticsData(analytics);

        // 3. Fetch saved styles (preferences)
        const { data: prefData, error: prefError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id);
        
        if (prefData && !prefError) {
          setTemplates(prefData.map((p: any) => ({
            id: p.id,
            name: t('labels.savedTemplate'),
            font: p.preferences.font,
            bg: p.preferences.bgColor,
            updated_at: p.updated_at,
            preferences: p.preferences
          })));
        }

        // 4. Fetch custom PPTX templates
        const { data: customData, error: customError } = await supabase
          .from('templates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (customData && !customError) {
          setCustomTemplates(customData);
        }

        // 5. Fetch presentations from 'slides' table
        const { data: slidesDataList, error: slidesError } = await supabase
          .from('slides')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (slidesDataList && !slidesError) {
          setPresentations(slidesDataList.map((s: any) => ({
            id: s.id,
            title: s.title,
            date: new Date(s.created_at).toISOString().slice(0, 10),
            type: s.type || 'PPTX'
          })));
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) handleFetchDashboardData();
  }, [user, t, timeRange, refreshTrigger]);

  useEffect(() => {
    if (!user) return;

    const channels = [
      supabase.channel('slides-changes').on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'slides', 
        filter: `user_id=eq.${user.id}` 
      }, refresh).subscribe(),
      supabase.channel('songs-changes').on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'songs', 
        filter: `user_id=eq.${user.id}` 
      }, refresh).subscribe(),
      supabase.channel('templates-changes').on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'templates', 
        filter: `user_id=eq.${user.id}` 
      }, refresh).subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user]);

  const handleDeletePresentation = async (id: number) => {
    if (confirm("Are you sure you want to delete this presentation?")) {
      try {
        const { error } = await supabase
          .from('slides')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setPresentations(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error("Error deleting presentation:", err);
        alert("Failed to delete presentation.");
      }
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm(t('dashboard.myTemplatesSection.deleteConfirm'))) {
      try {
        const { error } = await supabase
          .from('user_preferences')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setTemplates(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        console.error("Error deleting template:", err);
        alert("Failed to delete template.");
      }
    }
  };

  const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pptx')) {
      alert("Please upload a .pptx file.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert("File size must be under 25MB.");
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const filePath = `${user.id}/${timestamp}_${file.name}`;

      // 1. Upload to Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('user-templates')
        .upload(filePath, file);

      if (storageError) throw storageError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-templates')
        .getPublicUrl(filePath);

      // 3. Save to Database
      const { data: dbData, error: dbError } = await supabase
        .from('templates')
        .insert({
          user_id: user.id,
          name: file.name,
          url: publicUrl,
          size: file.size
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setCustomTemplates(prev => [dbData, ...prev]);
      alert(t('dashboard.myTemplatesSection.success'));
    } catch (err: any) {
      console.error("Error uploading template:", err);
      if (err.message?.includes('row-level security')) {
        alert("Permission denied: Please ensure Row Level Security (RLS) is enabled and correctly configured for the 'templates' table in your Supabase dashboard.");
      } else {
        alert(t('dashboard.myTemplatesSection.error'));
      }
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDeleteCustomTemplate = async (template: any) => {
    if (confirm(t('dashboard.myTemplatesSection.deleteConfirm'))) {
      try {
        // 1. Delete from Storage
        const filePath = template.url.split('/').pop();
        if (filePath) {
          await supabase.storage
            .from('user-templates')
            .remove([`${user.id}/${filePath}`]);
        }

        // 2. Delete from Database
        const { error } = await supabase
          .from('templates')
          .delete()
          .eq('id', template.id);

        if (error) throw error;

        setCustomTemplates(prev => prev.filter(t => t.id !== template.id));
      } catch (err) {
        console.error("Error deleting custom template:", err);
        alert("Failed to delete template.");
      }
    }
  };

  const handleSetDefaultTemplate = async (id: number) => {
    // This would ideally update a 'is_default' column in the templates table
    // For now, we'll just simulate it or update the local state if the column exists
    alert("Set as default feature coming soon!");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const mockEvent = { target: { files: [file], value: "" } } as any;
      handleUploadTemplate(mockEvent);
    }
  };

  const handleOpenPresentation = (p: any) => {
    alert(`Opening "${p.title}"... (This feature is coming soon)`);
  };

  const handlePresent = (p: any) => {
    // For now, we'll just alert that we are starting the presentation
    // In a real app, we'd load the slides for this presentation
    alert(`Starting live presentation for "${p.title}"...`);
    onCreateNew(); // Go to generator where they can present
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <section className={`p-8 h-full rounded-3xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">{t('dashboard.welcome')}, {user?.email?.split('@')[0]} 👋</h2>
                      <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {t('dashboard.subtitle')}
                      </p>
                    </div>
                    <button 
                      onClick={onCreateNew}
                      className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                    >
                      <PlusCircle className="w-5 h-5" />
                      {t('dashboard.createNew')}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    {[
                      { label: t('dashboard.stats.slides'), value: stats.slides.toString(), icon: FileText, color: 'text-blue-500' },
                      { label: t('dashboard.stats.templates'), value: stats.templates.toString(), icon: Paintbrush, color: 'text-purple-500' },
                      { label: t('dashboard.stats.songs'), value: stats.songs.toString(), icon: HeartHandshake, color: 'text-pink-500' },
                      { label: t('dashboard.stats.activeDays'), value: stats.activeDays.toString(), icon: Clock, color: 'text-emerald-500' },
                    ].map((stat, i) => (
                      <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`p-8 rounded-3xl border transition-all mt-8 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-indigo-600" /> {t('dashboard.analytics.title') || 'Activity Analytics'}
                    </h3>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                      <button 
                        onClick={() => setTimeRange('weekly')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${timeRange === 'weekly' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                      >
                        Weekly
                      </button>
                      <button 
                        onClick={() => setTimeRange('monthly')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${timeRange === 'monthly' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <h4 className="text-xs font-bold mb-4 flex items-center gap-2 text-slate-500 uppercase tracking-wider">
                        <FileText className="w-4 h-4 text-blue-500" /> Slides Created
                      </h4>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <AreaChart data={analyticsData}>
                            <defs>
                              <linearGradient id="colorSlides" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '12px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                                color: darkMode ? '#f1f5f9' : '#1e293b'
                              }}
                            />
                            <Area type="monotone" dataKey="slides" stroke="#1E3A8A" fillOpacity={1} fill="url(#colorSlides)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <h4 className="text-xs font-bold mb-4 flex items-center gap-2 text-slate-500 uppercase tracking-wider">
                        <HeartHandshake className="w-4 h-4 text-yellow-500" /> Songs Added
                      </h4>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <BarChart data={analyticsData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '12px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                                color: darkMode ? '#f1f5f9' : '#1e293b'
                              }}
                            />
                            <Bar dataKey="songs" fill="#F4B400" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <h4 className="text-xs font-bold mb-4 flex items-center gap-2 text-slate-500 uppercase tracking-wider">
                        <Paintbrush className="w-4 h-4 text-indigo-500" /> Templates Saved
                      </h4>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <AreaChart data={analyticsData}>
                            <defs>
                              <linearGradient id="colorTemplates" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '12px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                                color: darkMode ? '#f1f5f9' : '#1e293b'
                              }}
                            />
                            <Area type="monotone" dataKey="templates" stroke="#4f46e5" fillOpacity={1} fill="url(#colorTemplates)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
              <div className="lg:col-span-1 space-y-8">
                <VerseOfDayWidget />
                <GoogleSearchWidget />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> {t('dashboard.recentPresentations')}
                </h3>
                <div className="space-y-3">
                  {presentations.slice(0, 3).map(p => (
                    <div key={`overview-pres-${p.id}`} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                      <span className="font-medium text-sm">{p.title}</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md font-bold">{p.type}</span>
                    </div>
                  ))}
                  <button onClick={() => setActiveTab('presentations')} className="w-full text-center text-xs font-bold text-indigo-600 mt-2 hover:underline">{t('buttons.viewAll')}</button>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Paintbrush className="w-5 h-5 text-indigo-600" /> {t('dashboard.savedTemplates')}
                </h3>
                <div className="space-y-3">
                  {templates.length > 0 ? templates.slice(0, 3).map(t => (
                    <div key={`overview-temp-${t.id}`} className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                      <div className="w-8 h-8 rounded-lg border border-white" style={{ backgroundColor: t.bg }}></div>
                      <span className="font-medium text-sm">{t.font}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-500 text-center py-4">{t('messages.noTemplates')}</p>
                  )}
                  <button onClick={() => setActiveTab('templates')} className="w-full text-center text-xs font-bold text-indigo-600 mt-2 hover:underline">{t('buttons.manageTemplates')}</button>
                </div>
              </div>
            </div>

            <section className={`p-6 rounded-3xl border transition-all mt-8 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-indigo-600" /> {t('dashboard.externalResources')}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {t('dashboard.externalResourcesSubtitle')}
                  </p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* FouyeBible */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                      📖 FouyeBible – Bib Kreyòl Ayisyen
                    </h4>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (fouyeSearch.trim()) window.open(`https://www.fouyebible.com/bible/search?q=${encodeURIComponent(fouyeSearch)}`, '_blank');
                      }}
                      className="relative flex-1 max-w-xs"
                    >
                      <input 
                        type="text"
                        value={fouyeSearch}
                        onChange={(e) => setFouyeSearch(e.target.value)}
                        placeholder={t('labels.searchBible')}
                        className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-all ${darkMode ? 'bg-slate-900 border-slate-700 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    </form>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md bg-white">
                    <iframe
                      src="https://www.fouyebible.com/"
                      width="100%"
                      height="600"
                      className="border-0"
                      allowFullScreen
                      title="FouyeBible"
                    ></iframe>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">{t('labels.source')}: FouyeBible.com</p>
                </div>

                {/* CEspérance */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                      🎵 CEspérance – Chant d’Espérance
                    </h4>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (cesperanceSearch.trim()) window.open(`https://cesperance.com/?s=${encodeURIComponent(cesperanceSearch)}`, '_blank');
                      }}
                      className="relative flex-1 max-w-xs"
                    >
                      <input 
                        type="text"
                        value={cesperanceSearch}
                        onChange={(e) => setCesperanceSearch(e.target.value)}
                        placeholder={t('labels.searchSong')}
                        className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-all ${darkMode ? 'bg-slate-900 border-slate-700 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    </form>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md bg-white">
                    <iframe
                      src="https://cesperance.com/"
                      width="100%"
                      height="600"
                      className="border-0"
                      allowFullScreen
                      title="CEspérance"
                    ></iframe>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">{t('labels.source')}: cesperance.com</p>
                </div>
              </div>
            </section>
          </div>
        );
      case 'presentations':
        const filteredPresentations = presentations
          .filter(p => filterType === 'All' || p.type === filterType)
          .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });

        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-7 h-7 text-indigo-600" /> {t('dashboard.myPresentations')}
              </h2>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="All">{t('labels.allTypes')}</option>
                    <option value="PPTX">PPTX</option>
                    <option value="PDF">PDF</option>
                  </select>
                </div>

                <button 
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <ArrowUpDown className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold">{sortOrder === 'desc' ? t('labels.mostRecent') : t('labels.oldest')}</span>
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPresentations.map((p) => (
                <div
                  key={p.id}
                  className={`group p-6 rounded-3xl border transition-all cursor-pointer ${
                    darkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm mb-4 ${p.type === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {p.type}
                  </div>
                  <h4 className="font-bold text-lg mb-1">{p.title}</h4>
                  <p className="text-xs text-slate-500 mb-4">📅 {p.date}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button 
                      onClick={() => handleOpenPresentation(p)}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      {t('buttons.open')}
                    </button>
                    <button 
                      onClick={() => handlePresent(p)}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
                    >
                      <Play size={12} />
                      {t('presentation.start')}
                    </button>
                    <button 
                      onClick={() => handleDeletePresentation(p.id)}
                      className="text-xs font-bold text-slate-400 hover:text-red-500"
                    >
                      {t('buttons.delete')}
                    </button>
                  </div>
                </div>
              ))}
              <button 
                onClick={onCreateNew}
                className={`p-6 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                  darkMode ? 'border-slate-700 hover:border-indigo-500 text-slate-500 hover:text-indigo-400' : 'border-slate-200 hover:border-indigo-300 text-slate-400 hover:text-indigo-500'
                }`}
              >
                <PlusCircle className="w-8 h-8" />
                <span className="font-bold">{t('dashboard.newPresentation')}</span>
              </button>
            </div>
          </div>
        );
      case 'templates':
        return (
          <div 
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div className="fixed inset-0 z-50 bg-indigo-600/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-indigo-600 m-4 rounded-[3rem] pointer-events-none animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl text-center">
                  <FileUp className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-bounce" />
                  <p className="text-xl font-bold text-slate-900 dark:text-white">Drop to upload template</p>
                </div>
              </div>
            )}
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Paintbrush className="w-7 h-7 text-indigo-600" /> {t('dashboard.myTemplatesSection.title')}
                </h2>
                
                <div className="relative">
                  <input 
                    type="file" 
                    id="template-upload" 
                    accept=".pptx" 
                    onChange={handleUploadTemplate}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor="template-upload"
                    className={`flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all cursor-pointer active:scale-95 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                    {uploading ? t('dashboard.myTemplatesSection.uploading') : t('dashboard.myTemplatesSection.uploadBtn')}
                  </label>
                </div>
              </div>

              {customTemplates.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customTemplates.map((ct) => (
                    <div
                      key={ct.id}
                      className={`group p-6 rounded-3xl border transition-all ${
                        darkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-200'
                      }`}
                    >
                      <div className="aspect-video rounded-2xl bg-slate-100 dark:bg-slate-900 mb-4 flex items-center justify-center relative overflow-hidden">
                        <Presentation className="w-12 h-12 text-slate-300" />
                        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors" />
                      </div>
                      <h4 className="font-bold text-sm mb-1 truncate" title={ct.name}>{ct.name}</h4>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">
                        <span>{t('dashboard.myTemplatesSection.size')}: {(ct.size / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>•</span>
                        <span>{new Date(ct.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <a 
                            href={ct.url} 
                            download={ct.name}
                            className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg text-indigo-600 transition-colors"
                            title={t('buttons.download')}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button 
                            onClick={() => handleSetDefaultTemplate(ct.id)}
                            className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg text-slate-400 hover:text-yellow-500 transition-colors"
                            title={t('dashboard.myTemplatesSection.setDefault')}
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        </div>
                        <button 
                          onClick={() => handleDeleteCustomTemplate(ct)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          title={t('buttons.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`p-12 rounded-[2.5rem] border-2 border-dashed text-center ${darkMode ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
                  <Paintbrush className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">{t('dashboard.myTemplatesSection.noTemplates')}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600" /> {t('dashboard.savedTemplates')}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((t_item) => (
                  <div
                    key={t_item.id}
                    className={`p-6 rounded-3xl border transition-all ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div
                      className="aspect-video rounded-2xl border-4 border-white shadow-md mb-4 flex items-center justify-center"
                      style={{ backgroundColor: t_item.bg }}
                    >
                      <span className="text-white font-bold text-lg" style={{ fontFamily: t_item.font }}>Abc</span>
                    </div>
                    <h4 className="font-bold mb-1">{t_item.name}</h4>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-4">{t_item.font}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                      <button 
                        onClick={() => alert("Style applied! Go to Generator to see it.")}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        {t('buttons.use')}
                      </button>
                      <button 
                        onClick={() => handleDeleteTemplate(t_item.id)}
                        className="text-xs font-bold text-slate-400 hover:text-red-500"
                      >
                        {t('buttons.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Settings className="w-7 h-7 text-indigo-600" /> {t('dashboard.accountSettings')}
            </h2>
            
            <div className="space-y-6">
              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="font-bold mb-4 flex items-center gap-2"><User className="w-4 h-4" /> {t('labels.profile')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('contact.email')}</label>
                    <div className={`px-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('labels.username')}</label>
                    <input 
                      type="text" 
                      defaultValue={user?.email?.split('@')[0]}
                      className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>
                  <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">{t('buttons.saveChanges')}</button>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Templates</label>
                      <div className="text-lg font-bold">{customTemplates.length}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Last Upload</label>
                      <div className="text-lg font-bold">
                        {customTemplates.length > 0 
                          ? new Date(customTemplates[0].created_at).toLocaleDateString() 
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="font-bold mb-4 flex items-center gap-2"><Shield className="w-4 h-4" /> {t('labels.security')}</h3>
                <button className="text-sm font-bold text-indigo-600 hover:underline">{t('buttons.changePassword')}</button>
              </div>

              <div className={`p-6 rounded-3xl border border-red-100 bg-red-50/30`}>
                <h3 className="font-bold mb-2 text-red-600 flex items-center gap-2"><LogOut className="w-4 h-4" /> {t('buttons.logout')}</h3>
                <p className="text-xs text-slate-500 mb-4">{t('messages.logoutSubtitle')}</p>
                <button onClick={onLogout} className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-red-600 transition-all">{t('buttons.logoutNow')}</button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar Navigation */}
      <div className="flex">
        <aside className={`hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="p-8">
            <div className="flex items-center gap-2 mb-12">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                <Layout className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter">BibSlide</h1>
            </div>

            <nav className="space-y-2">
              {[
                { id: 'overview', label: t('nav.overview'), icon: Layout },
                { id: 'presentations', label: t('nav.presentations'), icon: FileText },
                { id: 'templates', label: t('nav.templates'), icon: Paintbrush },
                { id: 'settings', label: t('nav.settings'), icon: Settings },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-8">
            <section className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200'}`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 mb-2 ${darkMode ? 'text-indigo-300' : 'text-white'}`}>
                <HeartHandshake className="w-4 h-4" /> {t('nav.donation')}
              </h3>
              <p className={`text-[10px] mb-4 ${darkMode ? 'text-indigo-200/70' : 'text-indigo-50'}`}>
                {t('donation.sidebarSubtitle')}
              </p>
              <a
                href="https://www.paypal.com/paypalme/wankym"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center py-2 rounded-xl font-bold text-[10px] transition-all active:scale-95 ${
                  darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-white text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {t('buttons.donate')}
              </a>
            </section>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1">
          <header className={`sticky top-0 z-10 backdrop-blur-md border-b transition-colors lg:hidden ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
            <div className="px-4 h-16 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Layout className="w-6 h-6 text-indigo-600" />
                <h1 className="text-xl font-black tracking-tighter">BibSlide</h1>
              </div>
              <button onClick={onLogout} className="text-red-500 p-2"><LogOut className="w-5 h-5" /></button>
            </div>
          </header>

          <div className="p-4 sm:p-8 lg:p-12">
            {loading ? (
              <div className="flex items-center justify-center h-[60vh]">
                <Clock className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
