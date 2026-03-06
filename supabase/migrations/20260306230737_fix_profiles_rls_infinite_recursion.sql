/*
  # Fix profiles RLS infinite recursion

  The previous migration created a SELECT policy on public.profiles that
  contained an EXISTS subquery also reading public.profiles. This causes
  infinite recursion because evaluating the policy triggers itself.

  Fix: use the SECURITY DEFINER function is_admin() which bypasses RLS when
  checking admin status, breaking the recursive loop.
*/

DROP POLICY IF EXISTS "Users and admins can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins can update profiles" ON public.profiles;

CREATE POLICY "Users and admins can read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR
    (select public.is_admin())
  );

CREATE POLICY "Users and admins can update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR
    (select public.is_admin())
  )
  WITH CHECK (
    (select auth.uid()) = id
    OR
    (select public.is_admin())
  );
