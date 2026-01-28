-- =====================================================
-- DROPPABLESTUDIO DATABASE SCHEMA
-- Complete SQL Schema for Supabase PostgreSQL
-- =====================================================
-- 
-- SETUP INSTRUCTIONS:
-- 1. Create a Supabase project at https://supabase.com
-- 2. Go to SQL Editor in your Supabase dashboard
-- 3. Copy and paste this entire file
-- 4. Run the SQL script
-- 5. Go to Authentication > Providers and enable Email
-- 6. Create admin users in Authentication > Users
-- 7. Copy your Supabase URL and anon key to your app's .env file:
--    VITE_SUPABASE_URL=your-project-url
--    VITE_SUPABASE_ANON_KEY=your-anon-key
-- 8. Enable Real-time in Database > Replication (enable for all tables)
--
-- FEATURES INCLUDED:
-- ✅ Supabase Authentication (admin accounts)
-- ✅ Real-time sync across all accounts
-- ✅ Package templates with tasks
-- ✅ Client management with status tracking
-- ✅ Task management with activity tracking
-- ✅ Payment tracking
-- ✅ Progress percentage calculation
-- ✅ Deadline management
-- ✅ Analytics and reporting
-- ✅ Calendar integration
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PACKAGES TABLE
-- Stores all available package templates
-- =====================================================
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price_min DECIMAL(10,2) NOT NULL,
    price_max DECIMAL(10,2),
    estimated_hours INTEGER NOT NULL,
    default_duration_days INTEGER NOT NULL,
    is_addon BOOLEAN DEFAULT FALSE,
    category VARCHAR(50) CHECK (category IN ('main', 'branding', 'bundle')) DEFAULT 'main',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- =====================================================
-- 2. PACKAGE TASKS TABLE
-- Pre-defined tasks for each package template
-- =====================================================
CREATE TABLE package_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    order_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_hours DECIMAL(5,2) NOT NULL,
    task_type VARCHAR(50) CHECK (task_type IN ('research', 'design', 'mockup', 'content', 'filming', 'editing', 'review', 'delivery')) DEFAULT 'design',
    complexity VARCHAR(50) CHECK (complexity IN ('simple', 'medium', 'complex', 'very_complex')) DEFAULT 'medium',
    dependencies INTEGER[], -- Array of order_numbers this task depends on
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(package_id, order_number)
);

-- =====================================================
-- 3. CLIENTS TABLE
-- Stores all client information
-- =====================================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    instagram_handle VARCHAR(255),
    company_name VARCHAR(255),
    package_id UUID NOT NULL REFERENCES packages(id),
    addon_package_id UUID REFERENCES packages(id),
    actual_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('not_started', 'in_progress', 'completed', 'archived')) DEFAULT 'not_started',
    start_date DATE,
    deadline DATE NOT NULL,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- =====================================================
-- 4. TASKS TABLE
-- Actual tasks for each client (created from package templates)
-- =====================================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    package_task_id UUID REFERENCES package_tasks(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_hours DECIMAL(5,2) NOT NULL,
    actual_hours DECIMAL(5,2),
    task_type VARCHAR(50) CHECK (task_type IN ('research', 'design', 'mockup', 'content', 'filming', 'editing', 'review', 'delivery')) DEFAULT 'design',
    complexity VARCHAR(50) CHECK (complexity IN ('simple', 'medium', 'complex', 'very_complex')) DEFAULT 'medium',
    scheduled_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) CHECK (status IN ('not_started', 'in_research', 'in_progress', 'on_track', 'completed', 'blocked')) DEFAULT 'not_started',
    priority VARCHAR(50) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    assigned_to UUID[] DEFAULT '{}', -- Array of user IDs
    dependencies UUID[], -- Array of task IDs this task depends on
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- =====================================================
-- 5. TASK NOTES TABLE
-- Notes and comments on tasks
-- =====================================================
CREATE TABLE task_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    author_name VARCHAR(255) NOT NULL,
    note_type VARCHAR(50) CHECK (note_type IN ('progress', 'blocker', 'decision', 'handoff', 'client_feedback')) DEFAULT 'progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- =====================================================
