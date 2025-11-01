-- Service Workflow Implementation
-- Add workflow states, new feedback system, and timeout management

-- Create new workflow enums
CREATE TYPE public.service_workflow_status AS ENUM (
    'service_requested',
    'service_request_accepted',
    'service_donation_received', 
    'service_feedback_recorded',
    'service_request_timeout',
    'service_donation_timeout',
    'service_feedback_timeout'
);

-- Separate enums for different rating contexts
CREATE TYPE public.service_rating AS ENUM (
    'Great',
    'Could be better',
    'Service not delivered'
);

CREATE TYPE public.donor_rating AS ENUM (
    'Great',
    'Could be better', 
    'No response'
);

-- Add new columns to service_requests table
ALTER TABLE public.service_requests 
ADD COLUMN workflow_status public.service_workflow_status DEFAULT 'service_requested',
ADD COLUMN accepted_at timestamp with time zone,
ADD COLUMN feedback_deadline timestamp with time zone,
ADD COLUMN donor_service_rating public.service_rating,
ADD COLUMN fundraiser_donor_rating public.donor_rating;

-- Remove old feedback columns that are being replaced
ALTER TABLE public.service_requests 
DROP COLUMN IF EXISTS donor_rates_fundraiser,
DROP COLUMN IF EXISTS donor_satisfaction,
DROP COLUMN IF EXISTS fundraiser_feedback_response,
DROP COLUMN IF EXISTS satisfaction_check_sent_at,
DROP COLUMN IF EXISTS donor_responded_at,
DROP COLUMN IF EXISTS fundraiser_feedback_sent_at,
DROP COLUMN IF EXISTS fundraiser_responded_at;

-- Update the status column to use workflow_status instead
-- First, migrate existing 'pending' status to new workflow system
UPDATE public.service_requests 
SET workflow_status = 'service_requested' 
WHERE status = 'pending';

