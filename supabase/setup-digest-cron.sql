-- ============================================
-- DIGEST CRON SETUP - READY TO RUN
-- ============================================

-- STEP 1: Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- STEP 2: Schedule the digest processor (runs every hour)
SELECT cron.schedule(
  'digest-processor-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bxmdzcxejcxbinghtyfw.supabase.co/functions/v1/digest-processor',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4bWR6Y3hlamN4YmluZ2h0eWZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE3MzM5NiwiZXhwIjoyMDgzNzQ5Mzk2fQ.rcm_AT1o0Wiazvy9Pl6kjKc5jogHQKZyTfOxEX8v3Iw',
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- STEP 3: Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'digest-processor-hourly';

-- STEP 4: Check cron job execution history (after first run)
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'digest-processor-hourly')
ORDER BY start_time DESC 
LIMIT 10;

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- To delete/recreate the cron job:
-- SELECT cron.unschedule('digest-processor-hourly');

-- To test manually (trigger digest processor now):
/*
SELECT net.http_post(
  url := 'https://bxmdzcxejcxbinghtyfw.supabase.co/functions/v1/digest-processor',
  headers := jsonb_build_object(
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4bWR6Y3hlamN4YmluZ2h0eWZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE3MzM5NiwiZXhwIjoyMDgzNzQ5Mzk2fQ.rcm_AT1o0Wiazvy9Pl6kjKc5jogHQKZyTfOxEX8v3Iw',
    'Content-Type', 'application/json'
  )
);
*/
