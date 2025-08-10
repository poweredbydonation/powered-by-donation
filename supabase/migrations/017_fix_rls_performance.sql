-- Fix RLS performance issues by optimizing auth function calls
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row
-- Also consolidate multiple permissive policies to improve performance

-- Fix duplicate exchange rate policies (consolidate into one)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Exchange rates are readable by authenticated users" ON exchange_rates;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Keep only the public readable policy
DO $$ BEGIN
    -- Ensure we have the public policy
    CREATE POLICY "Exchange rates are publicly readable" ON exchange_rates
        FOR SELECT TO public
        USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Fix justgiving_charity_cache duplicate policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Authenticated can manage charity cache" ON justgiving_charity_cache;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Keep only the public view policy and add authenticated management
DO $$ BEGIN
    CREATE POLICY "Authenticated can manage charity cache" ON justgiving_charity_cache
        FOR ALL TO authenticated
        USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Users table: Optimize auth function calls
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON users;
    DROP POLICY IF EXISTS "Users can delete their own profile" ON users;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Recreate users policies with optimized auth calls
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT TO public
    WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE TO public
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can delete their own profile" ON users
    FOR DELETE TO public
    USING ((select auth.uid()) = id);

-- Services table: Optimize auth calls and consolidate policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone can view active services" ON services;
    DROP POLICY IF EXISTS "Users can view their own services" ON services;
    DROP POLICY IF EXISTS "Users can insert their own services" ON services;
    DROP POLICY IF EXISTS "Users can update their own services" ON services;
    DROP POLICY IF EXISTS "Users can delete their own services" ON services;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Consolidated service read policy (handles both public and private access)
CREATE POLICY "View services policy" ON services
    FOR SELECT TO public
    USING (
        ((is_active = true) AND (show_in_directory = true)) OR 
        (user_id = (select auth.uid()))
    );

CREATE POLICY "Users can insert their own services" ON services
    FOR INSERT TO public
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own services" ON services
    FOR UPDATE TO public
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own services" ON services
    FOR DELETE TO public
    USING (user_id = (select auth.uid()));

-- Service Requests: Optimize auth calls and consolidate policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own service requests as donor" ON service_requests;
    DROP POLICY IF EXISTS "Users can view their own service requests as fundraiser" ON service_requests;
    DROP POLICY IF EXISTS "Donors can insert service requests" ON service_requests;
    DROP POLICY IF EXISTS "Users can update their own service requests as donor" ON service_requests;
    DROP POLICY IF EXISTS "Users can update their own service requests as fundraiser" ON service_requests;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Consolidated service requests policies
CREATE POLICY "View service requests policy" ON service_requests
    FOR SELECT TO public
    USING (
        (donor_id = (select auth.uid())) OR 
        (fundraiser_id = (select auth.uid()))
    );

CREATE POLICY "Donors can insert service requests" ON service_requests
    FOR INSERT TO public
    WITH CHECK (donor_id = (select auth.uid()));

CREATE POLICY "Update service requests policy" ON service_requests
    FOR UPDATE TO public
    USING (
        (donor_id = (select auth.uid())) OR 
        (fundraiser_id = (select auth.uid()))
    )
    WITH CHECK (
        (donor_id = (select auth.uid())) OR 
        (fundraiser_id = (select auth.uid()))
    );