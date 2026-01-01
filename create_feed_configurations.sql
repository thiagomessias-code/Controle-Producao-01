-- Create feed_configurations table
CREATE TABLE IF NOT EXISTS feed_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_type TEXT NOT NULL UNIQUE, -- e.g., 'postura', 'cria', 'recria'
    feed_type_id UUID REFERENCES feed_types(id) ON DELETE SET NULL,
    quantity_per_cage NUMERIC(10, 3) NOT NULL DEFAULT 0.240,
    schedule_times JSONB NOT NULL DEFAULT '["07:00", "11:00", "15:00"]'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE feed_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON feed_configurations
    FOR SELECT USING (true);

CREATE POLICY "Enable write access for authenticated users" ON feed_configurations
    FOR ALL USING (auth.role() = 'authenticated');