-- 6. CLIENT NOTES TABLE
-- General notes about clients
-- =====================================================
CREATE TABLE client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    author_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('preference', 'communication', 'feedback', 'issue', 'general')) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- =====================================================
-- 7. PAYMENTS TABLE
-- Track all payments for clients
-- =====================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(100),
    invoice_number VARCHAR(100),
    status VARCHAR(50) CHECK (status IN ('paid', 'partial', 'pending', 'refunded')) DEFAULT 'pending',
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- =====================================================
-- 8. ACTIVITY LOG TABLE
-- Track all user activities for real-time feed
-- =====================================================
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) CHECK (entity_type IN ('client', 'task', 'payment', 'note')) NOT NULL,
    entity_id UUID NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- =====================================================
-- 9. USER PROFILES TABLE (OPTIONAL)
-- Extended user information beyond Supabase auth
-- =====================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role VARCHAR(50) CHECK (role IN ('designer', 'content_creator', 'manager', 'admin')) DEFAULT 'designer',
    avatar_url TEXT,
    online BOOLEAN DEFAULT FALSE,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    preferences JSONB DEFAULT '{"notifications": true, "email_digest": "daily"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_deadline ON clients(deadline);
CREATE INDEX idx_clients_package ON clients(package_id);
CREATE INDEX idx_tasks_client ON tasks(client_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX idx_tasks_assigned ON tasks USING GIN(assigned_to);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_payments_client ON payments(client_id);

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Calculate client completion percentage based on tasks
CREATE OR REPLACE FUNCTION update_client_completion_percentage()
RETURNS TRIGGER AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    percentage INTEGER;
BEGIN
    -- Count total and completed tasks for this client
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
    INTO total_tasks, completed_tasks
    FROM tasks
    WHERE client_id = COALESCE(NEW.client_id, OLD.client_id);
    
    -- Calculate percentage
    IF total_tasks > 0 THEN
        percentage := ROUND((completed_tasks::DECIMAL / total_tasks) * 100);
    ELSE
        percentage := 0;
    END IF;
    
    -- Update client record
    UPDATE clients
    SET completion_percentage = percentage,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = COALESCE(NEW.client_id, OLD.client_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Auto-update client status based on progress
CREATE OR REPLACE FUNCTION auto_update_client_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If completion is 100%, mark as completed
    IF NEW.completion_percentage = 100 AND OLD.status != 'completed' THEN
        NEW.status = 'completed';
    -- If completion > 0 and status is not_started, change to in_progress
    ELSIF NEW.completion_percentage > 0 AND OLD.status = 'not_started' THEN
        NEW.status = 'in_progress';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Log activity when important changes happen
CREATE OR REPLACE FUNCTION log_client_activity()
RETURNS TRIGGER AS $$
DECLARE
    user_name_val VARCHAR(255);
BEGIN
    -- Get user name from profiles or use ID
    SELECT COALESCE(full_name, id::text) INTO user_name_val
    FROM user_profiles
    WHERE id = auth.uid()
    LIMIT 1;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_log (user_id, user_name, action, entity_type, entity_id, description)
        VALUES (auth.uid(), COALESCE(user_name_val, 'System'), 'created', 'client', NEW.id, 'Added new client: ' || NEW.name);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            INSERT INTO activity_log (user_id, user_name, action, entity_type, entity_id, description)
            VALUES (auth.uid(), COALESCE(user_name_val, 'System'), 'updated', 'client', NEW.id, 'Changed status to: ' || NEW.status);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Log task activity
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
DECLARE
    user_name_val VARCHAR(255);
BEGIN
    SELECT COALESCE(full_name, id::text) INTO user_name_val
    FROM user_profiles
    WHERE id = auth.uid()
    LIMIT 1;
    
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO activity_log (user_id, user_name, action, entity_type, entity_id, description)
        VALUES (auth.uid(), COALESCE(user_name_val, 'System'), 'updated', 'task', NEW.id, 'Changed task status to: ' || NEW.status);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- ATTACH TRIGGERS
-- =====================================================

-- Updated_at triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Completion percentage triggers
CREATE TRIGGER update_completion_after_task_change
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_client_completion_percentage();

-- Auto status update trigger
CREATE TRIGGER auto_update_status_on_completion
    BEFORE UPDATE OF completion_percentage ON clients
    FOR EACH ROW EXECUTE FUNCTION auto_update_client_status();

-- Activity logging triggers
CREATE TRIGGER log_client_changes
    AFTER INSERT OR UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION log_client_activity();

CREATE TRIGGER log_task_changes
    AFTER UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION log_task_activity();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS and create policies for Supabase auth
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Packages: Everyone can read, only authenticated users can modify
CREATE POLICY "Packages are viewable by everyone" ON packages FOR SELECT USING (true);
CREATE POLICY "Packages are modifiable by authenticated users" ON packages FOR ALL USING (auth.role() = 'authenticated');

-- Package Tasks: Everyone can read, only authenticated users can modify
CREATE POLICY "Package tasks are viewable by everyone" ON package_tasks FOR SELECT USING (true);
CREATE POLICY "Package tasks are modifiable by authenticated users" ON package_tasks FOR ALL USING (auth.role() = 'authenticated');

-- Clients: Only authenticated users can access
CREATE POLICY "Clients are accessible by authenticated users" ON clients FOR ALL USING (auth.role() = 'authenticated');

-- Tasks: Only authenticated users can access
CREATE POLICY "Tasks are accessible by authenticated users" ON tasks FOR ALL USING (auth.role() = 'authenticated');

-- Notes: Only authenticated users can access
CREATE POLICY "Task notes are accessible by authenticated users" ON task_notes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Client notes are accessible by authenticated users" ON client_notes FOR ALL USING (auth.role() = 'authenticated');

-- Payments: Only authenticated users can access
CREATE POLICY "Payments are accessible by authenticated users" ON payments FOR ALL USING (auth.role() = 'authenticated');

-- Activity Log: Only authenticated users can read, system can write
CREATE POLICY "Activity log is viewable by authenticated users" ON activity_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Activity log is writable by authenticated users" ON activity_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- User Profiles: Users can view all profiles, but only update their own
CREATE POLICY "User profiles are viewable by authenticated users" ON user_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- VIEWS FOR ANALYTICS AND REPORTING
-- =====================================================

-- Dashboard metrics view
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT
    COUNT(*) FILTER (WHERE status != 'archived') as total_projects,
    COUNT(*) FILTER (WHERE status = 'in_progress') as running_projects,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_projects,
    COUNT(*) FILTER (WHERE status = 'not_started') as pending_projects,
    SUM(actual_price) FILTER (WHERE status = 'completed') as total_revenue,
    AVG(completion_percentage) FILTER (WHERE status = 'in_progress') as avg_progress
FROM clients;

-- Tasks by status view
CREATE OR REPLACE VIEW tasks_by_status AS
SELECT
    status,
    COUNT(*) as count,
    SUM(estimated_hours) as total_estimated_hours,
    SUM(actual_hours) as total_actual_hours
FROM tasks
GROUP BY status;

-- Client overview with package details
CREATE OR REPLACE VIEW client_overview AS
SELECT
    c.id,
    c.name,
    c.email,
    c.phone,
    c.instagram_handle,
    c.company_name,
    c.status,
    c.start_date,
    c.deadline,
    c.completion_percentage,
    c.actual_price,
    c.created_at,
    c.updated_at,
    p.name as package_name,
    p.slug as package_slug,
    ap.name as addon_package_name,
    (SELECT COUNT(*) FROM tasks WHERE client_id = c.id) as total_tasks,
    (SELECT COUNT(*) FROM tasks WHERE client_id = c.id AND status = 'completed') as completed_tasks,
    (SELECT COUNT(*) FROM tasks WHERE client_id = c.id AND status IN ('in_progress', 'in_research')) as active_tasks,
    (SELECT SUM(amount) FROM payments WHERE client_id = c.id AND status = 'paid') as total_paid
FROM clients c
JOIN packages p ON c.package_id = p.id
LEFT JOIN packages ap ON c.addon_package_id = ap.id;

-- =====================================================
-- INSERT PACKAGE DATA
-- All Droppablestudio packages with tasks
-- =====================================================

-- Package 1: DROP ESSENTIAL
INSERT INTO packages (name, slug, description, price_min, price_max, estimated_hours, default_duration_days, category) VALUES
('DROP ESSENTIAL', 'drop-essential', 'Ideal for brands launching a first drop or testing a new idea. Includes 1 clothing item with mockups, social content, and b-roll.', 597, 597, 18, 9, 'main');

-- Package 2: DROP GROWTH
INSERT INTO packages (name, slug, description, price_min, price_max, estimated_hours, default_duration_days, category) VALUES
('DROP GROWTH', 'drop-growth', 'For brands ready to release a structured mini-collection with 3 items, cohesive creative direction, and complete social content.', 897, 997, 35, 12, 'main');

-- Package 3: DROP BRAND EXPERIENCE
INSERT INTO packages (name, slug, description, price_min, price_max, estimated_hours, default_duration_days, category) VALUES
('DROP BRAND EXPERIENCE', 'drop-brand-experience', 'For brands focused on positioning and brand identity. 4-5 items with full creative concept, premium mockups, and drop blueprint.', 1397, 1497, 52, 16, 'main');

-- Package 4: DROP FULL LAUNCH
INSERT INTO packages (name, slug, description, price_min, price_max, estimated_hours, default_duration_days, category) VALUES
('DROP FULL LAUNCH', 'drop-full-launch', 'Complete solution for brands ready to scale. 6-7 items with full collection, AI-generated ads, landing page content, and strategic consultation.', 1997, 2197, 78, 20, 'main');

-- Add-on 1: BRAND STARTER IDENTITY
INSERT INTO packages (name, slug, description, price_min, price_max, estimated_hours, default_duration_days, is_addon, category) VALUES
('BRAND STARTER IDENTITY', 'brand-starter-identity', 'Ideal for new brands starting from zero. Includes primary logo, color palette, typography, and basic brand guidelines.', 397, 397, 14, 6, true, 'branding');

-- Add-on 2: BRAND IDENTITY PRO
INSERT INTO packages (name, slug, description, price_min, price_max, estimated_hours, default_duration_days, is_addon, category) VALUES
('BRAND IDENTITY PRO', 'brand-identity-pro', 'For brands that want stronger positioning. Complete logo system, visual style direction, brand tone, and social media branding elements.', 697, 697, 24, 9, true, 'branding');

-- =====================================================
-- INSERT PACKAGE TASKS FOR EACH PACKAGE
-- =====================================================

-- DROP ESSENTIAL Tasks
INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 1, 'Client Briefing & Item Selection', 'Initial meeting to understand client needs and select clothing item', 1.0, 'research', 'simple' FROM packages WHERE slug = 'drop-essential';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 2, 'Reference Gathering & Mood Board', 'Collect visual references and create mood board', 1.0, 'design', 'simple' FROM packages WHERE slug = 'drop-essential';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 3, 'Design Concept Development by Arcidiart', 'Create clothing design concept', 3.0, 'design', 'complex' FROM packages WHERE slug = 'drop-essential';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 4, 'Client Review & Design Iteration', 'Present design to client and make revisions', 1.0, 'review', 'medium' FROM packages WHERE slug = 'drop-essential';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 5, 'Professional Mockup Creation - Front View', 'Create front view mockup', 1.5, 'mockup', 'medium' FROM packages WHERE slug = 'drop-essential';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 6, 'Professional Mockup Creation - Back View', 'Create back view mockup', 1.5, 'mockup', 'medium' FROM packages WHERE slug = 'drop-essential';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 7, 'Professional Mockup Creation - Detail Shot', 'Create detail shot mockup', 1.5, 'mockup', 'medium' FROM packages WHERE slug = 'drop-essential';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 8, 'Social Media Content Planning', 'Plan social media content strategy', 1.0, 'content', 'medium' FROM packages WHERE slug = 'drop-essential';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 9, 'Create 3 Static Posts', 'Design and create 3 static social media posts', 2.0, 'content', 'medium' FROM packages WHERE slug = 'drop-essential';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 10, 'Create 1 Instagram Story', 'Design Instagram story template', 0.5, 'content', 'simple' FROM packages WHERE slug = 'drop-essential';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 11, 'Film & Edit 2 Short Reels', 'Film and edit 2 short reels (5-7 seconds)', 2.0, 'filming', 'medium' FROM packages WHERE slug = 'drop-essential';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 12, 'Film & Edit 6 B-Roll Clips', 'Film and edit 6 b-roll clips', 1.5, 'filming', 'medium' FROM packages WHERE slug = 'drop-essential';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 13, 'Write Social Captions', 'Write captions for all social content', 0.5, 'content', 'simple' FROM packages WHERE slug = 'drop-essential';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 14, 'Final Review & Quality Check', 'Review all deliverables for quality', 0.5, 'review', 'simple' FROM packages WHERE slug = 'drop-essential';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 15, 'File Packaging & Delivery', 'Package files and deliver to client', 0.5, 'delivery', 'simple' FROM packages WHERE slug = 'drop-essential';

-- DROP GROWTH Tasks
INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 1, 'Client Discovery & Collection Concept', 'Deep dive into brand vision and collection direction', 2.0, 'research', 'medium' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 2, 'Creative Direction Development', 'Develop cohesive creative direction across all pieces', 2.0, 'design', 'complex' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 3, 'Reference & Mood Board Creation', 'Create comprehensive mood board', 1.5, 'design', 'medium' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 4, 'Design Item 1 by Arcidiart', 'Design first clothing item', 2.5, 'design', 'complex' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 5, 'Design Item 2 by Arcidiart', 'Design second clothing item', 2.5, 'design', 'complex' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 6, 'Design Item 3 by Arcidiart', 'Design third clothing item', 2.5, 'design', 'complex' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 7, 'Client Review & Design Iterations', 'Present designs and make iterations', 2.0, 'review', 'medium' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 8, 'Create 12 Professional Mockups', 'Create 4 mockups per item (12 total)', 6.0, 'mockup', 'complex' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 9, 'Social Content Strategy Planning', 'Plan comprehensive social content strategy', 1.5, 'content', 'medium' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 10, 'Create 6 Static Posts', 'Create 6 static social media posts', 3.0, 'content', 'medium' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 11, 'Create 3 Instagram Stories', 'Create 3 Instagram story templates', 1.5, 'content', 'medium' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 12, 'Film & Edit 4 Reels', 'Film and edit 4 reels', 4.0, 'filming', 'complex' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 13, 'Film & Edit 12 Advanced B-Roll Clips', 'Film and edit 12 advanced b-roll clips with loops and transitions', 3.0, 'filming', 'complex' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 14, 'Develop Mini Drop Plan', 'Create posting sequence and timing suggestions', 1.0, 'content', 'medium' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 15, 'Write Item Names & Micro-Copy', 'Write names and micro-copy for items', 1.0, 'content', 'simple' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 16, 'Write Social Captions', 'Write captions for all social content', 1.0, 'content', 'simple' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 17, 'Final Review & Quality Check', 'Comprehensive quality review', 1.0, 'review', 'medium' FROM packages WHERE slug = 'drop-growth';

INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity) 
SELECT id, 18, 'File Packaging & Client Handoff', 'Package and deliver all files', 0.5, 'delivery', 'simple' FROM packages WHERE slug = 'drop-growth';

-- DROP BRAND EXPERIENCE Tasks (22 tasks)
INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity)
VALUES 
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 1, 'Brand Discovery Workshop & Vision Alignment', 'Comprehensive brand discovery session', 2.0, 'research', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 2, 'Develop Full Creative Concept', 'Create complete creative concept', 3.0, 'design', 'very_complex'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 3, 'Create Collection Name & Mood Direction', 'Name collection and establish mood', 2.0, 'design', 'medium'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 4, 'Design Item 1 by Arcidiart', 'Design first item', 2.5, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 5, 'Design Item 2 by Arcidiart', 'Design second item', 2.5, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 6, 'Design Item 3 by Arcidiart', 'Design third item', 2.5, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 7, 'Design Item 4 by Arcidiart', 'Design fourth item', 2.5, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 8, 'Design Item 5 by Arcidiart', 'Design fifth item', 2.5, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 9, 'Client Review & Design Refinement', 'Present and refine designs', 2.5, 'review', 'medium'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 10, 'Create 20+ Premium Mockups', 'Create 4-5 mockups per item', 10.0, 'mockup', 'very_complex'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 11, 'Develop Drop Storytelling Strategy', 'Create storytelling strategy', 2.0, 'content', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 12, 'Create 9-12 Static Posts', 'Create static social posts', 4.5, 'content', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 13, 'Create 6-8 Instagram Stories', 'Create Instagram stories', 2.5, 'content', 'medium'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 14, 'Film & Edit 6-8 Reels', 'Film and edit reels', 5.0, 'filming', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 15, 'Film & Edit 20-24 Cinematic B-Roll Clips', 'Film cinematic b-roll', 5.0, 'filming', 'very_complex'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 16, 'Create Drop Blueprint - Pre-Drop Strategy', 'Pre-launch strategy', 1.0, 'content', 'medium'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 17, 'Create Drop Blueprint - Launch Strategy', 'Launch strategy', 1.0, 'content', 'medium'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 18, 'Create Drop Blueprint - Post-Drop Strategy', 'Post-launch strategy', 1.0, 'content', 'medium'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 19, 'Pricing & Premium Perception Guidance', 'Provide pricing guidance', 1.0, 'content', 'medium'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 20, 'Write All Social Captions', 'Write all social captions', 1.5, 'content', 'simple'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 21, 'Final Review & Quality Control', 'Final quality review', 1.0, 'review', 'medium'),
((SELECT id FROM packages WHERE slug = 'drop-brand-experience'), 22, 'Complete File Package & Client Training', 'Package files and train client', 1.0, 'delivery', 'simple');

