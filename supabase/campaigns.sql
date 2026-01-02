-- Campaigns table for sponsored content management

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  sponsor_id uuid,
  budget numeric DEFAULT 0,
  target_regions text[] DEFAULT '{}',
  target_categories text[] DEFAULT '{}',
  media_urls text[] DEFAULT '{}',
  scheduled_at timestamptz,
  created_by uuid,
  status text DEFAULT 'draft' CHECK (status IN ('draft','pending_review','approved','scheduled','published','rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_sponsor ON public.campaigns (sponsor_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns (status);

-- Basic policy: only admins/editors can modify (example)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'campaigns') THEN
    EXECUTE 'ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY';
    EXECUTE $$
    CREATE POLICY IF NOT EXISTS "admins_edit_campaigns"
      ON public.campaigns
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_roles ar WHERE ar.user_id::text = auth.uid() AND ar.role IN (''editor'',''admin'',''superadmin'')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.admin_roles ar WHERE ar.user_id::text = auth.uid() AND ar.role IN (''editor'',''admin'',''superadmin'')
        )
      );
    $$;
  END IF;
END
$$;
