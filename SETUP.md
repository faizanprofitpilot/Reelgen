# Quick Setup Guide

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] Runware API key obtained

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Supabase Database Setup

1. Go to your Supabase project SQL Editor
2. Run the migration: Copy and paste contents of `supabase/migrations/001_initial_schema.sql`
3. Run the seed: Copy and paste contents of `supabase/seed.sql`

### 3. Supabase Storage Setup

1. Go to Storage in Supabase dashboard
2. Create bucket: `uploads` (private)
3. Create bucket: `avatars` (public or authenticated-read)
4. Verify storage policies are applied (from migration)

### 4. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RUNWARE_API_KEY=your-runware-api-key
```

### 5. Avatar Images (Optional)

The seed script creates 25 placeholder avatar records. You can:
- Upload actual avatar images to the `avatars` bucket matching the paths in seed.sql
- Or update the database with your own avatar image URLs/paths

### 6. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 (or https://reelgen.xyz in production)

## Verification

1. Sign up for a new account
2. Create a test project
3. Upload product images
4. Generate a video

## Troubleshooting

### "RUNWARE_API_KEY is not set"
- Check `.env.local` exists and contains `RUNWARE_API_KEY`
- Restart the dev server after adding env vars

### "Failed to upload image"
- Verify `uploads` bucket exists in Supabase
- Check storage policies allow authenticated uploads

### "Project not found"
- Verify database migrations ran successfully
- Check RLS policies are enabled

### Video generation fails
- Verify Runware API key is valid
- Check Runware API endpoint is correct (may need adjustment)
- Review server logs for detailed errors

## Next Steps

See `README.md` for full documentation and deployment instructions.
