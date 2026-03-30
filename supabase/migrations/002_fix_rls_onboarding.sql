-- Migration 002: Fix RLS policies for onboarding bootstrap
-- 
-- Problems fixed:
-- 1. users table policy used a self-referencing subquery that deadlocked
--    for brand-new users who have no row yet.
-- 2. businesses table had no INSERT policy — blocked onboarding users
--    from creating their first business.
-- 3. onboarding_complete column was missing from users table.

-- ──────────────────────────────────────────────────────────────────────
-- 1. Add missing onboarding_complete column (idempotent)
-- ──────────────────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- ──────────────────────────────────────────────────────────────────────
-- 2. Fix users RLS policies
--    OLD: USING (business_id = (SELECT business_id FROM users WHERE id = auth.uid()))
--         → deadlocks: new user has no row → subquery returns NULL → blocked
--    NEW:
--      SELECT / UPDATE  → own row only (id = auth.uid())
--      INSERT           → own row only (id = auth.uid())  [handled by admin client in callback]
--      Same-business    → read colleagues in same business
-- ──────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "business_isolation" ON users;

-- Allow a user to always read and update their own row
CREATE POLICY "users_own_row"
  ON users
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow users to read other users in the same business (e.g. team list)
CREATE POLICY "users_same_business"
  ON users
  FOR SELECT
  USING (
    business_id IS NOT NULL
    AND business_id = (
      SELECT business_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- ──────────────────────────────────────────────────────────────────────
-- 3. Fix businesses RLS policies
--    OLD: USING (id = (SELECT business_id FROM users WHERE id = auth.uid()))
--         → new user has no business_id → subquery returns NULL → INSERT blocked
--    NEW:
--      INSERT  → any authenticated user can create a business (onboarding)
--      SELECT / UPDATE / DELETE → user's own business only
-- ──────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "business_isolation" ON businesses;

-- Any signed-in user can create a new business during onboarding
CREATE POLICY "businesses_insert_own"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- After creation, users can only see/edit the business they belong to
CREATE POLICY "businesses_own"
  ON businesses
  FOR SELECT
  USING (
    id = (
      SELECT business_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "businesses_update_own"
  ON businesses
  FOR UPDATE
  USING (
    id = (
      SELECT business_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  )
  WITH CHECK (
    id = (
      SELECT business_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- ──────────────────────────────────────────────────────────────────────
-- 4. All other tables — same pattern, no changes needed as those tables
--    always have a business_id FK that the user already owns before
--    any data is written.
-- ──────────────────────────────────────────────────────────────────────
