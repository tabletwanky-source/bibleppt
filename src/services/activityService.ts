import { supabase } from "../supabaseClient";

export async function logUserActivity(userId: string) {
  if (!userId) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('activity_logs').upsert(
      { user_id: userId, date: today },
      { onConflict: 'user_id,date' }
    );
  } catch (err) {
    console.error("Error logging activity:", err);
  }
}
