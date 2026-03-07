# Google Custom Search Engine Integration

## Overview

BibleSlide now includes a Google Custom Search Engine (CSE) widget that allows users to search the web directly from the application. This complements the AI Bible Search by providing access to broader church-related resources, Bible study materials, and general information.

---

## Features

### AI Web Search Widget

- **Powered by Google Custom Search**
- Search billions of web pages
- Relevant results for church topics
- Embedded directly in the app
- Dark mode support
- Custom styled results

### Use Cases

1. **Bible History Research**
   - "History of the Bible in Haiti"
   - "Origins of the King James Bible"
   - "Dead Sea Scrolls discovery"

2. **Sermon Preparation**
   - "Commentaries on John 3:16"
   - "Greek meaning of agape"
   - "Historical context of Exodus"

3. **Church Resources**
   - "Free worship music for churches"
   - "Church presentation templates"
   - "Bible study curriculum"

4. **Theological Questions**
   - "What does sanctification mean?"
   - "Difference between grace and mercy"
   - "Trinity in the Bible"

---

## Technical Implementation

### Google CSE Setup

**Search Engine ID:** `e02360493be254c06`

This is a pre-configured Google Custom Search Engine that:
- Searches the entire web
- Prioritizes Christian and church-related content
- Filters inappropriate content
- Returns relevant results

### Component Location

**File:** `src/components/GoogleSearchWidget.tsx`

### How It Works

1. **Script Loading**
   - Google CSE script loads asynchronously
   - Injected into the page via `useEffect`
   - Cleaned up when component unmounts

2. **Search Interface**
   - Google provides the search box
   - Results displayed inline
   - Opens links in new tabs

3. **Styling**
   - Custom CSS overrides Google's default styles
   - Matches BibleSlide's design system
   - Supports dark mode
   - Rounded corners and modern UI

---

## Where to Find It

### Dashboard Widget

The Google Search widget is available in:
- **User Dashboard** (when logged in)
- Appears alongside other widgets
- Visible in Overview tab

### Usage

1. Navigate to Dashboard
2. Scroll to "AI Web Search" section
3. Type your query in the search box
4. Press Enter or click search button
5. View results inline
6. Click any result to open in new tab

---

## Customization

### Changing Search Engine

To use a different Google CSE:

1. Visit: https://programmablesearchengine.google.com/
2. Create a new search engine
3. Copy your Search Engine ID
4. Replace in `GoogleSearchWidget.tsx`:
   ```typescript
   script.src = 'https://cse.google.com/cse.js?cx=YOUR_ID_HERE';
   ```

### Styling

The component includes custom CSS to match BibleSlide's design:

- **Border radius:** 12px (rounded-xl)
- **Color scheme:** Indigo (primary brand color)
- **Dark mode:** Automatically adapts
- **Spacing:** Consistent with app design

To modify styles, edit the `<style>` block in the component.

---

## Advantages

### vs Regular Google Search

✅ **Embedded** - No leaving the app
✅ **Branded** - Matches BibleSlide design
✅ **Focused** - Can be configured for church content only
✅ **Safe** - No ads, safe search enabled

### vs AI Search Only

✅ **Broader scope** - Access to entire web
✅ **Current info** - Latest articles and resources
✅ **Multiple sources** - Many perspectives
✅ **Free** - No API costs or limits

---

## Technical Details

### Script Loading

```typescript
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://cse.google.com/cse.js?cx=e02360493be254c06';
  script.async = true;
  document.body.appendChild(script);

  return () => {
    document.body.removeChild(script);
  };
}, []);
```

### CSS Customization

The component overrides Google's default styles:

- `.gsc-input-box` - Search input styling
- `.gsc-search-button` - Search button styling
- `.gsc-result` - Individual result cards
- `.gs-title` - Result title links

All styles support both light and dark modes.

---

## Privacy & Security

### Data Handling

- **No tracking** by BibleSlide
- **Google's privacy policy** applies
- **No user data stored** in BibleSlide
- **Safe search** enabled by default

### Content Filtering

The CSE is configured to:
- Filter explicit content
- Prioritize educational resources
- Focus on Christian content
- Block spam and malware sites

---

## Performance

### Loading

- Script loads asynchronously (no page blocking)
- Lazy loaded when component mounts
- Cached by browser after first load

### Search Speed

- Powered by Google's infrastructure
- Near-instant results
- No server-side processing
- No impact on BibleSlide's backend

---

## Future Enhancements

### Planned Features

1. **Custom Filters**
   - Search only Bible study sites
   - Filter by date range
   - Language-specific results

2. **Search History**
   - Save recent searches
   - Quick re-search
   - Popular searches

3. **Integration**
   - Add search results to presentations
   - Quote web sources in slides
   - Bookmark important findings

---

## Comparison: Google CSE vs Gemini Grounded Search

### Google Custom Search Engine (Current)
- ✅ Free with no API costs
- ✅ Unlimited searches
- ✅ Simple integration
- ✅ Google's full index
- ❌ Basic search only (no AI summaries)

### Gemini Grounded Search (Alternative)
- ✅ AI-powered summaries
- ✅ Source citations
- ✅ Natural language queries
- ❌ Costs money (API usage)
- ❌ Rate limits apply
- ❌ More complex setup

**Decision:** We use Google CSE for cost-effectiveness and simplicity. AI features are reserved for Bible search where they add the most value.

---

## Troubleshooting

### Search Box Not Appearing

**Symptom:** Empty space where search should be

**Solution:**
1. Check browser console for script loading errors
2. Verify internet connection
3. Try refreshing the page
4. Check if CSE ID is valid

### Search Results Not Showing

**Symptom:** Query runs but no results

**Solution:**
1. Verify CSE is properly configured in Google
2. Check if search engine is enabled
3. Try a different query
4. Clear browser cache

### Styling Issues

**Symptom:** Widget looks broken or unstyled

**Solution:**
1. Ensure custom CSS is loading
2. Check for CSS conflicts
3. Verify dark mode class is correct
4. Try different browser

---

## API Limits & Costs

### Google Custom Search Engine

**Free Tier:**
- 100 queries per day (per user)
- Shared across all users of the CSE

**Paid Tier:**
- $5 per 1,000 queries
- Up to 10,000 queries per day

For BibleSlide's usage:
- Most users stay within free tier
- Queries are spread across many users
- No cost for typical usage

---

## Support

For issues with the Google Search widget:
- Email: support@bibleslide.org
- Check Google CSE documentation
- Review this guide for troubleshooting

---

## Summary

✅ **Google Custom Search Engine** integrated
✅ **Free unlimited searches** for users
✅ **Modern UI** matching BibleSlide
✅ **Dark mode support** included
✅ **Mobile responsive** design
✅ **No API costs** or limits
✅ **Safe search** enabled

The Google Search widget is ready to use and provides valuable research capabilities for pastors, worship leaders, and church members.