-- DROP FULL LAUNCH Tasks (27 tasks)
INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity)
VALUES 
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 1, 'Strategic Kickoff & Brand Vision Session', 'Strategic brand vision session', 2.0, 'research', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 2, 'Develop Complete Collection Concept', 'Full collection concept', 3.0, 'design', 'very_complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 3, 'Competitive Analysis & Market Positioning', 'Market analysis', 2.0, 'research', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 4, 'Design Item 1 by Arcidiart', 'Design item 1', 2.5, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 5, 'Design Item 2 by Arcidiart', 'Design item 2', 2.5, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 6, 'Design Item 3 by Arcidiart', 'Design item 3', 2.5, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 7, 'Design Item 4 by Arcidiart', 'Design item 4', 2.5, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 8, 'Design Item 5 by Arcidiart', 'Design item 5', 2.5, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 9, 'Design Item 6 by Arcidiart', 'Design item 6', 2.5, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 10, 'Design Item 7 by Arcidiart', 'Design item 7', 2.5, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 11, 'Client Review & Final Design Refinement', 'Final design review', 3.0, 'review', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 12, 'Create 30-35 Advanced Mockups', '5 mockups per item', 14.0, 'mockup', 'very_complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 13, 'Social Content Strategy & Calendar', 'Complete content strategy', 2.0, 'content', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 14, 'Create 12-15 Static Posts', 'Organic + ad posts', 6.0, 'content', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 15, 'Create 10+ Instagram Stories', 'Instagram stories', 3.5, 'content', 'medium'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 16, 'Film & Edit 10+ Reels', 'Film and edit reels', 8.0, 'filming', 'very_complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 17, 'Generate AI Ad Creatives (Static)', 'AI static ads', 2.0, 'content', 'medium'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 18, 'Generate AI Ad Creatives (Video)', 'AI video ads', 2.0, 'content', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 19, 'Film & Edit 30-40 Premium B-Roll Clips', 'Premium b-roll library', 7.0, 'filming', 'very_complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 20, 'Write Ad Copy (3 Different Angles)', 'Ad copywriting', 2.0, 'content', 'medium'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 21, 'Create Landing Page Content & Copy', 'Landing page content', 2.0, 'content', 'complex'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 22, 'Create E-Commerce Product Descriptions', 'Product descriptions', 1.5, 'content', 'simple'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 23, 'Write All Social Captions', 'All social captions', 2.0, 'content', 'simple'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 24, '1:1 Strategic Consultation Call', 'Strategic consultation', 1.5, 'research', 'medium'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 25, 'Create Next-Drop Optimization Checklist', 'Optimization checklist', 1.0, 'content', 'simple'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 26, 'Final Review & Quality Assurance', 'Final QA', 1.5, 'review', 'medium'),
((SELECT id FROM packages WHERE slug = 'drop-full-launch'), 27, 'Complete Package Delivery & Training', 'Delivery and training', 1.5, 'delivery', 'simple');

