# Google Gemini API Setup Guide for BibleSlide

## Overview

The AI Bible Search feature uses Google's Gemini AI to provide intelligent verse search and topic-based Bible exploration. This guide explains how to obtain and configure your Gemini API key.

---

## Important Note

**The Gemini API key is already configured in your Supabase project as a secret.** You don't need to do anything unless you want to use your own API key.

---

## Getting Your Gemini API Key (Optional)

If you want to use your own Gemini API key:

### Step 1: Visit Google AI Studio

Go to: https://aistudio.google.com/

### Step 2: Sign In

- Sign in with your Google account
- Accept the terms of service if prompted

### Step 3: Create API Key

1. Click on "Get API Key" in the top menu
2. Choose "Create API key"
3. Select a Google Cloud project (or create new one)
4. Your API key will be generated

### Step 4: Copy Your API Key

Your key will look like: `AIzaSyC...` (39 characters)

**Important:** Keep this key secret! Never share it or commit it to version control.

---

## Configuring Gemini API Key in Supabase

### Method 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to: **Project Settings** → **Edge Functions** → **Secrets**
3. Click "Add secret"
4. Name: `GEMINI_API_KEY`
5. Value: Your API key (paste it)
6. Click "Save"

The edge function will automatically use this secret.

### Method 2: Using Supabase CLI (Advanced)

```bash
# Set the secret
supabase secrets set GEMINI_API_KEY=your_api_key_here

# Verify it was set
supabase secrets list
```

---

## Verifying Setup

### Test the AI Search

1. Go to bibleslide.org
2. In the AI Bible Search section:
   - Try a verse search: "John 3:16"
   - Try a topic search: "verses about hope"
3. You should see results appear

### Check Edge Function Logs

1. Go to Supabase Dashboard
2. Navigate to: **Edge Functions** → `ai-bible-search`
3. Click on "Logs"
4. Look for successful requests

---

## API Usage & Costs

### Free Tier

Google Gemini offers a generous free tier:
- **60 requests per minute**
- **1,500 requests per day**
- **1 million requests per month**

For a small to medium church, this is more than enough.

### Paid Tier

If you exceed the free tier:
- **Pay-as-you-go pricing**
- Very affordable for most use cases
- Can set budget caps in Google Cloud Console

### Monitoring Usage

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Navigate to: **APIs & Services** → **Dashboard**
4. View Gemini API usage

---

## Security Best Practices

### Do's ✅
- Keep API key in Supabase secrets only
- Never expose in frontend code
- Use Edge Functions for API calls
- Monitor usage regularly
- Set up billing alerts in Google Cloud

### Don'ts ❌
- Don't commit API key to Git
- Don't store in `.env` file in production
- Don't share key publicly
- Don't use same key for multiple projects
- Don't skip usage monitoring

---

## Troubleshooting

### Error: "API key not configured"

**Solution:** Add `GEMINI_API_KEY` to Supabase secrets

### Error: "Quota exceeded"

**Solution:**
- Check usage in Google Cloud Console
- Upgrade to paid tier if needed
- Wait for quota reset (resets at midnight Pacific Time)

### Error: "API key invalid"

**Solution:**
- Verify key is correct (no extra spaces)
- Regenerate key in Google AI Studio
- Update Supabase secret with new key

### Error: "Request timeout"

**Solution:**
- Check internet connection
- Verify Gemini API status: https://status.cloud.google.com/
- Try again in a few minutes

---

## Alternative: Using Free Fallback

If you don't want to use Gemini or have quota issues:

The app automatically falls back to:
- Standard Bible API for verse searches
- Manual paste for custom text

Users will see a message: "AI search temporarily unavailable. Please use standard Bible search."

---

## Advanced Configuration

### Custom Gemini Model

To use a different Gemini model, edit:

`supabase/functions/ai-bible-search/index.ts`

Change line:
```typescript
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
```

Available models:
- `gemini-pro` (default, best for text)
- `gemini-pro-vision` (for images)
- `gemini-1.5-pro` (latest, more accurate)

### Adjusting Response Length

In the edge function, modify `maxOutputTokens`:

```typescript
generationConfig: {
  temperature: 0.4,
  topK: 32,
  topP: 1,
  maxOutputTokens: 2048, // Increase for longer responses
}
```

---

## Support

If you need help:
- Email: support@bibleslide.org
- Check Edge Function logs in Supabase
- Review this guide for common issues

---

## Summary Checklist

- [x] Gemini API key already configured
- [x] Edge function deployed
- [x] CORS configured correctly
- [x] Error handling in place
- [x] Free tier should be sufficient
- [x] Automatic fallback working

**You're all set!** The AI Bible Search is ready to use.
