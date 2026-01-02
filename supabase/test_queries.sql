-- Test Queries for Unami Foundation Moments Database
-- Run these after migration to validate functionality

-- Test 1: Verify all tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('sponsors', 'moments', 'broadcasts', 'subscriptions', 'system_settings', 'admin_roles', 'audit_log', 'webhook_tokens')
ORDER BY table_name;

-- Test 2: Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('sponsors', 'moments', 'broadcasts', 'subscriptions', 'system_settings', 'admin_roles', 'audit_log', 'webhook_tokens');

-- Test 3: Verify indexes exist
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('sponsors', 'moments', 'broadcasts', 'subscriptions', 'system_settings', 'admin_roles', 'audit_log', 'webhook_tokens')
ORDER BY tablename, indexname;

-- Test 4: Check default data
SELECT 'sponsors' as table_name, count(*) as record_count FROM sponsors
UNION ALL
SELECT 'system_settings', count(*) FROM system_settings
UNION ALL
SELECT 'admin_roles', count(*) FROM admin_roles
UNION ALL
SELECT 'webhook_tokens', count(*) FROM webhook_tokens;

-- Test 5: Verify functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('check_admin_role', 'log_audit_event', 'verify_webhook_token', 'get_setting', 'update_setting')
ORDER BY routine_name;

-- Test 6: Check policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test 7: Verify triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'audit_%'
ORDER BY event_object_table, trigger_name;

-- Test 8: Test admin role function
SELECT check_admin_role('content_admin') as has_content_admin_role;
SELECT check_admin_role('super_admin') as has_super_admin_role;
SELECT check_admin_role('moderator') as has_moderator_role;

-- Test 9: Test webhook verification
SELECT verify_webhook_token('whatsapp_gateway_verify_2024_secure', 'whatsapp') as webhook_valid;

-- Test 10: Test system settings functions
SELECT get_setting('app_name') as app_name;
SELECT get_setting('whatsapp_number') as whatsapp_number;

-- Test 11: Verify constraints
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND table_name IN ('sponsors', 'moments', 'broadcasts', 'subscriptions', 'system_settings', 'admin_roles')
  AND constraint_type IN ('CHECK', 'FOREIGN KEY', 'UNIQUE')
ORDER BY table_name, constraint_type;

-- Test 12: Check column types and constraints
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('sponsors', 'moments', 'broadcasts', 'subscriptions', 'system_settings', 'admin_roles', 'audit_log', 'webhook_tokens')
ORDER BY table_name, ordinal_position;