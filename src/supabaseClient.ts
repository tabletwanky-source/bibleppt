import { createClient } from "@supabase/supabase-js";

// Standard Vite environment variable access
let rawUrl = import.meta.env?.VITE_SUPABASE_URL || "https://kqlhlmoaplnckkmdxsqo.supabase.co";
const supabaseKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxbGhsbW9hcGxuY2trbWR4c3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MDcxMTcsImV4cCI6MjA4NzM4MzExN30.CIqXcDgSowFzaDeTA07ySzv7dJB29IRYnwQy09CZqKw").trim();

// Clean up the URL
rawUrl = rawUrl.trim();
if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `https://${rawUrl}`;
}

const supabaseUrl = rawUrl;

// Validate URL before creating client to avoid cryptic errors
const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

if (!isValidUrl(supabaseUrl)) {
  console.error("Invalid Supabase URL detected:", supabaseUrl);
}

export const supabase = createClient(
  isValidUrl(supabaseUrl) ? supabaseUrl : "https://kqlhlmoaplnckkmdxsqo.supabase.co", 
  supabaseKey
);
