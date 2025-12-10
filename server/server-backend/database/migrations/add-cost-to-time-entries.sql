-- Add cost column to time_entries table
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2) DEFAULT 0;

-- Add index for cost queries
CREATE INDEX IF NOT EXISTS idx_time_entries_cost ON time_entries(cost);

