# BibleSlide - Complete Church Presentation Platform

## 🎯 Platform Overview

BibleSlide has been upgraded from a simple Bible verse slide generator into a comprehensive church presentation platform. The platform now includes everything needed for professional worship services, sermons, and church presentations.

## ✨ New Features

### 1. Live Presentation Mode (/present)

Full-screen presentation optimized for church projectors and screens.

**Features:**
- Full-screen projection with dark background
- Large text optimized for readability
- Smooth slide transitions with Motion animations
- Keyboard shortcuts:
  - Right Arrow / Space → Next slide
  - Left Arrow → Previous slide
  - F → Toggle fullscreen
  - Escape → Exit fullscreen

**Access:** Click "Present" button or visit `/present?session=CODE`

### 2. Multi-Screen Output

Two display modes for different presentation needs:

**Audience Screen:**
- Shows current slide only
- Clean, distraction-free display
- Optimized for projection

**Stage Screen:**
- Current slide (large)
- Next slide preview (smaller)
- Slide counter (e.g., "Slide 3 / 15")
- Presentation timer
- Navigation controls

**Toggle:** Switch between modes in presentation settings

### 3. Slide Preview Panel

Comprehensive slide management interface with three-panel layout:

**Left Panel (Slide List):**
- Thumbnail previews of all slides
- Drag-and-drop reordering
- Quick slide deletion
- Visual indication of current slide

**Center Panel (Editor):**
- Slide content editor
- Type selector (verse, lyrics, title, custom)
- Reference field for Bible verses
- Content textarea
- Background color picker

**Right Panel (Live Preview):**
- Real-time preview of current slide
- Shows exactly how it will appear
- Updates instantly as you edit

### 4. Bible Verse Auto-Slides

Intelligent verse-to-slide conversion:

**Input:** Matthew 5:1-10

**Output:**
- Slide 1 → Verse 1 with reference "Matthew 5:1"
- Slide 2 → Verse 2 with reference "Matthew 5:2"
- ...
- Slide 10 → Verse 10 with reference "Matthew 5:10"

**Rule:** One verse per slide with automatic reference generation

**Editing:** All slides can be edited before presentation

### 5. Song Lyrics Slides

Automated song lyric slide generation:

**Features:**
- Paste lyrics directly
- Auto-split by paragraph breaks
- Optional title slide
- Manual split option for long lyrics

**Example:**
```
Verse 1
Amazing grace how sweet the sound
That saved a wretch like me

Chorus
I once was lost but now I'm found
Was blind but now I see
```

**Result:**
- Slide 1 → Title (if provided)
- Slide 2 → Verse 1
- Slide 3 → Chorus

**Access:** Click "Lyrics" button in presentation editor

### 6. Background Media

Multiple background options for slides:

**Media Types:**
- **Images**: JPG, PNG (Supabase Storage)
- **Videos**: MP4 (Supabase Storage)
- **Gradients**: Pre-made or custom CSS gradients

**Pre-made Gradients:**
- Purple Gradient
- Teal Gradient
- Fire Gradient
- Dark Gradient

**Upload Process:**
1. Select file
2. Preview in modal
3. Upload to Supabase Storage
4. Apply to slide(s)

**Storage:** All media stored in Supabase `presentation-media` bucket

### 7. Slide Themes

Professional theme system with customization:

**System Themes:**
- **Classic**: Black background, white text, high contrast
- **Modern**: Dark blue gradient, contemporary feel
- **Minimal**: Light background, dark text, clean design
- **Church Dark**: Traditional church style with elegant serif fonts

**Theme Settings:**
- Font family (Inter, Georgia, Arial, etc.)
- Font size (adjustable)
- Text color (hex color picker)
- Background color/gradient
- Text shadow (on/off)
- Overlay opacity (for background images)

**Custom Themes:** Users can create and save custom themes

### 8. Cloud Projects (/presentations)

Complete project management system:

**Presentations Table:**
```sql
presentations (
  id uuid,
  user_id uuid,
  title text,
  slides jsonb[],
  theme_id uuid,
  settings jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
```

**Operations:**
- **Save**: Auto-save on changes
- **Load**: Access from any device
- **Duplicate**: Copy presentations
- **Delete**: Remove old projects
- **Rename**: Update presentation titles

**UI Features:**
- Card-based layout
- Last updated timestamps
- Slide count badges
- Quick actions (edit, duplicate, delete)

### 9. Mobile Viewer Mode (/viewer)

Real-time slide viewing for remote audiences:

**Use Cases:**
- Musicians following along
- Pastor notes on tablet
- Online audience viewing
- Team coordination

**Features:**
- Real-time slide sync
- Connection status indicator
- Session code display
- Auto-reconnect
- Mobile-optimized layout

**Connection:**
```
URL: /viewer?session=AB23CD
```

**Access:** Anyone with session code can view

### 10. Multi-Language Support

Complete internationalization:

**Languages:**
- English (en)
- French (fr)
- Spanish (es)
- Haitian Creole (ht)

**Translated Elements:**
- All UI text
- Button labels
- Navigation menus
- Error messages
- Help text

**Switching:** Language selector in header

### 11. Import/Export

Multiple export formats:

**Export Formats:**

**PowerPoint (.pptx):**
- Full slide formatting
- Background images/gradients
- Custom fonts and colors
- Text shadows
- Church name header

**PDF:**
- High-quality rendering
- 1920x1080 resolution
- Maintains all formatting
- Multi-page document

**Images (PNG):**
- Individual slide export
- High resolution
- Transparent backgrounds supported

