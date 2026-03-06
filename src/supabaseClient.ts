import { createClient, SupabaseClient } from "@supabase/supabase-js";

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

let supabase: SupabaseClient;

try {
  let rawUrl = import.meta.env?.VITE_SUPABASE_URL || "https://kqlhlmoaplnckkmdxsqo.supabase.co";
  const supabaseKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxbGhsbW9hcGxuY2trbWR4c3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MDcxMTcsImV4cCI6MjA4NzM4MzExN30.CIqXcDgSowFzaDeTA07ySzv7dJB29IRYnwQy09CZqKw").trim();

  rawUrl = rawUrl.trim();
  if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    rawUrl = `https://${rawUrl}`;
  }

  const supabaseUrl = rawUrl;

  if (!isValidUrl(supabaseUrl)) {
    console.warn("Invalid Supabase URL detected, using fallback:", supabaseUrl);
  }

  supabase = createClient(
    isValidUrl(supabaseUrl) ? supabaseUrl : "https://kqlhlmoaplnckkmdxsqo.supabase.co",
    supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'x-application-name': 'bibleslide'
        }
      }
    }
  );

  console.log("Supabase client initialized successfully");
} catch (error) {
  console.error("Failed to initialize Supabase client:", error);
  supabase = createClient(
    "https://kqlhlmoaplnckkmdxsqo.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxbGhsbW9hcGxuY2trbWR4c3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MDcxMTcsImV4cCI6MjA4NzM4MzExN30.CIqXcDgSowFzaDeTA07ySzv7dJB29IRYnwQy09CZqKw"
  );
}

export { supabase };
