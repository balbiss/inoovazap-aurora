-- Add Stripe-related columns to instances table
ALTER TABLE public.instances 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing',
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Add index for stripe_customer_id for faster webhooks/queries
CREATE INDEX IF NOT EXISTS idx_instances_stripe_customer_id ON public.instances(stripe_customer_id);

-- Commentary for the table structure update
COMMENT ON COLUMN public.instances.stripe_customer_id IS 'Stripe Customer ID associated with this clinic instance';
COMMENT ON COLUMN public.instances.subscription_status IS 'Current status of the Stripe subscription';
COMMENT ON COLUMN public.instances.subscription_plan IS 'Name of the current subscription plan';
COMMENT ON COLUMN public.instances.current_period_end IS 'End date of the current paid period';