-- BRAND STARTER IDENTITY Tasks (12 tasks)
INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity)
VALUES 
((SELECT id FROM packages WHERE slug = 'brand-starter-identity'), 1, 'Brand Discovery & Vision Workshop', 'Brand discovery session', 1.5, 'research', 'medium'),
((SELECT id FROM packages WHERE slug = 'brand-starter-identity'), 2, 'Research Competitors & Industry Trends', 'Competitor research', 1.5, 'research', 'medium'),
((SELECT id FROM packages WHERE slug = 'brand-starter-identity'), 3, 'Mood Board & Style Direction', 'Create mood board', 1.5, 'design', 'medium'),
((SELECT id FROM packages WHERE slug = 'brand-starter-identity'), 4, 'Logo Concept Sketches (3 Initial Directions)', 'Initial logo concepts', 3.0, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'brand-starter-identity'), 5, 'Client Review & Feedback', 'Client review session', 1.0, 'review', 'simple'),
((SELECT id FROM packages WHERE slug = 'brand-starter-identity'), 6, 'Refine Selected Logo Concept', 'Logo refinement', 2.0, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'brand-starter-identity'), 7, 'Create Secondary Logo / Logo Mark', 'Secondary logo', 1.5, 'design', 'medium'),
((SELECT id FROM packages WHERE slug = 'brand-starter-identity'), 8, 'Develop Color Palette', 'Color palette', 1.0, 'design', 'simple'),
((SELECT id FROM packages WHERE slug = 'brand-starter-identity'), 9, 'Select Typography System', 'Typography selection', 1.0, 'design', 'simple'),
((SELECT id FROM packages WHERE slug = 'brand-starter-identity'), 10, 'Create Basic Brand Usage Guidelines', 'Brand guidelines', 1.5, 'content', 'medium'),
((SELECT id FROM packages WHERE slug = 'brand-starter-identity'), 11, 'Export Logo Files (Web, Social, Print)', 'Export files', 1.0, 'delivery', 'simple'),
((SELECT id FROM packages WHERE slug = 'brand-starter-identity'), 12, 'Final Review & File Delivery', 'Final delivery', 0.5, 'delivery', 'simple');

