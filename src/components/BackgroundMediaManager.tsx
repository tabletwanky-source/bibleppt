import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Video, Trash2, Palette } from 'lucide-react';
import { mediaService } from '../services/presentationService';

interface BackgroundMediaManagerProps {
  onSelectBackground: (background: any) => void;
  onClose: () => void;
}

const gradients = [
  { name: 'Sunset', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)' },
  { name: 'Fire', value: 'linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)' },
  { name: 'Night', value: 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)' },
  { name: 'Royal', value: 'linear-gradient(135deg, #360033 0%, #0b8793 100%)' },
];

const solidColors = [
  { name: 'Black', value: '#000000' },
  { name: 'Navy', value: '#1a1a2e' },
  { name: 'Dark Blue', value: '#0f172a' },
  { name: 'Dark Gray', value: '#1f2937' },
  { name: 'Brown', value: '#1c1917' },
  { name: 'White', value: '#ffffff' },
];

export default function BackgroundMediaManager({ onSelectBackground, onClose }: BackgroundMediaManagerProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'gradients' | 'images' | 'videos'>('gradients');
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    const files = await mediaService.getUserMedia();
    setMediaFiles(files);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    const url = await mediaService.uploadMedia(file);
    if (url) {
      await loadMedia();
      const fileType = file.type.startsWith('image/') ? 'image' : 'video';
      onSelectBackground({ type: fileType, value: url });
    }
    setUploading(false);
  };

  const handleDelete = async (id: string, storagePath: string) => {
    const success = await mediaService.deleteMedia(id, storagePath);
    if (success) {
      await loadMedia();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Background Media</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('gradients')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'gradients'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Palette className="w-4 h-4" />
              Gradients
            </button>
            <button
              onClick={() => setActiveTab('colors')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'colors'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Palette className="w-4 h-4" />
              Colors
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'images'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Images
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'videos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Video className="w-4 h-4" />
              Videos
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'gradients' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gradients.map((gradient) => (
                <button
                  key={gradient.name}
                  onClick={() => {
                    onSelectBackground({ type: 'gradient', value: gradient.value });
                    onClose();
                  }}
                  className="relative h-32 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors group"
                  style={{ background: gradient.value }}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-3">
                    <span className="text-white font-medium drop-shadow-lg">{gradient.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {solidColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    onSelectBackground({ type: 'color', value: color.value });
                    onClose();
                  }}
                  className="relative h-32 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors group"
                  style={{ backgroundColor: color.value }}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-3">
                    <span
                      className={`font-medium drop-shadow-lg ${
                        color.value === '#ffffff' ? 'text-gray-800' : 'text-white'
                      }`}
                    >
                      {color.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'images' && (
            <div>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors mb-6">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload image</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 50MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mediaFiles
                  .filter((file) => file.file_type === 'image')
                  .map((file) => (
                    <div key={file.id} className="relative group">
                      <button
                        onClick={() => {
                          const { data } = supabase.storage
                            .from('presentation-media')
                            .getPublicUrl(file.storage_path);
                          onSelectBackground({ type: 'image', value: data.publicUrl });
                          onClose();
                        }}
                        className="w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
                      >
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/presentation-media/${file.storage_path}`}
                          alt={file.filename}
                          className="w-full h-full object-cover"
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(file.id, file.storage_path)}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors mb-6">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload video</p>
                      <p className="text-xs text-gray-400">MP4 up to 50MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mediaFiles
                  .filter((file) => file.file_type === 'video')
                  .map((file) => (
                    <div key={file.id} className="relative group">
                      <button
                        onClick={() => {
                          const { data } = supabase.storage
                            .from('presentation-media')
                            .getPublicUrl(file.storage_path);
                          onSelectBackground({ type: 'video', value: data.publicUrl });
                          onClose();
                        }}
                        className="w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors bg-black"
                      >
                        <video
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/presentation-media/${file.storage_path}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(file.id, file.storage_path)}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { supabase } from '../supabaseClient';
