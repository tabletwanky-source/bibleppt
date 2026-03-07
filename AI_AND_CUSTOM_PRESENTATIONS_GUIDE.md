# BibleSlide AI & Custom Presentations - Implementation Guide

## Overview

BibleSlide now includes revolutionary AI-powered Bible search and a professional Custom Presentation Builder. These features transform BibleSlide from a simple slide generator into a complete church presentation platform.

---

## 1. AI-Powered Bible Search with Google Gemini

### Features

**Smart Verse Search**
- Natural language queries: "John 3:16", "Matthew 5:1-10"
- Automatic verse range detection and parsing
- Returns properly formatted verses ready for slides

**Topic Search**
- Search by themes: "verses about faith", "love in the Bible"
- AI returns 5-8 relevant verses automatically
- Perfect for sermon preparation and topical studies

**Multilingual Support**
- English, French, Spanish, Haitian Creole
- Gemini returns verses in the selected language
- Seamless language switching

**Direct Slide Generation**
- "Generate Slides" button creates slides instantly
- Automatic verse formatting with proper numbering
- Integrates with existing slide editor

### How It Works

1. **User enters query** in the AI Bible Search component
2. **Query sent to Supabase Edge Function** (`ai-bible-search`)
3. **Gemini processes** the query and returns structured verse data
4. **Verses displayed** with option to generate slides or add to editor
5. **Automatic fallback** to standard Bible API if Gemini is unavailable

### Edge Function Details

**Location:** `supabase/functions/ai-bible-search/index.ts`

**Key Features:**
- Secure API key handling (never exposed to frontend)
- CORS enabled for all origins
- Multilingual prompts for Gemini
- JSON response parsing with error handling
- Graceful fallback messaging

**Required Secret:**
- `GEMINI_API_KEY` - Already configured in Supabase

### Usage in App

```typescript
<AIBibleSearch
  darkMode={darkMode}
  onGenerateSlides={(verses) => {
    // Automatically creates Bible data and slides
  }}
  onAddVerses={(verses) => {
    // Adds verses to paste editor
  }}
/>
```

---

## 2. Custom Presentation Builder

### Features

**Complete Presentation Management**
- Create unlimited custom presentations
- Add title and description to each presentation
- View all presentations in a grid layout
- Edit, duplicate, and delete presentations

**Professional Slide Editor**
- Add/edit/delete individual slides
- Drag-and-drop reordering
- Live preview of each slide
- Persistent storage in Supabase

**Rich Text Styling**
- Custom font sizes (12-96px)
- Text color picker
- Bold and italic formatting
- Individual slide themes

**Advanced Options (Ready for Enhancement)**
- Background images (database field ready)
- Background videos (database field ready)
- Custom themes per slide

### Database Schema

**Table: `presentations`**
- `id` - UUID primary key
- `user_id` - References auth.users
- `title` - Presentation name
- `description` - Optional description
- `created_at`, `updated_at` - Timestamps

**Table: `slides`**
- `id` - UUID primary key
- `presentation_id` - References presentations
- `slide_order` - Integer for ordering
- `title` - Slide title
- `body` - Slide content
- `slide_theme` - Theme name
- `background_image` - Image URL
- `background_video` - Video URL
- `text_style` - JSONB for font styling

**Row Level Security:**
- Users can only access their own presentations
- Slides inherit permissions from parent presentation
- All CRUD operations are secured

### Components Created

1. **CustomPresentationBuilder** - Main presentation list view
   - Create new presentations
   - View all user presentations
   - Delete presentations
   - Navigate to editor

2. **CustomSlideEditor** - Advanced slide editing interface
   - Sidebar with slide thumbnails
   - Central editor pane
   - Live preview panel
   - Drag-and-drop reordering
   - Real-time Supabase sync

3. **PresentationManager** (Enhanced) - Integration with existing system
   - Links to custom builder
   - Presentation service integration

### Navigation

Users can access Custom Presentations via:
1. **Navigation menu** - "Custom Slides" button (purple, with sparkles icon)
2. **Dashboard** - Can add shortcut in future enhancement
3. **Direct URL** - Set view to 'custom-builder'

---

## 3. Architecture Decisions

### Why Gemini for AI Search?

1. **Cost Effective** - Use Gemini only for topic search
2. **Smart Routing** - Standard verse references use Bible API (free)
3. **Scalable** - Edge Function handles rate limiting
4. **Secure** - API keys never exposed to client

### Why Separate Slides Table?

1. **Better Performance** - Individual slide updates without full JSON replace
2. **Easier Reordering** - Simple ORDER BY slide_order
3. **Future Features** - Can add slide-level sharing, comments, etc.
4. **Backward Compatible** - Existing JSONB approach still works

### Why Edge Functions?

1. **Security** - API keys stay server-side
2. **CORS Handling** - Proper headers for all origins
3. **Error Handling** - Graceful fallbacks
4. **Scalability** - Automatic scaling by Supabase

---

## 4. User Workflow

### AI Bible Search Workflow

1. User logs in (optional, works for guests too)
2. Enters query: "verses about hope"
3. Selects "Topic Search"
4. Clicks "Search with AI"
5. Gemini returns 5-8 relevant verses
6. User clicks "Generate Slides"
7. Slides automatically created in paste mode
8. User can customize and export to PPTX/PDF

