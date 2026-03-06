import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, X, Power, PowerOff, Copy, Check } from 'lucide-react';

interface RemoteControlManagerProps {
  onCommandReceived?: (command: 'next' | 'previous') => void;
}

export const RemoteControlManager: React.FC<RemoteControlManagerProps> = ({ onCommandReceived }) => {
  const [isActive, setIsActive] = useState(false);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [remoteUrl, setRemoteUrl] = useState<string>('');
  const [localUrl, setLocalUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState(0);

  const generateSessionCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const getLocalIP = async (): Promise<string> => {
    try {
      const response = await fetch('/api/local-ip');
      const data = await response.json();
      return data.ip || '';
    } catch (error) {
      return '';
    }
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
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setSessionCode(code);
      setSessionId(data.id);
      setIsActive(true);

      const baseUrl = window.location.origin;
      setRemoteUrl(`${baseUrl}/remote?session=${code}`);

      const localIP = await getLocalIP();
      if (localIP) {
        const port = window.location.port ? `:${window.location.port}` : '';
        setLocalUrl(`http://${localIP}${port}/remote?session=${code}`);
      }

      subscribeToCommands(code);
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

      setIsActive(false);
      setSessionCode(null);
      setSessionId(null);
      setRemoteUrl('');
      setLocalUrl('');
      setConnectedDevices(0);
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  const subscribeToCommands = (code: string) => {
    const channel = supabase
      .channel(`session:${code}`)
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to remote commands');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold">Remote Control</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Control your presentation from any device on your network
        </p>
        <button
          onClick={startSession}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Power className="w-5 h-5" />
          Start Remote Control
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Smartphone className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-semibold">Remote Control Active</h3>
        </div>
        <button
          onClick={stopSession}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <PowerOff className="w-4 h-4" />
          Stop
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Session Code</p>
            <p className="text-4xl font-bold text-blue-600 tracking-wider mb-4">
              {sessionCode}
            </p>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={remoteUrl} size={200} level="H" />
            </div>
            <p className="text-xs text-gray-500">
              Scan with your phone camera
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Internet URL</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={remoteUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
              />
              <button
                onClick={() => copyToClipboard(remoteUrl)}
                className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                title="Copy URL"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {localUrl && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Local Network URL</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                />
                <button
                  onClick={() => copyToClipboard(localUrl)}
                  className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  title="Copy URL"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Works without internet if on same WiFi
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Instructions</p>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Open the URL on your phone or scan the QR code</li>
              <li>Use Next/Previous buttons to control slides</li>
              <li>Multiple devices can connect simultaneously</li>
            </ol>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Status: <span className="text-green-600 font-medium">Connected</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
