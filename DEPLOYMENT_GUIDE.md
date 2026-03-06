# BibleSlide Deployment Guide

## What We Fixed

Your blank screen issue has been resolved by implementing the following improvements:

### 1. Loading Screen
- Added a beautiful animated loading screen that displays immediately while the app initializes
- The loading screen automatically disappears once React mounts successfully

### 2. Error Handling
- Created an ErrorBoundary component that catches any React errors
- Shows a user-friendly error message instead of a blank screen
- Provides a reload button and contact information if issues persist

### 3. Supabase Resilience
- Enhanced Supabase client initialization with proper error handling
- The app now works even if Supabase is temporarily unavailable
- Added fallback configuration to prevent crashes

### 4. Apache/Hostinger Routing
- Created `.htaccess` file with proper routing rules for Apache servers
- All routes now properly redirect to index.html (required for React Router)
- Added GZIP compression and browser caching for better performance

## Deploying to Production (Hostinger)

### Step 1: Build Your Application

Run this command locally:

```bash
npm run build
```

This creates a `dist` folder with all production-ready files.

### Step 2: Upload to Hostinger

1. Log into your Hostinger control panel
2. Open **File Manager**
3. Navigate to `public_html` (or your domain's root folder)
4. **Delete all old files** in this folder
5. Upload **everything** from the `dist` folder to `public_html`

Your folder structure should look like:
```
public_html/
  ├── .htaccess          ← Important for routing!
  ├── index.html
  ├── manifest.json
  ├── serviceWorker.js
  └── assets/
      ├── index-[hash].js
      ├── index-[hash].css
      └── [other files]
```

### Step 3: Configure Environment Variables

Make sure these environment variables are set in your production environment:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

**Note:** These are already embedded in your built files, so you don't need to configure them on the server.

### Step 4: Test Your Deployment

1. Visit `https://bibleslide.org`
2. You should see the loading screen briefly, then your app loads
3. Test navigation between different pages
4. Verify that refreshing any page works (doesn't give 404)

## Troubleshooting

### Still Seeing Blank Screen?

1. **Clear your browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser console for errors (F12 → Console tab)
3. Verify `.htaccess` file was uploaded correctly
4. Make sure all files from `dist` folder were uploaded

### 404 Errors on Page Refresh?

This means `.htaccess` is not working:
- Ensure the file starts with a dot: `.htaccess` (not `htaccess`)
- Check if Apache `mod_rewrite` is enabled on your server
- Contact Hostinger support if needed

### JavaScript Not Loading?

1. Check if asset files are in the `assets` folder
2. Verify file permissions (should be 644 for files, 755 for folders)
3. Clear Hostinger's cache if available

## Maintenance

### Updating Your Site

Every time you make changes:

1. Run `npm run build` locally
2. Upload new files from `dist` to `public_html`
3. Clear browser cache to see changes

### Monitoring

- Check your website daily for the first week
- Monitor browser console for any errors
- Test on different devices and browsers

## Performance Tips

Your `.htaccess` file now includes:
- GZIP compression for faster loading
- Browser caching to reduce server load
- Security headers for better protection

## Support

If issues persist after following this guide:

- Check browser console for specific error messages
- Contact: support@bibleslide.org
- Include: browser type, error messages, and screenshots

## Files Modified

- `index.html` - Added loading screen
- `src/main.tsx` - Added error boundary wrapper
- `src/components/ErrorBoundary.tsx` - New error handling component
- `src/supabaseClient.ts` - Enhanced error handling
- `public/.htaccess` - Created routing rules
- `server.ts` - Fixed bonjour-service initialization

Your BibleSlide app is now production-ready and resilient!
