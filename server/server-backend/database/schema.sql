-- Auto-generated schema from project_time_manager database
-- Generated on: 2026-01-16T06:51:15.165Z
-- This schema is used to create new organization databases

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types (enums)
DO $$ BEGIN CREATE TYPE employment_type_enum AS ENUM ('Permanent', 'Temp.', 'Contract'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE project_status AS ENUM ('active', 'completed', 'on_hold', 'cancelled', 'pending'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE salary_type AS ENUM ('hourly', 'daily', 'monthly'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE task_status AS ENUM ('To Do', 'Active', 'Completed', 'Cancelled', 'On Hold'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'employee', 'manager'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create tables (foreign keys will be added after)

-- Table: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  action_type character varying(30) NOT NULL,
  actor_id uuid,
  actor_name character varying(100),
  employee_id uuid,
  employee_name character varying(100),
  project_id uuid,
  project_name character varying(255),
  task_id uuid,
  task_title character varying(255),
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Create sequence for audit_logs
CREATE SEQUENCE IF NOT EXISTS audit_logs_id_seq;

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id integer DEFAULT nextval('audit_logs_id_seq'::regclass) NOT NULL,
  method character varying(10) NOT NULL,
  path text NOT NULL,
  user_id text,
  ip character varying(64),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: clients
CREATE TABLE IF NOT EXISTS clients (
  email character varying(255),
  address text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  first_name character varying(100),
  last_name character varying(100),
  client_id uuid DEFAULT uuid_generate_v4() NOT NULL,
  phone_number character varying(50),
  onboard_date date,
  salutation character varying(20),
  gst_number character varying(20),
  PRIMARY KEY (client_id)
);

-- Table: countries
CREATE TABLE IF NOT EXISTS countries (
  country_id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name character varying(100) NOT NULL,
  code character varying(10),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (country_id)
);

-- Table: departments
CREATE TABLE IF NOT EXISTS departments (
  department_id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name character varying(100) NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (department_id)
);

-- Table: designations
CREATE TABLE IF NOT EXISTS designations (
  designation_id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name character varying(100) NOT NULL,
  description text,
  department_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (designation_id)
);

-- Table: permissions
CREATE TABLE IF NOT EXISTS permissions (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name character varying(100) NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: projects
CREATE TABLE IF NOT EXISTS projects (
  client_id uuid NOT NULL,
  description text,
  status character varying(50) DEFAULT 'active'::character varying,
  start_date date,
  end_date date,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  project_id uuid DEFAULT uuid_generate_v4() NOT NULL,
  project_name character varying(255) NOT NULL,
  estimated_value numeric,
  project_location character varying(255),
  team_member_ids jsonb DEFAULT '[]'::jsonb,
  coordinates character varying(50),
  PRIMARY KEY (project_id)
);

-- Table: roles
CREATE TABLE IF NOT EXISTS roles (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name user_role NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: salaries
CREATE TABLE IF NOT EXISTS salaries (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  employee_id uuid NOT NULL,
  salary_type salary_type NOT NULL,
  salary_amount numeric(10,2) NOT NULL,
  hourly_rate numeric(10,2),
  effective_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: states
CREATE TABLE IF NOT EXISTS states (
  state_id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name character varying(100) NOT NULL,
  code character varying(10),
  country_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (state_id)
);

-- Table: time_entries
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  employee_id uuid NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  duration_minutes integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  task_id uuid NOT NULL,
  work_date date DEFAULT CURRENT_DATE NOT NULL,
  original_start_time timestamp with time zone,
  original_end_time timestamp with time zone,
  PRIMARY KEY (id)
);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  first_name character varying(100) NOT NULL,
  last_name character varying(100) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  user_id uuid DEFAULT uuid_generate_v4() NOT NULL,
  email_id character varying(255),
  phone_number character varying(50),
  salutation character varying(20),
  date_of_birth date,
  address text,
  photograph text,
  aadhaar_number character varying(12),
  aadhaar_image text,
  joining_date date,
  employee_type character varying(20),
  pay_calculation character varying(20),
  amount numeric,
  overtime_rate numeric,
  department_id uuid,
  designation_id uuid,
  country_id uuid,
  state_id uuid,
  password_hash character varying(255),
  role user_role DEFAULT 'employee'::user_role,
  PRIMARY KEY (user_id)
);

-- Table: employee_documents
CREATE TABLE IF NOT EXISTS employee_documents (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  employee_id uuid,
  document_type character varying(50) NOT NULL,
  original_name character varying(255),
  file_name character varying(255),
  file_path text,
  file_size integer,
  mime_type character varying(100),
  file_extension character varying(20),
  is_image boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Table: role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  role_name user_role NOT NULL,
  permission_id uuid NOT NULL,
  has_access boolean DEFAULT false NOT NULL,
  PRIMARY KEY (id)
);

-- Table: tasks
CREATE TABLE IF NOT EXISTS tasks (
  project_id uuid NOT NULL,
  status task_status NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  approved boolean DEFAULT false,
  approved_at timestamp with time zone,
  approval_notes text,
  task_id uuid DEFAULT uuid_generate_v4() NOT NULL,
  task_name character varying(255) NOT NULL,
  start_date date,
  end_date date,
  description text,
  attachments_id uuid,
  client_id uuid,
  assigned_to jsonb DEFAULT '[]'::jsonb,
  high_priority boolean DEFAULT false,
  location character varying(255),
  PRIMARY KEY (task_id)
);

-- Table: project_attachments
CREATE TABLE IF NOT EXISTS project_attachments (
  attachment_id uuid DEFAULT uuid_generate_v4() NOT NULL,
  project_id uuid NOT NULL,
  file_name character varying(255) NOT NULL,
  file_path text NOT NULL,
  file_type character varying(100),
  file_size bigint,
  category character varying(50),
  description text,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (attachment_id)
);

-- Table: task_attachments
CREATE TABLE IF NOT EXISTS task_attachments (
  attachment_id uuid DEFAULT uuid_generate_v4() NOT NULL,
  task_id uuid NOT NULL,
  file_name character varying(255) NOT NULL,
  file_path text NOT NULL,
  file_type character varying(100),
  file_size bigint,
  category character varying(50),
  description text,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (attachment_id)
);

-- Foreign key constraints
DO $$ BEGIN ALTER TABLE employee_documents ADD CONSTRAINT employee_documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES users(user_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE tasks ADD CONSTRAINT fk_tasks_client_id FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE project_attachments ADD CONSTRAINT project_attachments_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE project_attachments ADD CONSTRAINT project_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE task_attachments ADD CONSTRAINT task_attachments_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE task_attachments ADD CONSTRAINT task_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS permissions_name_key ON public.permissions USING btree (name);
CREATE INDEX IF NOT EXISTS idx_project_attachments_file_type ON public.project_attachments USING btree (file_type);
CREATE INDEX IF NOT EXISTS idx_project_attachments_project_id ON public.project_attachments USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_project_attachments_uploaded_by ON public.project_attachments USING btree (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects USING btree (client_id);
CREATE UNIQUE INDEX IF NOT EXISTS role_permissions_role_name_permission_id_key ON public.role_permissions USING btree (role_name, permission_id);
CREATE UNIQUE INDEX IF NOT EXISTS roles_name_key ON public.roles USING btree (name);
CREATE INDEX IF NOT EXISTS idx_salaries_effective_date ON public.salaries USING btree (effective_date);
CREATE INDEX IF NOT EXISTS idx_salaries_employee_id ON public.salaries USING btree (employee_id);
CREATE INDEX IF NOT EXISTS idx_salaries_is_current ON public.salaries USING btree (is_current);
CREATE INDEX IF NOT EXISTS idx_task_attachments_file_type ON public.task_attachments USING btree (file_type);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON public.task_attachments USING btree (task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON public.task_attachments USING btree (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_tasks_approved ON public.tasks USING btree (approved);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks USING btree (status);
CREATE INDEX IF NOT EXISTS idx_time_entries_employee_id ON public.time_entries USING btree (employee_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON public.time_entries USING btree (start_time);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON public.time_entries USING btree (task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_work_date ON public.time_entries USING btree (work_date);
