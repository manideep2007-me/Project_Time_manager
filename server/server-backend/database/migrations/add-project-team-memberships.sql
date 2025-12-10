-- Migration: Add project_team_memberships table
-- Date: 2025-11-08
-- Purpose: Explicit team member assignments per project (2-3 employees per project)

BEGIN;

-- Create the project team memberships table
CREATE TABLE IF NOT EXISTS project_team_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, employee_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_team_project_id ON project_team_memberships(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_employee_id ON project_team_memberships(employee_id);

-- Add comments
COMMENT ON TABLE project_team_memberships IS 'Explicit team member assignments to projects';
COMMENT ON COLUMN project_team_memberships.role IS 'Team member role: lead, member, contributor, etc.';

COMMIT;

-- Verification queries (run manually after migration)
-- SELECT COUNT(*) FROM project_team_memberships;
-- SELECT p.name, COUNT(ptm.id) as team_size FROM projects p LEFT JOIN project_team_memberships ptm ON p.id = ptm.project_id GROUP BY p.id, p.name ORDER BY team_size DESC;