### Custom Presentation Workflow

1. User logs in (required)
2. Clicks "Custom Slides" in navigation
3. Creates new presentation with title
4. Editor opens with one default slide
5. User adds/edits slides:
   - Change title and body
   - Adjust font size and color
   - Toggle bold/italic
   - Drag to reorder
6. Changes auto-save to Supabase
7. Live preview updates instantly
8. User can present or export

---

## 5. Future Enhancements

### AI Features
- **Auto Sermon Generator** - Input topic, get full sermon outline
- **Auto Song Lyrics** - Search song title, get formatted lyrics
- **Sermon Assistant** - AI suggests verses for sermon points
- **Smart Recommendations** - "People also searched for..."

### Custom Slides PRO Features
- **Rich Background Media**
  - Upload images to Supabase Storage
  - Video backgrounds (YouTube embeds)
  - Gradient creators
- **Advanced Themes**
  - Pre-made professional themes
  - Custom CSS per slide
  - Animation effects
- **Collaboration**
  - Share presentations with team
  - Real-time co-editing
  - Comments on slides
- **Templates**
  - Save presentations as templates
  - Community template library
  - Import/export templates

---

## 6. Deployment Checklist

### Environment Variables Required

**Frontend (.env)**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Edge Functions (Supabase Secrets)**
```
GEMINI_API_KEY=your-gemini-api-key
```

### Edge Function Deployment

Edge function `ai-bible-search` is already deployed. If you need to redeploy:

```bash
# NOT NEEDED - Function is already deployed
# This is just for reference
```

### Database Setup

All migrations are complete:
- ✅ `presentations` table created
- ✅ `slides` table created
- ✅ RLS policies configured
- ✅ Indexes optimized
- ✅ Triggers for updated_at

### Build & Deploy

1. Build the application:
   ```bash
   npm run build
   ```

2. Upload `dist` folder to Hostinger `public_html`

3. Ensure `.htaccess` is uploaded (for routing)

4. Test the deployment:
   - Visit bibleslide.org
   - Log in as user
   - Test AI Bible Search
   - Create a custom presentation
   - Add and edit slides
   - Verify drag-and-drop works

---

## 7. Troubleshooting

### AI Search Not Working

**Symptom:** "AI service not configured" error

**Solution:**
- Gemini API key is already configured as a Supabase secret
- Edge function is deployed
- No action needed from you

**Fallback:** Users can still use standard Bible API search

### Custom Presentations Not Saving

**Symptom:** Slides disappear after refresh

**Solution:**
1. Check if user is logged in (auth required)
2. Verify RLS policies in Supabase dashboard
3. Check browser console for errors
4. Ensure Supabase connection is working

### Drag-and-Drop Not Working

**Symptom:** Cannot reorder slides

**Solution:**
- Ensure mouse/touch events are not blocked
- Try refreshing the page
- Check if slide_order updates in database

---

## 8. Key Files Modified

### New Files Created
- `supabase/functions/ai-bible-search/index.ts` - Gemini integration
- `src/components/AIBibleSearch.tsx` - AI search interface
- `src/components/CustomPresentationBuilder.tsx` - Presentation list
- `src/components/CustomSlideEditor.tsx` - Slide editor with live preview

### Modified Files
- `src/App.tsx` - Added routing and navigation
- `supabase/migrations/*` - Database schema

### Database Migrations
- `add_slides_table_and_enhance_presentations.sql` - Schema creation

---

## 9. Performance Considerations

### Database Queries
- Presentations: Indexed by user_id and updated_at
- Slides: Indexed by presentation_id and slide_order
- Real-time updates use Supabase client

### API Costs
- **Gemini API** - Only for topic search (~5-10 verses per query)
- **Bible API** - Free for verse lookups
- **Supabase** - Free tier should handle hundreds of users

### Optimization Tips
- Cache repeated Gemini queries (future enhancement)
- Lazy load presentations (implemented)
- Debounce slide updates (already implemented with auto-save)

---

## 10. Competitive Advantages

### vs FreeShow
✅ AI-powered Bible search (FreeShow doesn't have this)
✅ Cloud-based with auto-save
✅ Multilingual AI support
✅ Mobile-responsive editor
✅ No desktop app required

### vs ProPresenter
✅ Free and open-source
✅ Web-based (access anywhere)
✅ AI assistance included
✅ Easier learning curve
✅ Better for small churches

### vs PowerPoint
✅ Purpose-built for church
✅ AI Bible search
✅ Verse formatting automatic
✅ Remote control built-in
✅ No software installation

---

## Support & Maintenance

For questions or issues:
- Email: support@bibleslide.org
- GitHub: (add repository link)
- Documentation: This file

---

## Conclusion

BibleSlide is now a complete AI-powered church presentation platform with:
- ✅ AI Bible search with Gemini
- ✅ Custom presentation builder
- ✅ Professional slide editor
- ✅ Drag-and-drop ordering
- ✅ Real-time collaboration-ready
- ✅ Secure cloud storage
- ✅ Multilingual support

The platform is production-ready and positioned to revolutionize church presentations.
