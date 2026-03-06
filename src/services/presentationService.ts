import { supabase } from '../supabaseClient';

export interface Slide {
  id: string;
  type: 'verse' | 'lyrics' | 'custom' | 'title';
  content: string;
  reference?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  backgroundColor?: string;
  gradient?: string;
  customStyles?: Record<string, any>;
}

export interface Presentation {
  id: string;
  user_id: string;
  title: string;
  slides: Slide[];
  theme_id?: string;
  settings: {
    autoSplit?: boolean;
    transitionSpeed?: number;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface Theme {
  id: string;
  user_id?: string;
  name: string;
  is_system: boolean;
  font_family: string;
  font_size: number;
  text_color: string;
  background_color: string;
  background_gradient?: string;
  text_shadow: boolean;
  overlay_opacity: number;
  settings: Record<string, any>;
}

export const presentationService = {
  async createPresentation(title: string, slides: Slide[] = []): Promise<Presentation | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('presentations')
      .insert({
        user_id: user.id,
        title,
        slides,
        settings: {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating presentation:', error);
      return null;
    }

    return data;
  },

  async getPresentation(id: string): Promise<Presentation | null> {
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching presentation:', error);
      return null;
    }

    return data;
  },

  async getAllPresentations(): Promise<Presentation[]> {
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching presentations:', error);
      return [];
    }

    return data || [];
  },

  async updatePresentation(id: string, updates: Partial<Presentation>): Promise<boolean> {
    const { error } = await supabase
      .from('presentations')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating presentation:', error);
      return false;
    }

    return true;
  },

  async duplicatePresentation(id: string): Promise<Presentation | null> {
    const original = await this.getPresentation(id);
    if (!original) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('presentations')
      .insert({
        user_id: user.id,
        title: `${original.title} (Copy)`,
        slides: original.slides,
        theme_id: original.theme_id,
        settings: original.settings
      })
      .select()
      .single();

    if (error) {
      console.error('Error duplicating presentation:', error);
      return null;
    }

    return data;
  },

  async deletePresentation(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('presentations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting presentation:', error);
      return false;
    }

    return true;
  },

  async getAllThemes(): Promise<Theme[]> {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .order('is_system', { ascending: false });

    if (error) {
      console.error('Error fetching themes:', error);
      return [];
    }

    return data || [];
  },

  async createTheme(theme: Omit<Theme, 'id' | 'user_id' | 'is_system'>): Promise<Theme | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('themes')
      .insert({
        ...theme,
        user_id: user.id,
        is_system: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating theme:', error);
      return null;
    }

    return data;
  },

  async uploadMedia(file: File): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('presentation-media')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading media:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('presentation-media')
      .getPublicUrl(data.path);

    await supabase.from('media_files').insert({
      user_id: user.id,
      filename: file.name,
      storage_path: data.path,
      file_type: file.type.startsWith('image/') ? 'image' : 'video',
      file_size: file.size
    });

    return urlData.publicUrl;
  },

  async getUserMedia(): Promise<any[]> {
    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching media:', error);
      return [];
    }

    return data || [];
  },

  generateSlidesFromVerses(verses: any[]): Slide[] {
    return verses.map(verse => ({
      id: crypto.randomUUID(),
      type: 'verse',
      content: verse.text,
      reference: `${verse.book} ${verse.chapter}:${verse.verse}`
    }));
  },

  generateSlidesFromLyrics(lyrics: string, autoSplit: boolean = true): Slide[] {
    if (!autoSplit) {
      return [{
        id: crypto.randomUUID(),
        type: 'lyrics',
        content: lyrics.trim()
      }];
    }

    const paragraphs = lyrics.split(/\n\s*\n/).filter(p => p.trim());

    return paragraphs.map(paragraph => ({
      id: crypto.randomUUID(),
      type: 'lyrics',
      content: paragraph.trim()
    }));
  }
};
