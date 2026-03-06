import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ChevronLeft, ChevronRight, Smartphone, Wifi, WifiOff, Loader } from 'lucide-react';

export const RemoteControlPage: React.FC = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [sessionValid, setSessionValid] = useState(false);
  const [error, setError] = useState('');
  const [lastCommand, setLastCommand] = useState<'next' | 'previous' | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('session');
    if (code) {
      setSessionCode(code.toUpperCase());
      connectToSession(code.toUpperCase());
    }
  }, []);

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
        setSessionValid(false);
        setError('Session not found or inactive');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setConnectionStatus('disconnected');
        setSessionValid(false);
        setError('Session has expired');
        return;
      }

      setSessionValid(true);
      setConnectionStatus('connected');
      setIsConnected(true);

      subscribeToSessionStatus(code);
    } catch (err) {
      console.error('Error connecting to session:', err);
      setConnectionStatus('disconnected');
      setError('Failed to connect to session');
    }
  };

  const subscribeToSessionStatus = (code: string) => {
    const channel = supabase
      .channel(`session-status:${code}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `session_code=eq.${code}`
        },
        (payload) => {
          if (!payload.new.is_active) {
            setIsConnected(false);
            setConnectionStatus('disconnected');
            setError('Session ended by presenter');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendCommand = async (command: 'next' | 'previous') => {
    if (!isConnected || !sessionCode) return;

    try {
      setLastCommand(command);

      const { error } = await supabase
        .from('remote_commands')
        .insert({
          session_code: sessionCode,
          command: command
        });

      if (error) throw error;

      setTimeout(() => setLastCommand(null), 300);
    } catch (err) {
      console.error('Error sending command:', err);
      setError('Failed to send command');
    }
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionCode.length === 6) {
      connectToSession(sessionCode.toUpperCase());
    }
  };

  if (!isConnected && !sessionCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Smartphone className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">BibleSlide Remote</h1>
            <p className="text-gray-600">Control presentations remotely</p>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Code
              </label>
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="AB23CD"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl font-bold tracking-wider border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none uppercase"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={sessionCode.length !== 6 || connectionStatus === 'connecting'}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {connectionStatus === 'connecting' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Enter the 6-character code shown on the presenter screen
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">BibleSlide Remote</h1>
                <p className="text-sm text-gray-600">Session: {sessionCode}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </>
              ) : connectionStatus === 'connecting' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">Connecting</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {!isConnected ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <WifiOff className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Waiting for presenter...'}
            </h2>
            <p className="text-gray-600 mb-6">
              Make sure the presentation session is active
            </p>
            <button
              onClick={() => connectToSession(sessionCode)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="max-w-md w-full space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Slide Controls
              </h2>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => sendCommand('previous')}
                  className={`flex flex-col items-center justify-center gap-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-2xl p-8 transition-all transform active:scale-95 ${
                    lastCommand === 'previous' ? 'ring-4 ring-blue-500' : ''
                  }`}
                >
                  <ChevronLeft className="w-12 h-12 text-gray-700" />
                  <span className="text-lg font-semibold text-gray-900">Previous</span>
                </button>

                <button
                  onClick={() => sendCommand('next')}
                  className={`flex flex-col items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-2xl p-8 transition-all transform active:scale-95 ${
                    lastCommand === 'next' ? 'ring-4 ring-blue-300' : ''
                  }`}
                >
                  <ChevronRight className="w-12 h-12 text-white" />
                  <span className="text-lg font-semibold text-white">Next</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600 text-center">
                Tip: Keep this screen active for best performance
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
