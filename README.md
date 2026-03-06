<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# BibleSlide - Complete Church Presentation Platform

A comprehensive presentation system designed specifically for churches, featuring Bible verse slides, song lyrics, real-time remote control, and professional presentation tools.

View your app in AI Studio: https://ai.studio/apps/10064279-9091-4f83-a76c-29b37eb09536

## ✨ Core Features

### 📖 Bible & Content Management
- **Bible Search & Display**: Search and display Bible verses in multiple translations
- **Auto Bible Slides**: Automatically split verses into individual slides (1 verse = 1 slide)
- **Song Lyrics Generator**: Paste lyrics and auto-split into slides based on paragraph breaks
- **Manual Content**: Paste any custom text for quick slide creation
- **Multi-language Support**: English, French, Spanish, and Haitian Creole interfaces

### 🎨 Professional Presentation Tools
- **Cloud Projects**: Save, edit, duplicate, and delete presentations in the cloud
- **Slide Editor**: Full-featured editor with drag-and-drop slide reordering
- **Live Preview**: See changes in real-time before presenting
- **Customizable Themes**: Classic, Modern, Minimal, and Church Dark themes
- **Background Media**: Images, videos, gradients, and solid colors
- **Export Options**: PPTX, PDF, and PNG image exports

### 🖥️ Advanced Presentation Modes
- **Full-Screen Mode**: Optimized for church projection screens
- **Stage View**: Presenter mode with current slide, next slide preview, timer, and slide list
- **Audience View**: Clean, distraction-free view for the congregation
- **Viewer Mode**: Real-time slide viewing for musicians, pastors, or online audience
- **Keyboard Shortcuts**: Arrow keys, F (fullscreen), S (stage view), ESC (exit)

### 📱 Real-time Remote Control System
- **Multi-device Control**: Control slides from phones, tablets, or laptops
- **QR Code Access**: Scan to instantly connect without typing
- **Session Management**: 6-character session codes for easy access
- **Local Network Mode**: Works offline on same WiFi network
- **Instant Sync**: Supabase Realtime for zero-latency updates
- **Multiple Controllers**: Support for hundreds of simultaneous controllers

## Remote Control System

The remote control system allows presenters to control their presentations from any device (phone, tablet, laptop) using a simple 6-character session code.

### How It Works

1. **Start a Presentation**: Click "Start Remote Control" in the live presentation view
2. **Generate Session Code**: A unique 6-character code is generated (e.g., AB23CD)
3. **Display QR Code**: A QR code is shown for easy mobile access
4. **Connect Remote Devices**:
   - Scan the QR code with your phone camera, OR
   - Visit `https://bibleslide.org/remote?session=AB23CD`
   - Enter the session code manually
5. **Control Slides**: Use Next/Previous buttons on your remote device
6. **Real-time Sync**: Commands are sent instantly via Supabase Realtime

### Technical Architecture

- **Database**: PostgreSQL via Supabase
  - `sessions` table: Stores active presentation sessions
  - `remote_commands` table: Stores slide navigation commands
- **Real-time Communication**: Supabase Realtime subscriptions
- **Security**: Row Level Security (RLS) policies ensure only authorized users can create sessions
- **Network Support**: Works over internet or local WiFi

### Database Schema

```sql
-- Sessions table
CREATE TABLE sessions (
  id uuid PRIMARY KEY,
  session_code text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Remote commands table
CREATE TABLE remote_commands (
  id uuid PRIMARY KEY,
  session_code text NOT NULL,
  command text CHECK (command IN ('next', 'previous')),
  created_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false
);
```

### Remote Control Features

- **Session Management**: Automatic session expiration after 24 hours
- **Connection Status**: Real-time connection status indicator
- **Multi-device Support**: Multiple devices can control simultaneously
- **Local Network Mode**: Works without internet on same WiFi
- **QR Code Access**: Quick access via QR code scanning
- **Secure**: Only session owners can create sessions, but anyone with the code can send commands

## Run Locally

**Prerequisites:**  Node.js, npm

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_BIBLIA_API_KEY=your_biblia_api_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## Production Build

```bash
npm run build
```

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Motion (Framer Motion)
- **Backend**: Supabase (PostgreSQL, Realtime, Auth)
- **Build Tool**: Vite
- **Presentation Export**: pptxgenjs, jsPDF, html2canvas
- **QR Codes**: qrcode.react
- **Server**: Express, WebSockets

## Project Structure

```
src/
├── components/
│   ├── RemoteControlManager.tsx   # Presenter remote control UI
│   ├── RemoteControlPage.tsx      # Phone controller interface
│   ├── LivePresentation.tsx       # Main presentation view
│   ├── Dashboard.tsx              # User dashboard
│   └── ...
├── services/
│   ├── activityService.ts         # User activity tracking
│   ├── bibleNormalization.ts      # Bible reference parsing
│   └── gemini.ts                  # AI integration
└── i18n/                          # Internationalization
```

## Contributing

Contributions are welcome! Please ensure all features maintain backward compatibility with existing functionality.

## License

© 2026 BibleSlide — Tool for Churches. Powered by Wanky Massenat.

## Support

For questions or support, contact: support@bibleslide.org
