import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Wifi,
  WifiOff,
  Loader,
  Lock,
  Radio,
  Users,
  ArrowLeft
} from 'lucide-react';

const getDeviceId = () => {
  let deviceId = localStorage.getItem('bibleslide_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('bibleslide_device_id', deviceId);
  }
  return deviceId;
};

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export const RemoteControlPage: React.FC = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState('');
  const [lastCommand, setLastCommand] = useState<'next' | 'previous' | null>(null);
  const [remoteAllowed, setRemoteAllowed] = useState(true);
  const [connectedDevices, setConnectedDevices] = useState(0);
  const [reconnectCountdown, setReconnectCountdown] = useState(0);
  const heartbeatInterval = useRef<ReturnType<typeof setInterval>>();
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();
  const sessionChannel = useRef<any>(null);
  const deviceId = useRef(getDeviceId());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('session');
    if (code) {
      const upperCode = code.toUpperCase();
      setInputCode(upperCode);
      setSessionCode(upperCode);
      connectToSession(upperCode);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    if (sessionChannel.current) {
      supabase.removeChannel(sessionChannel.current);
      sessionChannel.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const registerDevice = async (code: string) => {
    try {
      await supabase
        .from('remote_devices')
        .upsert({
          session_code: code,
          device_id: deviceId.current,
          device_name: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
            ? 'Mobile Device'
            : 'Desktop',
          last_seen: new Date().toISOString()
        }, { onConflict: 'session_code,device_id' });
    } catch (err) {
      console.error('Error registering device:', err);
    }
  };

  const startHeartbeat = (code: string) => {
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);

    heartbeatInterval.current = setInterval(async () => {
      try {
        const { error } = await supabase
          .from('remote_devices')
          .update({ last_seen: new Date().toISOString() })
          .eq('session_code', code)
          .eq('device_id', deviceId.current);

        if (error) throw error;
      } catch {
        scheduleReconnect(code);
      }
    }, 20000);
  };

  const scheduleReconnect = (code: string) => {
    if (connectionStatus === 'reconnecting') return;
    setConnectionStatus('reconnecting');
    setReconnectCountdown(5);

    const tick = setInterval(() => {
      setReconnectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(tick);
          connectToSession(code);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const subscribeToSessionStatus = (code: string) => {
    if (sessionChannel.current) {
      supabase.removeChannel(sessionChannel.current);
    }

    sessionChannel.current = supabase
      .channel(`session-status:${code}:${deviceId.current}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `session_code=eq.${code}`
        },
        (payload: any) => {
          if (!payload.new.is_active) {
            cleanup();
            setIsConnected(false);
            setConnectionStatus('disconnected');
            setSessionCode('');
            setError('Session ended by presenter');
            return;
          }
          setRemoteAllowed(payload.new.allow_remote_control ?? true);
          setConnectedDevices(payload.new.connected_devices_count ?? 0);
        }
      )
      .subscribe();
  };

  const connectToSession = async (code: string) => {
    setConnectionStatus('connecting');
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setConnectionStatus('disconnected');
        setError('Session not found or not active. Check the code and try again.');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setConnectionStatus('disconnected');
        setError('This session has expired. Ask the presenter to start a new one.');
        return;
      }

      setRemoteAllowed(data.allow_remote_control ?? true);
      setConnectedDevices(data.connected_devices_count ?? 0);
      setSessionCode(code);

      await registerDevice(code);

      setIsConnected(true);
      setConnectionStatus('connected');
      setError('');

      startHeartbeat(code);
      subscribeToSessionStatus(code);
    } catch (err) {
      console.error('Error connecting:', err);
      setConnectionStatus('disconnected');
      setError('Connection failed. Please try again.');
    }
  };

  const sendCommand = async (command: 'next' | 'previous') => {
    if (!isConnected || !sessionCode || !remoteAllowed) return;

    setLastCommand(command);
    try {
      const { error } = await supabase
        .from('remote_commands')
        .insert({ session_code: sessionCode, command });

      if (error) {
        if (error.message?.includes('allow_remote_control')) {
          setRemoteAllowed(false);
          setError('Remote control is locked by presenter');
        } else {
          throw error;
        }
      }
    } catch {
      setError('Failed to send command');
    } finally {
      setTimeout(() => setLastCommand(null), 400);
    }
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.length === 6) {
      connectToSession(inputCode.toUpperCase());
    }
  };

  const disconnect = () => {
    cleanup();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setSessionCode('');
    setInputCode('');
    setError('');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/20 border border-blue-500/30 rounded-3xl mb-5">
              <Radio className="w-10 h-10 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">BibSlide Remote</h1>
            <p className="text-slate-400">Control slides from your phone</p>
          </div>

          <form onSubmit={handleConnect} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3 uppercase tracking-widest">
                Session Code
              </label>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="AB23CD"
                maxLength={6}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className="w-full px-6 py-5 text-center text-3xl font-bold tracking-[0.3em] bg-slate-700/60 border-2 border-slate-600 rounded-2xl text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-colors"
              />
              <p className="text-xs text-slate-500 text-center mt-2">
                Enter the 6-character code from the presenter screen
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={inputCode.length !== 6 || connectionStatus === 'connecting'}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {connectionStatus === 'connecting' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : connectionStatus === 'reconnecting' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Reconnecting in {reconnectCountdown}s...
                </>
              ) : (
                <>
                  <Wifi className="w-5 h-5" />
                  Connect
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
            <p className="text-xs text-slate-600">
              Supports 1000+ simultaneous controllers
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-3 border-b border-slate-700/50">
        <button
          onClick={disconnect}
          className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' :
              connectionStatus === 'reconnecting' ? 'bg-yellow-400 animate-pulse' :
              'bg-red-400'
            }`} />
            <span className="text-white font-bold tracking-widest text-sm">{sessionCode}</span>
          </div>
          <span className="text-slate-500 text-xs">
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'reconnecting' ? `Reconnecting in ${reconnectCountdown}s...` :
             'Disconnected'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Users className="w-4 h-4" />
          <span className="text-sm font-semibold">{connectedDevices}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">

        {/* Lock Notice */}
        {!remoteAllowed && (
          <div className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
            <Lock className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="text-yellow-300 text-sm font-medium">
              Remote control locked by presenter
            </p>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Slide Controls */}
        <div className="w-full grid grid-cols-2 gap-4">
          <button
            onPointerDown={() => remoteAllowed && sendCommand('previous')}
            disabled={!remoteAllowed}
            className={`
              flex flex-col items-center justify-center gap-4 rounded-3xl transition-all duration-100
              active:scale-95 active:brightness-90
              min-h-[200px] sm:min-h-[240px]
              ${lastCommand === 'previous'
                ? 'bg-slate-500 scale-95'
                : remoteAllowed
                ? 'bg-slate-700/80 hover:bg-slate-600/80 active:bg-slate-600'
                : 'bg-slate-800/40 opacity-40 cursor-not-allowed'}
            `}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ChevronLeft className="w-16 h-16 text-slate-200" />
            <span className="text-slate-300 font-bold text-lg tracking-wide">PREVIOUS</span>
          </button>

          <button
            onPointerDown={() => remoteAllowed && sendCommand('next')}
            disabled={!remoteAllowed}
            className={`
              flex flex-col items-center justify-center gap-4 rounded-3xl transition-all duration-100
              active:scale-95 active:brightness-90
              min-h-[200px] sm:min-h-[240px]
              ${lastCommand === 'next'
                ? 'bg-blue-400 scale-95'
                : remoteAllowed
                ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-500'
                : 'bg-blue-900/40 opacity-40 cursor-not-allowed'}
            `}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ChevronRight className="w-16 h-16 text-white" />
            <span className="text-white font-bold text-lg tracking-wide">NEXT</span>
          </button>
        </div>

        {/* Status Bar */}
        <div className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm font-medium ${
              connectionStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {connectionStatus === 'connected' ? 'Live' :
               connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Smartphone className="w-4 h-4" />
            <span className="text-xs">Keep screen awake</span>
          </div>
        </div>
      </div>
    </div>
  );
};
