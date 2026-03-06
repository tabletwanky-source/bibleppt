import { useState, useEffect } from 'react';
import { presentationService, Theme } from '../services/presentationService';
import { Palette, Check } from 'lucide-react';

interface ThemeSelectorProps {
  selectedThemeId?: string;
  onThemeSelect: (theme: Theme) => void;
}

export default function ThemeSelector({ selectedThemeId, onThemeSelect }: ThemeSelectorProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    setLoading(true);
    const data = await presentationService.getAllThemes();
    setThemes(data);
    setLoading(false);
  };

  const getThemePreviewStyle = (theme: Theme) => {
    if (theme.background_gradient) {
      return { background: theme.background_gradient };
    }
    return { backgroundColor: theme.background_color };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Palette className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Slide Themes</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeSelect(theme)}
            className={`relative p-4 rounded-lg border-2 transition-all ${
              selectedThemeId === theme.id
                ? 'border-blue-600 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {selectedThemeId === theme.id && (
              <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}

            <div
              className="w-full h-24 rounded-lg mb-3 flex items-center justify-center"
              style={getThemePreviewStyle(theme)}
            >
              <span
                style={{
                  color: theme.text_color,
                  fontFamily: theme.font_family,
                  fontSize: '20px',
                  textShadow: theme.text_shadow ? '1px 1px 4px rgba(0,0,0,0.8)' : 'none'
                }}
              >
                Sample Text
              </span>
            </div>

            <div className="text-left">
              <h3 className="font-semibold text-gray-800 mb-1">
                {theme.name}
                {theme.is_system && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    System
                  </span>
                )}
              </h3>
              <div className="text-sm text-gray-600">
                <div>{theme.font_family} • {theme.font_size}px</div>
                {theme.settings?.description && (
                  <div className="text-xs text-gray-500 mt-1">{theme.settings.description}</div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Choose a theme that matches your church's style. Classic works well for traditional services, while Modern is great for contemporary worship.
        </p>
      </div>
    </div>
  );
}
