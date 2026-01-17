# Digest Cron Setup - Dashboard Method

## Option 2: Supabase Dashboard (Easiest)

### Step 1: Get Your Environment Variables

Go to your Supabase project dashboard:

1. **Project URL**: 
   - Go to **Settings** → **API**
   - Copy the **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - Extract just the project reference: `abcdefgh`

2. **Service Role Key**:
   - Go to **Settings** → **API**
   - Copy the **service_role** key (the secret one, NOT anon public)
   - It looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 2: Create Cron Job in Dashboard

1. Go to **Database** → **Cron Jobs** in left sidebar
2. Click **Create a new cron job** button
3. Fill in the form:

**Name**: `digest-processor-hourly`

**Schedule**: `0 * * * *`
(This means: every hour at minute 0)

**Command**: Paste this SQL, replacing YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY:

```sql
SELECT net.http_post(
  url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/digest-processor',
  headers := jsonb_build_object(
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
    'Content-Type', 'application/json'
  )
);
```

### Step 3: Example with Real Values

If your values are:
- Project URL: `https://abcdefgh.supabase.co`
- Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYxNjIzOTAyMn0.xxxxx`

Then your command would be:

```sql
SELECT net.http_post(
  url := 'https://abcdefgh.supabase.co/functions/v1/digest-processor',
  headers := jsonb_build_object(
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYxNjIzOTAyMn0.xxxxx',
    'Content-Type', 'application/json'
  )
);
```

4. Click **Create** or **Save**

### Step 4: Verify It's Working

1. Wait for the next hour (or trigger manually if option available)
2. Go to **Database** → **Cron Jobs** → Click on `digest-processor-hourly`
3. Check the **Run History** tab to see execution logs
4. Check your `pending_moments` table to see if messages were sent:

```sql
SELECT * FROM pending_moments WHERE sent = true ORDER BY sent_at DESC LIMIT 10;
```

### Step 5: Test Manually (Optional)

To test immediately without waiting for the cron schedule:

1. Go to **SQL Editor**
2. Run this query (with your actual values):

```sql
SELECT net.http_post(
  url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/digest-processor',
  headers := jsonb_build_object(
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
    'Content-Type', 'application/json'
  )
);
```

3. Check the response in the Results panel
4. Check Edge Functions logs: **Edge Functions** → **digest-processor** → **Logs**

---

## Troubleshooting

### "Cron Jobs" menu not visible
- pg_cron might not be available on your Supabase plan
- Use Option 3 (GitHub Actions) instead

### Cron job runs but no digests sent
- Check Edge Functions logs for errors
- Verify `pending_moments` table has data with `sent = false`
- Verify `scheduled_for` timestamps are in the past
- Check WhatsApp credentials in Edge Function secrets

### How to delete/recreate cron job
- Go to **Database** → **Cron Jobs**
- Click the trash icon next to `digest-processor-hourly`
- Create a new one with corrected values

---

## Schedule Options

Change the cron schedule to fit your needs:

- `0 * * * *` - Every hour at minute 0
- `0 18 * * *` - Every day at 6:00 PM
- `0 9,18 * * *` - Twice daily at 9 AM and 6 PM
- `*/30 * * * *` - Every 30 minutes
- `0 18 * * 1-5` - Weekdays only at 6 PM

Current setting: **Every hour** (to check for pending digests)
