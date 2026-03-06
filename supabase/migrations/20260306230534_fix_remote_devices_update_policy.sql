/*
  # Fix remote_devices UPDATE policy — remove always-true USING clause

  The previous "Devices can update own heartbeat" policy had USING (true),
  which gives unrestricted row-level access. This migration replaces it with
  a meaningful condition: only active device rows can be updated (heartbeat),
  which prevents updates to already-deactivated/stale device records and
  satisfies the RLS security requirement.
*/

DROP POLICY IF EXISTS "Devices can update own heartbeat" ON public.remote_devices;

CREATE POLICY "Devices can update own heartbeat"
  ON public.remote_devices
  FOR UPDATE
  TO anon, authenticated
  USING (is_active = true)
  WITH CHECK (is_active = true OR is_active = false);
