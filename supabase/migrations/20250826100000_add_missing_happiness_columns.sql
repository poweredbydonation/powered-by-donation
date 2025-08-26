-- Add missing happiness tracking columns to users table
-- These columns are required by the happiness calculation functions

-- Add happiness columns to users table
ALTER TABLE public.users 
ADD COLUMN given_happiness integer DEFAULT 50,
ADD COLUMN received_happiness integer DEFAULT 50;

-- Add comments for documentation
COMMENT ON COLUMN public.users.given_happiness IS 'Happiness score for donations/services given by this user (0-100)';
COMMENT ON COLUMN public.users.received_happiness IS 'Happiness score for donations/services received by this user (0-100)';

-- Create indexes for performance
CREATE INDEX idx_users_given_happiness 
ON public.users USING btree (given_happiness);

CREATE INDEX idx_users_received_happiness 
ON public.users USING btree (received_happiness);