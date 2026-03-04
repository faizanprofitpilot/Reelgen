-- Add 5 male avatars (public/avatars: Avatar 6.jpg.jpeg through Avatar 10.jpg.jpeg).
-- Run this if you already have the original seed and only need to add these.
INSERT INTO avatars (name, image_path, tags) VALUES
('Marcus', '/avatars/Avatar%206.jpg.jpeg', ARRAY['male', 'casual']),
('David', '/avatars/Avatar%207.jpg.jpeg', ARRAY['male', 'professional']),
('James', '/avatars/Avatar%208.jpg.jpeg', ARRAY['male', 'friendly']),
('Ryan', '/avatars/Avatar%209.jpg.jpeg', ARRAY['male', 'energetic']),
('Tyler', '/avatars/Avatar%2010.jpg.jpeg', ARRAY['male', 'trendy']);