-- BRAND IDENTITY PRO Tasks (16 tasks)
INSERT INTO package_tasks (package_id, order_number, title, description, estimated_hours, task_type, complexity)
VALUES 
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 1, 'In-Depth Brand Discovery Session', 'Deep brand discovery', 2.0, 'research', 'complex'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 2, 'Competitive Analysis & Positioning Strategy', 'Market positioning', 2.0, 'research', 'complex'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 3, 'Create Comprehensive Mood Board', 'Comprehensive mood board', 1.5, 'design', 'medium'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 4, 'Logo Concept Development (3 Directions)', 'Logo concepts', 4.0, 'design', 'very_complex'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 5, 'Client Review & Feedback Round 1', 'Client review', 1.0, 'review', 'simple'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 6, 'Refine Primary Logo', 'Primary logo refinement', 2.0, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 7, 'Create Logo Variations', 'Logo variations', 2.0, 'design', 'complex'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 8, 'Design Icon / Symbol Logo', 'Symbol logo', 1.5, 'design', 'medium'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 9, 'Develop Complete Color Palette', 'Extended color palette', 1.5, 'design', 'medium'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 10, 'Build Typography System', 'Typography system', 1.5, 'design', 'medium'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 11, 'Create Visual Style Direction Document', 'Style direction', 2.0, 'content', 'complex'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 12, 'Write Brand Tone & Positioning Guidelines', 'Brand guidelines', 2.0, 'content', 'complex'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 13, 'Design Social Media Branding Elements', 'Social templates', 2.0, 'design', 'medium'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 14, 'Create Full Brand Assets Kit', 'Brand assets kit', 1.5, 'delivery', 'medium'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 15, 'Final Review & Quality Check', 'Final review', 1.0, 'review', 'medium'),
((SELECT id FROM packages WHERE slug = 'brand-identity-pro'), 16, 'Package All Files & Client Handoff', 'Final handoff', 0.5, 'delivery', 'simple');