-- Create workflow transition function
CREATE OR REPLACE FUNCTION public.transition_workflow_state(
    request_id uuid,
    new_status public.service_workflow_status,
    user_id uuid DEFAULT auth.uid()
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_request record;
    is_authorized boolean := false;
BEGIN
    -- Get current request with authorization check
    SELECT * INTO current_request 
    FROM service_requests 
    WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service request not found';
    END IF;
    
    -- Check authorization based on transition type
    CASE new_status
        WHEN 'service_request_accepted' THEN
            is_authorized := (current_request.fundraiser_id = user_id);
        WHEN 'service_donation_received' THEN
            is_authorized := true; -- System can update this
        WHEN 'service_feedback_recorded' THEN
            is_authorized := (current_request.donor_id = user_id OR current_request.fundraiser_id = user_id);
        WHEN 'service_request_timeout', 'service_donation_timeout', 'service_feedback_timeout' THEN
            is_authorized := true; -- System can update these
        ELSE
            is_authorized := false;
    END CASE;
    
    IF NOT is_authorized THEN
        RAISE EXCEPTION 'Unauthorized workflow transition';
    END IF;
    
    -- Validate state transitions
    CASE current_request.workflow_status
        WHEN 'service_requested' THEN
            IF new_status NOT IN ('service_request_accepted', 'service_request_timeout') THEN
                RAISE EXCEPTION 'Invalid transition from service_requested to %', new_status;
            END IF;
        WHEN 'service_request_accepted' THEN
            IF new_status NOT IN ('service_donation_received', 'service_donation_timeout') THEN
                RAISE EXCEPTION 'Invalid transition from service_request_accepted to %', new_status;
            END IF;
        WHEN 'service_donation_received' THEN
            IF new_status NOT IN ('service_feedback_recorded', 'service_feedback_timeout') THEN
                RAISE EXCEPTION 'Invalid transition from service_donation_received to %', new_status;
            END IF;
        ELSE
            RAISE EXCEPTION 'Cannot transition from final state %', current_request.workflow_status;
    END CASE;
    
    -- Perform the state transition with timestamp updates
    CASE new_status
        WHEN 'service_request_accepted' THEN
            UPDATE service_requests 
            SET workflow_status = new_status,
                accepted_at = NOW(),
                feedback_deadline = NOW() + INTERVAL '3 days'
            WHERE id = request_id;
        WHEN 'service_donation_received' THEN
            UPDATE service_requests 
            SET workflow_status = new_status,
                feedback_deadline = NOW() + INTERVAL '3 days'
            WHERE id = request_id;
        ELSE
            UPDATE service_requests 
            SET workflow_status = new_status
            WHERE id = request_id;
    END CASE;
    
    RETURN true;
END;
$$;

-- Create timeout checking functions
CREATE OR REPLACE FUNCTION public.check_workflow_timeouts()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    timeout_count integer := 0;
    row_count_temp integer := 0;
BEGIN
    -- Check request timeouts (3 days from creation)
    UPDATE service_requests 
    SET workflow_status = 'service_request_timeout'
    WHERE workflow_status = 'service_requested' 
      AND created_at < NOW() - INTERVAL '3 days';
    
    GET DIAGNOSTICS row_count_temp = ROW_COUNT;
    timeout_count := timeout_count + row_count_temp;
    
    -- Check donation timeouts (3 days from acceptance)
    UPDATE service_requests 
    SET workflow_status = 'service_donation_timeout'
    WHERE workflow_status = 'service_request_accepted' 
      AND accepted_at < NOW() - INTERVAL '3 days';
    
    GET DIAGNOSTICS row_count_temp = ROW_COUNT;
    timeout_count := timeout_count + row_count_temp;
    
    -- Auto-complete feedback (3 days from donation, default to 'Great')
    UPDATE service_requests 
    SET workflow_status = 'service_feedback_timeout',
        donor_service_rating = COALESCE(donor_service_rating, 'Great'::service_rating),
        fundraiser_donor_rating = COALESCE(fundraiser_donor_rating, 'Great'::donor_rating)
    WHERE workflow_status = 'service_donation_received' 
      AND feedback_deadline < NOW();
    
    GET DIAGNOSTICS row_count_temp = ROW_COUNT;
    timeout_count := timeout_count + row_count_temp;
    
    RETURN timeout_count;
END;
$$;

-- Create function to submit feedback
CREATE OR REPLACE FUNCTION public.submit_workflow_feedback(
    request_id uuid,
    user_id uuid,
    service_rating public.service_rating DEFAULT NULL,
    donor_rating public.donor_rating DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_request record;
    both_rated boolean;
BEGIN
    -- Get current request
    SELECT * INTO current_request 
    FROM service_requests 
    WHERE id = request_id
      AND workflow_status = 'service_donation_received';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service request not found or not in feedback state';
    END IF;
    
    -- Update ratings based on user role
    IF current_request.donor_id = user_id AND service_rating IS NOT NULL THEN
        UPDATE service_requests 
        SET donor_service_rating = service_rating
        WHERE id = request_id;
    ELSIF current_request.fundraiser_id = user_id AND donor_rating IS NOT NULL THEN
        UPDATE service_requests 
        SET fundraiser_donor_rating = donor_rating
        WHERE id = request_id;
    ELSE
        RAISE EXCEPTION 'Invalid user or rating type';
    END IF;
    
    -- Check if both parties have provided feedback
    SELECT 
        (donor_service_rating IS NOT NULL AND fundraiser_donor_rating IS NOT NULL)
        INTO both_rated
    FROM service_requests 
    WHERE id = request_id;
    
    -- If both rated, transition to completed state
    IF both_rated THEN
        UPDATE service_requests 
        SET workflow_status = 'service_feedback_recorded'
        WHERE id = request_id;
    END IF;
    
    RETURN true;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_service_requests_workflow_status ON service_requests(workflow_status);
CREATE INDEX idx_service_requests_feedback_deadline ON service_requests(feedback_deadline) 
WHERE feedback_deadline IS NOT NULL;
CREATE INDEX idx_service_requests_user_workflow ON service_requests(donor_id, workflow_status);
CREATE INDEX idx_service_requests_fundraiser_workflow ON service_requests(fundraiser_id, workflow_status);

-- Set up cron job for timeout automation (runs daily at 2 AM UTC)
SELECT cron.schedule('workflow-timeouts', '0 2 * * *', 'SELECT public.check_workflow_timeouts();');