**Import (PowerPoint):**
- Basic .pptx import
- Text extraction
- Layout detection
- Note: Complex features may require manual adjustment

### 12. Real-time Sync

Supabase Realtime integration for instant updates:

**Synced Elements:**
- Slide navigation (presenter → viewers)
- Remote commands (controllers → presenter)
- Viewer connections
- Session status

**Tables with Real-time:**
- `presentation_sessions` - Current slide index
- `remote_commands` - Navigation commands
- `viewer_connections` - Connected viewers
- `sessions` - Session metadata

**Performance:**
- WebSocket-based (no polling)
- Sub-second latency
- Handles hundreds of concurrent connections
- Optimized database indexes

## 🗄️ Complete Database Schema

### Tables Created

1. **presentations** - User presentations
2. **themes** - Slide themes (system + custom)
3. **media_files** - Uploaded backgrounds
4. **presentation_sessions** - Active presentation sessions
5. **viewer_connections** - Connected viewers
6. **sessions** - Remote control sessions (existing, enhanced)
7. **remote_commands** - Slide navigation commands (existing, enhanced)

### Security (RLS Policies)

**All tables have Row Level Security enabled**

**Presentations:**
- Users can view/edit/delete own presentations
- No cross-user access

**Themes:**
- System themes readable by all
- Custom themes only by owner

**Media Files:**
- Users can view/upload/delete own media
- Stored in Supabase Storage with policies

**Sessions:**
- Users can create own sessions
- Anyone with code can view active sessions
- Commands can be sent by anyone with code

**Viewers:**
- Anyone can create viewer connection
- Public read access for active sessions

### Performance Optimizations

**Indexes Created:**
- `user_id` on all user tables
- `session_code` for fast lookups
- `is_active` for filtering active sessions
- Composite indexes for common queries
- Foreign key indexes

## 🎮 User Workflows

### Creating a Presentation

1. Login/Signup
2. Navigate to /presentations
3. Click "New Presentation"
4. Add slides:
   - Bible verses (auto-generate)
   - Song lyrics (auto-split)
   - Custom content
5. Select theme
6. Upload backgrounds (optional)
7. Edit slide content
8. Save presentation

### Presenting

1. Open saved presentation
2. Click "Present" button
3. Full-screen mode activates
4. Use keyboard or remote to navigate
5. Slides display with theme styling

### Remote Control

**Presenter:**
1. Start presentation
2. Click smartphone icon
3. Show QR code to controllers

**Controller:**
1. Scan QR code or visit /remote?session=CODE
2. Wait for "Connected" status
3. Use Next/Previous buttons

### Viewer Mode

**Presenter:**
1. Start presentation
2. Share viewer link with audience

**Viewer:**
1. Open /viewer?session=CODE
2. See current slide automatically
3. Slides update in real-time

## 📱 Mobile Optimization

**Responsive Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Mobile Features:**
- Touch-friendly buttons
- Optimized font sizes
- Simplified navigation
- Quick actions
- Swipe gestures (where applicable)

## 🔐 Security Features

**Authentication:**
- Supabase Auth (email/password)
- Google Sign-in support
- Session management

**Data Protection:**
- Row Level Security on all tables
- User-scoped data access
- Secure file uploads
- Session expiration (24 hours)

**Public Features:**
- Remote control (with session code)
- Viewer mode (with session code)
- QR code generation

## 🚀 Performance

**Optimizations:**
- Database indexes for fast queries
- Realtime WebSocket connections
- Lazy loading of components
- Image optimization
- Efficient re-renders

**Build Optimization:**
- Vite for fast builds
- Code splitting
- Tree shaking
- Minification
- Gzip compression

**Final Bundle:**
- Main bundle: ~700 KB gzipped
- Fast initial load
- Progressive enhancement

## 📊 Statistics

**New Components:** 10
**New Services:** 3
**Database Tables:** 7
**RLS Policies:** 20+
**Supported Languages:** 4
**Export Formats:** 3
**Presentation Modes:** 3

## 🎓 Getting Started Guide

### For Church Staff

1. **Create Account**
   - Visit bibleslide.org
   - Sign up with email

2. **Create First Presentation**
   - Dashboard → Presentations → New
   - Add Bible verses or lyrics
   - Choose a theme

3. **Present Live**
   - Click "Present"
   - Use keyboard or remote control
   - Enjoy seamless worship!

### For Technical Teams

1. **Setup Remote Control**
   - Start presentation
   - Generate QR code
   - Share with sound/media team

2. **Configure Themes**
   - Select from system themes
   - Or create custom theme
   - Save for reuse

3. **Manage Media**
   - Upload church logo
   - Add background images
   - Organize in cloud storage

### For Online Ministry

1. **Enable Viewer Mode**
   - Start presentation
   - Share viewer link
   - Online audience follows live

2. **Export for Archive**
   - Export to PDF
   - Share on website
   - Email to congregation

## 🆘 Troubleshooting

**Remote Control Not Working:**
- Check session code is correct
- Verify internet connection
- Ensure session is active
- Try refreshing page

**Slides Not Syncing:**
- Check Realtime connection
- Verify database permissions
- Look for console errors

**Upload Failing:**
- Check file size (< 50MB)
- Verify file type (JPG, PNG, MP4)
- Check storage permissions

## 📞 Support

For questions or issues:
- Email: support@bibleslide.org
- Documentation: bibleslide.org/docs
- GitHub: github.com/wankymassenat/bibleslide

---

**BibleSlide** - Empowering churches to create without limits 🙏
