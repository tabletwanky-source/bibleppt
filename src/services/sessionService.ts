import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PresentationSession {
  id: string;
  presentation_id: string;
  user_id: string;
  current_slide_index: number;
  is_active: boolean;
  started_at: string;
  ended_at?: string;
  viewer_count: number;
}

export const sessionService = {
  generateSessionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  async createSession(presentationId: string): Promise<{ session: PresentationSession; code: string } | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const sessionCode = this.generateSessionCode();

    const { data: sessionData, error: sessionError } = await supabase
      .from('presentation_sessions')
      .insert({
        presentation_id: presentationId,
        user_id: user.id,
        current_slide_index: 0,
        is_active: true
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return null;
    }

    const { error: remoteSessionError } = await supabase
      .from('sessions')
      .insert({
        id: sessionData.id,
        session_code: sessionCode,
        user_id: user.id,
        current_slide: 0,
        is_active: true
      });

    if (remoteSessionError) {
      console.error('Error creating remote session:', remoteSessionError);
      return null;
    }

    return { session: sessionData, code: sessionCode };
  },

  async getSession(sessionId: string): Promise<PresentationSession | null> {
    const { data, error } = await supabase
      .from('presentation_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    return data;
  },

  async getSessionByCode(code: string): Promise<{ session: PresentationSession; remoteSession: any } | null> {
    const { data: remoteSession, error: remoteError } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (remoteError || !remoteSession) {
      console.error('Error fetching remote session:', remoteError);
      return null;
    }

    const { data: session, error: sessionError } = await supabase
      .from('presentation_sessions')
      .select('*')
      .eq('id', remoteSession.id)
      .maybeSingle();

    if (sessionError || !session) {
      console.error('Error fetching session:', sessionError);
      return null;
    }

    return { session, remoteSession };
  },

  async updateSlideIndex(sessionId: string, slideIndex: number): Promise<boolean> {
    const { error: sessionError } = await supabase
      .from('presentation_sessions')
      .update({ current_slide_index: slideIndex })
      .eq('id', sessionId);

    const { error: remoteError } = await supabase
      .from('sessions')
      .update({ current_slide: slideIndex })
      .eq('id', sessionId);

    if (sessionError || remoteError) {
      console.error('Error updating slide index:', sessionError || remoteError);
      return false;
    }

    return true;
  },

  async endSession(sessionId: string): Promise<boolean> {
    const { error: sessionError } = await supabase
      .from('presentation_sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    const { error: remoteError } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (sessionError || remoteError) {
      console.error('Error ending session:', sessionError || remoteError);
      return false;
    }

    return true;
  },

  subscribeToSession(sessionId: string, callback: (slideIndex: number) => void): RealtimeChannel {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'presentation_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          const newIndex = payload.new.current_slide_index;
          callback(newIndex);
        }
      )
      .subscribe();

    return channel;
  },

  subscribeToRemoteCommands(sessionCode: string, callback: (command: string) => void): RealtimeChannel {
    const channel = supabase
      .channel(`remote:${sessionCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'remote_commands',
          filter: `session_code=eq.${sessionCode}`
        },
        (payload) => {
          const command = payload.new.command;
          if (command === 'next' || command === 'previous') {
            callback(command);
          }
        }
      )
      .subscribe();

    return channel;
  },

  async sendRemoteCommand(sessionCode: string, command: 'next' | 'previous'): Promise<boolean> {
    const { error } = await supabase
      .from('remote_commands')
      .insert({
        session_code: sessionCode,
        command,
        slide_number: 0
      });

    if (error) {
      console.error('Error sending remote command:', error);
      return false;
    }

    return true;
  },

  async trackViewer(sessionId: string, viewerName?: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('viewer_connections')
      .insert({
        session_id: sessionId,
        viewer_name: viewerName
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking viewer:', error);
      return null;
    }

    await supabase.rpc('increment_viewer_count', { session_id: sessionId });

    return data.id;
  },

  async updateViewerLastSeen(viewerId: string): Promise<boolean> {
    const { error } = await supabase
      .from('viewer_connections')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', viewerId);

    if (error) {
      console.error('Error updating viewer last seen:', error);
      return false;
    }

    return true;
  }
};
