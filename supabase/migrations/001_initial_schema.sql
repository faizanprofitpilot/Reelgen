-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Templates table
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  master_prompt TEXT NOT NULL,
  preview_url TEXT,
  caption_style TEXT NOT NULL CHECK (caption_style IN ('bold', 'minimal', 'clean')),
  default_pace TEXT NOT NULL CHECK (default_pace IN ('fast', 'normal', 'slow')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Avatars table
CREATE TABLE avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_path TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES templates(id),
  avatar_id UUID NOT NULL REFERENCES avatars(id),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'QUEUED', 'GENERATING', 'COMPLETE', 'FAILED')),
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 3 AND duration_seconds <= 15),
  pace TEXT NOT NULL CHECK (pace IN ('fast', 'normal', 'slow')),
  caption_style TEXT NOT NULL CHECK (caption_style IN ('bold', 'minimal', 'clean')),
  script TEXT NOT NULL,
  extra_instructions TEXT,
  video_path TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project assets table (for product images)
CREATE TABLE project_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'product_image' CHECK (type = 'product_image'),
  path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_assets_project_id ON project_assets(project_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- RLS Policies

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;

-- Templates: Readable by all authenticated users
CREATE POLICY "Templates are viewable by authenticated users"
  ON templates FOR SELECT
  TO authenticated
  USING (true);

-- Avatars: Readable by all authenticated users
CREATE POLICY "Avatars are viewable by authenticated users"
  ON avatars FOR SELECT
  TO authenticated
  USING (true);

-- Projects: Users can only access their own projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Project assets: Users can only access assets for their own projects
CREATE POLICY "Users can view assets for their own projects"
  ON project_assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create assets for their own projects"
  ON project_assets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
