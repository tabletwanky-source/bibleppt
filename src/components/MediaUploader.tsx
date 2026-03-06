import { useState, useRef } from 'react';
import { presentationService } from '../services/presentationService';
import { Upload, Image, Video, X } from 'lucide-react';

interface MediaUploaderProps {
  onMediaSelected: (url: string, type: 'image' | 'video') => void;
}

export default function MediaUploader({ onMediaSelected }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = file.type.startsWith('image/') ? 'image' : 'video';
    setMediaType(type);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !mediaType) return;

    setUploading(true);
    const url = await presentationService.uploadMedia(file);
    setUploading(false);

    if (url) {
      onMediaSelected(url, mediaType);
      handleClear();
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-800">Background Media</h2>
      </div>

      <div className="space-y-4">
        {!previewUrl ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="media-upload"
            />
            <label
              htmlFor="media-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <div className="flex gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <Image className="w-8 h-8 text-blue-600" />
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <Video className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-700 mb-1">
                  Choose an image or video
                </p>
                <p className="text-sm text-gray-500">
                  JPG, PNG, MP4 up to 50MB
                </p>
              </div>
            </label>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 z-10 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>

            {mediaType === 'image' ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : (
              <video
                src={previewUrl}
                className="w-full h-64 object-cover rounded-lg"
                controls
              />
            )}

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-4 w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload and Use as Background'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
               onClick={() => onMediaSelected('linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'image')}>
            <p className="text-white text-sm font-medium text-center">Purple Gradient</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-600 to-teal-600 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
               onClick={() => onMediaSelected('linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', 'image')}>
            <p className="text-white text-sm font-medium text-center">Teal Gradient</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
               onClick={() => onMediaSelected('linear-gradient(135deg, #f97316 0%, #dc2626 100%)', 'image')}>
            <p className="text-white text-sm font-medium text-center">Fire Gradient</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
               onClick={() => onMediaSelected('linear-gradient(135deg, #1f2937 0%, #111827 100%)', 'image')}>
            <p className="text-white text-sm font-medium text-center">Dark Gradient</p>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Large video files may affect presentation performance. Consider using images or short video loops for best results.
          </p>
        </div>
      </div>
    </div>
  );
}
