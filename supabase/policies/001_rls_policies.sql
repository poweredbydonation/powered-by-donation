-- Row Level Security (RLS) Policies
-- Updated for fundraiser/donor terminology and unified user system
-- These policies control access to data based on user authentication and roles

-- ====================
-- USERS TABLE POLICIES
-- ====================

-- Users can view all profiles (public directory)
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT TO public
    USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT TO public
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE TO public
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile" ON users
    FOR DELETE TO public
    USING (auth.uid() = id);

-- ====================
-- SERVICES TABLE POLICIES
-- ====================

-- Anyone can view active services in directory
CREATE POLICY "Anyone can view active services" ON services
    FOR SELECT TO public
    USING ((is_active = true) AND (show_in_directory = true));

-- Users can view their own services (private)
CREATE POLICY "Users can view their own services" ON services
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- Users can insert their own services
CREATE POLICY "Users can insert their own services" ON services
    FOR INSERT TO public
    WITH CHECK (user_id = auth.uid());

-- Users can update their own services
CREATE POLICY "Users can update their own services" ON services
    FOR UPDATE TO public
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own services
CREATE POLICY "Users can delete their own services" ON services
    FOR DELETE TO public
    USING (user_id = auth.uid());

-- ====================
-- SERVICE REQUESTS TABLE POLICIES
-- ====================

-- Users can view their own service requests as donor
CREATE POLICY "Users can view their own service requests as donor" ON service_requests
    FOR SELECT TO public
    USING (donor_id = auth.uid());

-- Users can view their own service requests as fundraiser
CREATE POLICY "Users can view their own service requests as fundraiser" ON service_requests
    FOR SELECT TO public
    USING (fundraiser_id = auth.uid());

-- Donors can insert service requests
CREATE POLICY "Donors can insert service requests" ON service_requests
    FOR INSERT TO public
    WITH CHECK (donor_id = auth.uid());

-- Users can update their own service requests as donor
CREATE POLICY "Users can update their own service requests as donor" ON service_requests
    FOR UPDATE TO public
    USING (donor_id = auth.uid())
    WITH CHECK (donor_id = auth.uid());

-- Users can update their own service requests as fundraiser
CREATE POLICY "Users can update their own service requests as fundraiser" ON service_requests
    FOR UPDATE TO public
    USING (fundraiser_id = auth.uid())
    WITH CHECK (fundraiser_id = auth.uid());

-- ====================
-- CHARITY CACHE TABLE POLICIES
-- ====================

-- Public can view active charity data
CREATE POLICY "Public can view charity cache" ON charity_cache
    FOR SELECT TO public
    USING (is_active = true);

-- Authenticated users can manage charity cache
CREATE POLICY "Authenticated can manage charity cache" ON charity_cache
    FOR ALL TO authenticated
    USING (true);

-- ====================
-- PRICING TIERS TABLE POLICIES
-- ====================

-- Public can view active pricing tiers
CREATE POLICY "Public can view active pricing tiers" ON pricing_tiers
    FOR SELECT TO public
    USING (is_active = true);

-- ====================
-- ENABLE RLS ON ALL TABLES
-- ====================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;