export interface Theme {
  name: string;
  displayName: string;
  fontFamily: string;
  fontSize: string;
  textColor: string;
  backgroundColor: string;
  textShadow: boolean;
  overlayOpacity: number;
  gradient?: string;
}

export const themes: Record<string, Theme> = {
  classic: {
    name: 'classic',
    displayName: 'Classic',
    fontFamily: 'Georgia, serif',
    fontSize: '3rem',
    textColor: '#ffffff',
    backgroundColor: '#1a1a2e',
    textShadow: true,
    overlayOpacity: 0.3
  },
  modern: {
    name: 'modern',
    displayName: 'Modern',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '3.5rem',
    textColor: '#ffffff',
    backgroundColor: '#0f172a',
    textShadow: false,
    overlayOpacity: 0.4,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  minimal: {
    name: 'minimal',
    displayName: 'Minimal',
    fontFamily: 'Helvetica Neue, Arial, sans-serif',
    fontSize: '3rem',
    textColor: '#1f2937',
    backgroundColor: '#f9fafb',
    textShadow: false,
    overlayOpacity: 0.1
  },
  church_dark: {
    name: 'church_dark',
    displayName: 'Church Dark',
    fontFamily: 'Crimson Text, Georgia, serif',
    fontSize: '3.2rem',
    textColor: '#fef3c7',
    backgroundColor: '#1c1917',
    textShadow: true,
    overlayOpacity: 0.5,
    gradient: 'linear-gradient(to bottom, #1c1917 0%, #44403c 100%)'
  }
};

export const getTheme = (themeName: string): Theme => {
  return themes[themeName] || themes.classic;
};
