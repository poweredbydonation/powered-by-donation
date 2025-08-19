-- Create platform_stats table for caching statistics
CREATE TABLE IF NOT EXISTS public.platform_stats (
    id SERIAL PRIMARY KEY,
    services_count INTEGER NOT NULL DEFAULT 0,
    justgiving_count INTEGER NOT NULL DEFAULT 0,
    everyorg_count INTEGER NOT NULL DEFAULT 0,
    acnc_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial row
INSERT INTO public.platform_stats (services_count, justgiving_count, everyorg_count, acnc_count)
VALUES (0, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_platform_stats_last_updated ON public.platform_stats (last_updated DESC);

-- Enable RLS
ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to platform stats" ON public.platform_stats
    FOR SELECT USING (true);

-- Create policy to allow service role to update stats
CREATE POLICY "Allow service role to update platform stats" ON public.platform_stats
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON public.platform_stats TO anon, authenticated;
GRANT ALL ON public.platform_stats TO service_role;
GRANT USAGE ON SEQUENCE platform_stats_id_seq TO service_role;