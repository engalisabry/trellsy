/*

-- Allow all access for testing (all commands)
CREATE POLICY "Allow all access for testing" ON "Organization"
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable insert for authenticated users
CREATE POLICY "Enable insert for authenticated users" ON "Organization"
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable read access for organization members
CREATE POLICY "Enable read access for organization members" ON "Organization"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "OrganizationMembers"
    WHERE "OrganizationMembers".organization_id = "Organization".id
      AND "OrganizationMembers".user_id = auth.uid()
  )
);

-- Enable update for organization admins
CREATE POLICY "Enable update for organization admins" ON "Organization"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "OrganizationMembers"
    WHERE "OrganizationMembers".organization_id = "Organization".id
      AND "OrganizationMembers".user_id = auth.uid()
      AND "OrganizationMembers".role = 'admin'
  )
);


-- Allow all access for testing (all commands)
CREATE POLICY "Allow all access for testing" ON "OrganizationMembers"
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable insert for authenticated users
CREATE POLICY "Enable insert for authenticated users" ON "OrganizationMembers"
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable read access for members
CREATE POLICY "Enable read access for members" ON "OrganizationMembers"
FOR SELECT
USING (
  user_id = auth.uid()
);

-- Enable update for organization admins
CREATE POLICY "Enable update for organization admins" ON "OrganizationMembers"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "OrganizationMembers" om
    WHERE om.organization_id = "OrganizationMembers".organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
  )
);


-- Public profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
FOR SELECT
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile." ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile." ON profiles
FOR UPDATE
USING (auth.uid() = id);

INSERT INTO profiles (id, full_name, avatar_url, email, created_at, updated_at)
SELECT
  u.id,
  u.raw_user_meta_data->>'full_name' AS full_name,
  u.raw_user_meta_data->>'avatar_url' AS avatar_url,
  u.email,
  u.created_at,
  u.updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;


*/
