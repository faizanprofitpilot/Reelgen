-- Seed Templates
INSERT INTO templates (id, name, description, master_prompt, caption_style, default_pace) VALUES
(
  'hook_problem_demo',
  'Hook + Problem + Demo',
  'Start with an attention-grabbing hook, present a problem, then showcase your product as the solution. Perfect for products that solve a specific pain point.',
  'Create a UGC-style video that follows this structure: 1) Hook (0-3s): Start with an attention-grabbing statement or question that makes viewers stop scrolling. 2) Problem (3-8s): Clearly present the problem or pain point your audience faces. Show relatable frustration or struggle. 3) Demo (8-15s): Showcase the product in action, demonstrating how it solves the problem. Keep it authentic and handheld. Style: Phone-shot vertical video, natural lighting, realistic human presenter, product clearly visible, TikTok ad pacing, minimal text overlays.',
  'bold',
  'fast'
),
(
  'testimonial_ugc',
  'Testimonial UGC',
  'Authentic testimonial-style video where a real person shares their experience with your product. Builds trust and credibility.',
  'Create an authentic UGC-style testimonial video. The presenter should speak directly to the camera as if sharing a personal experience. Structure: 1) Introduction (0-2s): Quick intro or greeting. 2) Experience (2-12s): Share genuine experience with the product, what they liked, how it helped. 3) Recommendation (12-15s): Clear recommendation or call to action. Style: Vertical phone-shot, natural indoor lighting, authentic human presenter speaking naturally, product visible in frame, testimonial pacing (slightly slower than montage), clean captions.',
  'clean',
  'normal'
),
(
  'fast_cut_montage',
  'Fast Cut TikTok Montage',
  'High-energy montage with quick cuts showing multiple angles and uses of your product. Perfect for grabbing attention in the first 3 seconds.',
  'Create a fast-paced UGC-style montage video with quick cuts. Structure: 1) Quick hook (0-2s): Eye-catching first shot with product. 2) Montage sequence (2-13s): Multiple quick cuts showing different angles, uses, or features of the product. Each cut should be 1-2 seconds. 3) Final shot (13-15s): Strong closing shot with product prominently featured. Style: Vertical phone-shot, dynamic handheld camera movement, bright natural lighting, fast-paced editing rhythm, bold text overlays, energetic TikTok-style pacing, product featured in every shot.',
  'bold',
  'fast'
);

-- Seed Avatars (placeholder avatars)
-- Note: omit `id` to rely on the table default (uuid_generate_v4()).
INSERT INTO avatars (name, image_path, tags) VALUES
('Alex', 'avatars/alex.jpg', ARRAY['male', 'casual']),
('Sarah', 'avatars/sarah.jpg', ARRAY['female', 'professional']),
('Jordan', 'avatars/jordan.jpg', ARRAY['non-binary', 'casual']),
('Mike', 'avatars/mike.jpg', ARRAY['male', 'energetic']),
('Emma', 'avatars/emma.jpg', ARRAY['female', 'friendly']),
('Chris', 'avatars/chris.jpg', ARRAY['male', 'professional']),
('Taylor', 'avatars/taylor.jpg', ARRAY['non-binary', 'trendy']),
('Morgan', 'avatars/morgan.jpg', ARRAY['female', 'casual']),
('Sam', 'avatars/sam.jpg', ARRAY['male', 'friendly']),
('Riley', 'avatars/riley.jpg', ARRAY['non-binary', 'professional']),
('Casey', 'avatars/casey.jpg', ARRAY['female', 'energetic']),
('Drew', 'avatars/drew.jpg', ARRAY['male', 'trendy']),
('Quinn', 'avatars/quinn.jpg', ARRAY['non-binary', 'friendly']),
('Avery', 'avatars/avery.jpg', ARRAY['female', 'casual']),
('Blake', 'avatars/blake.jpg', ARRAY['male', 'professional']),
('Cameron', 'avatars/cameron.jpg', ARRAY['non-binary', 'energetic']),
('Dakota', 'avatars/dakota.jpg', ARRAY['female', 'trendy']),
('Ellis', 'avatars/ellis.jpg', ARRAY['male', 'friendly']),
('Finley', 'avatars/finley.jpg', ARRAY['non-binary', 'casual']),
('Harper', 'avatars/harper.jpg', ARRAY['female', 'professional']),
('Jamie', 'avatars/jamie.jpg', ARRAY['male', 'energetic']),
('Kai', 'avatars/kai.jpg', ARRAY['non-binary', 'friendly']),
('Logan', 'avatars/logan.jpg', ARRAY['female', 'trendy']),
('Noah', 'avatars/noah.jpg', ARRAY['male', 'casual']),
('Parker', 'avatars/parker.jpg', ARRAY['non-binary', 'professional']),
('Marcus', '/avatars/Avatar%206.jpg.jpeg', ARRAY['male', 'casual']),
('David', '/avatars/Avatar%207.jpg.jpeg', ARRAY['male', 'professional']),
('James', '/avatars/Avatar%208.jpg.jpeg', ARRAY['male', 'friendly']),
('Ryan', '/avatars/Avatar%209.jpg.jpeg', ARRAY['male', 'energetic']),
('Tyler', '/avatars/Avatar%2010.jpg.jpeg', ARRAY['male', 'trendy']);
