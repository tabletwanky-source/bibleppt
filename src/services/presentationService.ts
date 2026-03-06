import { supabase } from '../supabaseClient';

export interface Slide {
  id: string;
  content: string;
  background?: {
    type: 'color' | 'gradient' | 'image' | 'video';
    value: string;
  };
  theme?: {
    fontFamily?: string;
    fontSize?: string;
    textColor?: string;
    textShadow?: boolean;
    overlayOpacity?: number;
  };
}

export interface Presentation {
  id: string;
  user_id: string;
  title: string;
  slides: Slide[];
  theme: string;
  created_at: string;
  updated_at: string;
  is_template: boolean;
}

export const presentationService = {
  async createPresentation(title: string, slides: Slide[], theme: string = 'classic'): Promise<Presentation | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('presentations')
      .insert({
        user_id: user.id,
        title,
        slides,
        theme
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating presentation:', error);
      return null;
    }

    return data;
  },

  async updatePresentation(id: string, updates: Partial<Presentation>): Promise<Presentation | null> {
    const { data, error } = await supabase
      .from('presentations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating presentation:', error);
      return null;
    }

    return data;
  },

  async getPresentation(id: string): Promise<Presentation | null> {
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching presentation:', error);
      return null;
    }

    return data;
  },

  async getUserPresentations(): Promise<Presentation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching presentations:', error);
      return [];
    }

    return data || [];
  },

  async duplicatePresentation(id: string): Promise<Presentation | null> {
    const original = await this.getPresentation(id);
    if (!original) return null;

    return this.createPresentation(
      `${original.title} (Copy)`,
      original.slides,
      original.theme
    );
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

  async getTemplates(): Promise<Presentation[]> {
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('is_template', true);

    if (error) {
      console.error('Error fetching templates:', error);
      return [];
    }

    return data || [];
  }
};

export const mediaService = {
  async uploadMedia(file: File): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('presentation-media')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading media:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('presentation-media')
      .getPublicUrl(fileName);

    const fileType = file.type.startsWith('image/') ? 'image' :
                     file.type.startsWith('video/') ? 'video' : 'audio';

    const { error: dbError } = await supabase
      .from('media_files')
      .insert({
        user_id: user.id,
        filename: file.name,
        storage_path: fileName,
        file_type: fileType,
        file_size: file.size
      });

    if (dbError) {
      console.error('Error saving media record:', dbError);
    }

    return publicUrl;
  },

  async getUserMedia(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching media:', error);
      return [];
    }

    return data || [];
  },

  async deleteMedia(id: string, storagePath: string): Promise<boolean> {
    const { error: storageError } = await supabase.storage
      .from('presentation-media')
      .remove([storagePath]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      return false;
    }

    const { error: dbError } = await supabase
      .from('media_files')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting media record:', dbError);
      return false;
    }

    return true;
  }
};

export const sessionService = {
  async createSession(presentationId: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('presentation_sessions')
      .insert({
        presentation_id: presentationId,
        user_id: user.id,
        current_slide_index: 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    return data;
  },

  async updateSessionSlide(sessionId: string, slideIndex: number): Promise<boolean> {
    const { error } = await supabase
      .from('presentation_sessions')
      .update({ current_slide_index: slideIndex })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session:', error);
      return false;
    }

    return true;
  },

  async endSession(sessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('presentation_sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error ending session:', error);
      return false;
    }

    return true;
  },

  async getActiveSession(presentationId: string): Promise<any> {
    const { data, error } = await supabase
      .from('presentation_sessions')
      .select('*')
      .eq('presentation_id', presentationId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    return data;
  },

  subscribeToSession(sessionId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'presentation_sessions',
          filter: `id=eq.${sessionId}`
        },
        callback
      )
      .subscribe();

    return channel;
  }
};