-- =====================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- Uncomment to add sample clients and tasks
-- =====================================================

/*
-- Sample Client 1
INSERT INTO clients (name, email, phone, instagram_handle, company_name, package_id, actual_price, status, start_date, deadline)
VALUES (
    'Marco Bianchi',
    'marco@urbanstreet.com',
    '+39 333 123 4567',
    '@urbanstreetofficial',
    'Urban Street Apparel',
    (SELECT id FROM packages WHERE slug = 'drop-growth'),
    897,
    'in_progress',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '12 days'
);

-- Sample Client 2
INSERT INTO clients (name, email, instagram_handle, company_name, package_id, actual_price, status, start_date, deadline)
VALUES (
    'Sofia Romano',
    'sofia@minimalco.com',
    '@minimalco',
    'Minimal Co.',
    (SELECT id FROM packages WHERE slug = 'drop-essential'),
    597,
    'not_started',
    CURRENT_DATE + INTERVAL '3 days',
    CURRENT_DATE + INTERVAL '12 days'
);

-- Sample Payment
INSERT INTO payments (client_id, amount, payment_date, payment_method, invoice_number, status)
VALUES (
    (SELECT id FROM clients WHERE email = 'marco@urbanstreet.com'),
    897,
    CURRENT_DATE,
    'Bank Transfer',
    'INV-2026-001',
    'paid'
);
*/

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Droppablestudio database schema created successfully!';
    RAISE NOTICE '📦 Packages installed: %', (SELECT COUNT(*) FROM packages);
    RAISE NOTICE '📋 Package tasks installed: %', (SELECT COUNT(*) FROM package_tasks);
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Go to Authentication > Users in Supabase dashboard';
    RAISE NOTICE '2. Create admin user accounts (3 team members)';
    RAISE NOTICE '3. Enable Real-time in Database > Replication for all tables';
    RAISE NOTICE '4. Copy your Supabase credentials to .env file';
    RAISE NOTICE '5. Start building your React frontend!';
    RAISE NOTICE '';
    RAISE NOTICE '📚 Available packages:';
    RAISE NOTICE '   - DROP ESSENTIAL (€597)';
    RAISE NOTICE '   - DROP GROWTH (€897-997)';
    RAISE NOTICE '   - DROP BRAND EXPERIENCE (€1,397-1,497)';
    RAISE NOTICE '   - DROP FULL LAUNCH (€1,997-2,197)';
    RAISE NOTICE '   - BRAND STARTER IDENTITY (€397)';
    RAISE NOTICE '   - BRAND IDENTITY PRO (€697)';
END $$;
