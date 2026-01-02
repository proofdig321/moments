-- Test queries to validate RBAC and campaigns behavior
-- Run as service_role to seed test users and roles

-- 1) Insert an admin role (service role)
INSERT INTO admin_roles (user_id, role) VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'superadmin') ON CONFLICT DO NOTHING;

-- 2) As a test editor user, attempt to insert a campaign
-- Run this using a JWT for user '00000000-0000-0000-0000-000000000002'
-- Expected: INSERT succeeds if user has 'editor' role
-- Example:
-- INSERT INTO campaigns (title, description, owner_id) VALUES ('Test Campaign', 'Testing', '00000000-0000-0000-0000-000000000002');

-- 3) As an anonymous user, verify you can SELECT published campaigns
-- SELECT * FROM campaigns WHERE status = 'published';

-- 4) As non-admin user, verify you cannot modify system_settings
-- UPDATE system_settings SET setting_value = 'x' WHERE setting_key = 'app_name'; -- should be denied unless superadmin

-- 5) Verify moments visibility: only published or admin-visible
-- SELECT * FROM moments WHERE status = 'broadcasted';
