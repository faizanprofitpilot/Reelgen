-- Optional custom avatar image path (Storage path in avatars bucket). When set, generation uses this instead of avatars.image_path.
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS custom_avatar_path TEXT;
