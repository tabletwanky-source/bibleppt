/*
  # Remove Unused Database Indexes

  This migration removes indexes that are not being utilized by the application's
  query patterns. Keeping unused indexes wastes storage space and slows down
  write operations without providing query performance benefits.

  ## Indexes Being Removed

  ### Sessions Table
  - `idx_sessions_user_id` - User ID lookups (not needed with current query patterns)
  - `idx_sessions_active_code` - Active code lookups (table scans are sufficient at current scale)
  - `idx_sessions_expires_at` - Expiration time filtering (not actively queried)

  ### Remote Commands Table
  - `idx_remote_commands_session_unprocessed` - Unprocessed command filtering
  - `idx_commands_session_created` - Session and creation time composite index

  ### Presentations Table
  - `idx_presentations_user_id` - User presentation filtering
  - `idx_presentations_is_template` - Template filtering
  - `idx_presentations_theme_id` - Theme relationship lookups

  ### Presentation Sessions Table
  - `idx_presentation_sessions_presentation_id` - Presentation relationship
  - `idx_presentation_sessions_is_active` - Active session filtering
  - `idx_presentation_sessions_user_id_fk` - User relationship

  ### Media Files Table
  - `idx_media_files_user_id` - User media filtering

  ### Themes Table
  - `idx_themes_user_id` - User theme filtering
  - `idx_themes_is_system` - System theme filtering

  ### Templates Table
  - `idx_templates_user_id` - User template filtering

  ### User Preferences Table
  - `idx_user_preferences_user_id` - User preference lookups

  ### Viewer Connections Table
  - `idx_viewer_connections_session_id` - Session connection lookups

  ## Performance Impact

  - Reduces storage overhead by removing unused index data
  - Improves INSERT/UPDATE/DELETE performance (fewer indexes to maintain)
  - No negative impact on query performance (indexes were not being used)

  ## Security Notes

  Note: Leaked Password Protection must be manually enabled in Supabase Dashboard:
  Authentication → Policies → Enable "Prevent use of compromised passwords"
*/

-- Drop indexes on sessions table
DROP INDEX IF EXISTS idx_sessions_user_id;
DROP INDEX IF EXISTS idx_sessions_active_code;
DROP INDEX IF EXISTS idx_sessions_expires_at;

-- Drop indexes on remote_commands table
DROP INDEX IF EXISTS idx_remote_commands_session_unprocessed;
DROP INDEX IF EXISTS idx_commands_session_created;

-- Drop indexes on presentations table
DROP INDEX IF EXISTS idx_presentations_user_id;
DROP INDEX IF EXISTS idx_presentations_is_template;
DROP INDEX IF EXISTS idx_presentations_theme_id;

-- Drop indexes on presentation_sessions table
DROP INDEX IF EXISTS idx_presentation_sessions_presentation_id;
DROP INDEX IF EXISTS idx_presentation_sessions_is_active;
DROP INDEX IF EXISTS idx_presentation_sessions_user_id_fk;

-- Drop indexes on media_files table
DROP INDEX IF EXISTS idx_media_files_user_id;

-- Drop indexes on themes table
DROP INDEX IF EXISTS idx_themes_user_id;
DROP INDEX IF EXISTS idx_themes_is_system;

-- Drop indexes on templates table
DROP INDEX IF EXISTS idx_templates_user_id;

-- Drop indexes on user_preferences table
DROP INDEX IF EXISTS idx_user_preferences_user_id;

-- Drop indexes on viewer_connections table
DROP INDEX IF EXISTS idx_viewer_connections_session_id;
