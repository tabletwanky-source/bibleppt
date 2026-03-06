import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Power, PowerOff, Copy, Check, Users, Lock, Clock as Unlock, Wifi, Share2 } from 'lucide-react';

interface RemoteControlManagerProps {
  onCommandReceived?: (command: 'next' | 'previous') => void;
  onSessionChange?: (info: { code: string | null; devices: number; allowed: boolean } | null) => void;
}

export const RemoteControlManager: React.FC<RemoteControlManagerProps> = ({ onCommandReceived, onSessionChange }) => {
  const [isActive, setIsActive] = useState(false);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [remoteUrl, setRemoteUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState(0);
  const [remoteAllowed, setRemoteAllowed] = useState(true);
  const commandChannel = useRef<any>(null);
  const statusChannel = useRef<any>(null);

  const generateSessionCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const startSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in to start a remote control session');
        return;
      }

      const code = generateSessionCode();

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          session_code: code,
          user_id: user.id,
          is_active: true,
          allow_remote_control: true,
          connected_devices_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      setSessionCode(code);
      setSessionId(data.id);
      setIsActive(true);
      setRemoteAllowed(true);
      setConnectedDevices(0);
      setRemoteUrl(`${window.location.origin}/remote?session=${code}`);
      onSessionChange?.({ code, devices: 0, allowed: true });

      subscribeToCommands(code, data.id);
      subscribeToStatus(code);
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start remote control session');
    }
  };

  const stopSession = async () => {
    if (!sessionId) return;

    try {
      await supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      cleanup();
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  const cleanup = () => {
    if (commandChannel.current) {
      supabase.removeChannel(commandChannel.current);
      commandChannel.current = null;
    }
    if (statusChannel.current) {
      supabase.removeChannel(statusChannel.current);
      statusChannel.current = null;
    }
    setIsActive(false);
    setSessionCode(null);
    setSessionId(null);
    setRemoteUrl('');
    setConnectedDevices(0);
    onSessionChange?.(null);
  };

  const subscribeToCommands = (code: string, id: string) => {
    if (commandChannel.current) {
      supabase.removeChannel(commandChannel.current);
    }

    commandChannel.current = supabase
      .channel(`presenter-commands:${code}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'remote_commands',
          filter: `session_code=eq.${code}`
        },
        (payload) => {
          const command = payload.new.command as 'next' | 'previous';
          if (onCommandReceived) {
            onCommandReceived(command);
          }
          markCommandAsProcessed(payload.new.id);
        }
      )
      .subscribe();
  };

  const subscribeToStatus = (code: string) => {
    if (statusChannel.current) {
      supabase.removeChannel(statusChannel.current);
    }

    statusChannel.current = supabase
      .channel(`presenter-status:${code}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `session_code=eq.${code}`
        },
        (payload: any) => {
          const devices = payload.new.connected_devices_count ?? 0;
          const allowed = payload.new.allow_remote_control ?? true;
          setConnectedDevices(devices);
          setRemoteAllowed(allowed);
          onSessionChange?.({ code: payload.new.session_code, devices, allowed });
        }
      )
      .subscribe();
  };

  const markCommandAsProcessed = async (commandId: string) => {
    try {
      await supabase
        .from('remote_commands')
        .update({ processed: true })
        .eq('id', commandId);
    } catch (error) {
      console.error('Error marking command as processed:', error);
    }
  };

  const toggleRemoteControl = async () => {
    if (!sessionCode) return;
    const newValue = !remoteAllowed;
    setRemoteAllowed(newValue);
    onSessionChange?.({ code: sessionCode, devices: connectedDevices, allowed: newValue });

    try {
      await supabase
        .from('sessions')
        .update({ allow_remote_control: newValue })
        .eq('session_code', sessionCode);
    } catch {
      setRemoteAllowed(!newValue);
      onSessionChange?.({ code: sessionCode, devices: connectedDevices, allowed: !newValue });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(remoteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BibSlide Remote Control',
          text: `Control slides with code: ${sessionCode}`,
          url: remoteUrl,
        });
      } catch {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  useEffect(() => {
    return () => {
      if (isActive && sessionId) {
        stopSession();
      }
    };
  }, []);

  if (!isActive) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Remote Control</h3>
            <p className="text-sm text-slate-500">Let attendees control slides from their phones</p>
          </div>
        </div>
        <button
          onClick={startSession}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all active:scale-95"
        >
          <Power className="w-5 h-5" />
          Start Remote Session
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-white font-semibold">Remote Session Active</span>
        </div>
        <button
          onClick={stopSession}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <PowerOff className="w-4 h-4" />
          Stop
        </button>
      </div>

      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code Side */}
          <div className="flex flex-col items-center">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 w-full flex flex-col items-center">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Session Code</p>
              <p className="text-4xl font-bold text-blue-600 tracking-[0.2em] mb-4">{sessionCode}</p>
              <div className="bg-white rounded-xl p-3 border border-slate-200 mb-3">
                <QRCodeSVG value={remoteUrl} size={160} level="H" />
              </div>
              <p className="text-xs text-slate-500 text-center">
                Scan to connect or visit:<br />
                <span className="font-mono text-blue-600 text-[11px]">{window.location.origin}/remote</span>
              </p>
            </div>
          </div>

          {/* Controls Side */}
          <div className="flex flex-col gap-4">
            {/* Device Count */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <Users className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold text-emerald-600 leading-none">{connectedDevices}</p>
                <p className="text-xs text-emerald-700 mt-0.5">device{connectedDevices !== 1 ? 's' : ''} connected</p>
              </div>
            </div>

            {/* Lock Toggle */}
            <button
              onClick={toggleRemoteControl}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                remoteAllowed
                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              {remoteAllowed ? (
                <>
                  <Unlock className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">Remote Unlocked</p>
                    <p className="text-xs opacity-70">Tap to lock slide control</p>
                  </div>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">Remote Locked</p>
                    <p className="text-xs opacity-70">Tap to unlock slide control</p>
                  </div>
                </>
              )}
            </button>

            {/* Connection Status */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <Wifi className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-slate-600">
                Supabase Realtime — supports 1000+ devices
              </span>
            </div>

            {/* Share Buttons */}
            <div className="flex gap-2">
              <button
                onClick={shareUrl}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                Share Link
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
                title="Copy URL"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 space-y-1">
              <p className="font-semibold mb-2">How to connect:</p>
              <p>1. Open the link or scan the QR code on any phone</p>
              <p>2. Enter code <span className="font-mono font-bold">{sessionCode}</span> if asked</p>
              <p>3. Tap NEXT or PREVIOUS to control slides</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
