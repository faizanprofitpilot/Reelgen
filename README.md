# Reelgen - UGC Product Video Generator

Generate UGC-style product videos in seconds using AI avatars and templates optimized for TikTok and Reels ads.

## Overview

Reelgen enables ecommerce sellers to generate realistic UGC-style product videos using AI avatars and templates. Users select a template, upload product images, choose a script and avatar, and generate a single high-quality video clip (3–15 seconds) using Kling 2.6 via Runware.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router, TypeScript), Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase (Auth + Postgres + Storage)
- **Video Generation**: Kling 2.6 via Runware API
- **Hosting**: Vercel

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Runware API key

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration:
   ```bash
   # Copy contents of supabase/migrations/001_initial_schema.sql
   # Paste and execute in Supabase SQL Editor
   ```
3. Run the seed script:
   ```bash
   # Copy contents of supabase/seed.sql
   # Paste and execute in Supabase SQL Editor
   ```
4. Create storage buckets:
   - Go to Storage in Supabase dashboard
   - Create bucket named `uploads` (private)
   - Create bucket named `avatars` (public or authenticated-read)
5. Set up storage policies (already included in migration, but verify):
   - `uploads`: Users can upload to `projects/{project_id}/`
   - `avatars`: Authenticated users can read

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RUNWARE_API_KEY=your_runware_api_key

# Stripe (billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...   # $29/mo subscription
STRIPE_PRICE_GROWTH=price_...    # $79/mo subscription
STRIPE_PRICE_PRO=price_...       # $169/mo subscription
STRIPE_PRICE_PACK_100=price_...  # $35 one-time 100 credits
NEXT_PUBLIC_APP_URL=https://reelgen.xyz
```

Get these values from:
- Supabase: Project Settings → API
- Runware: Dashboard → API Keys
- Stripe: Dashboard → API Keys (secret key), Developers → Webhooks (signing secret), Products (create products/prices and paste price IDs)

### 4. Avatar Images

Upload avatar images to the `avatars` storage bucket. The seed script creates 10 placeholder avatar records. You can either:
- Replace the placeholder image paths in the database with actual image paths
- Upload images matching the paths in `seed.sql` (e.g., `avatars/alex.jpg`)

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Reelgen/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   ├── create/             # Create project flow
│   ├── dashboard/          # User dashboard
│   ├── login/              # Authentication
│   ├── projects/           # Project detail pages
│   └── page.tsx            # Landing page
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   └── ...                 # Custom components
├── lib/                    # Utility libraries
│   ├── supabase/           # Supabase clients
│   ├── prompts.ts          # Prompt building
│   ├── runware.ts          # Runware API integration
│   └── storage.ts          # Storage utilities
├── supabase/               # Database migrations and seeds
│   ├── migrations/         # SQL migrations
│   └── seed.sql            # Seed data
└── types/                  # TypeScript type definitions
```

## Database Schema

### Tables

- **templates**: Video generation templates with master prompts
- **avatars**: AI avatar options
- **projects**: User video generation projects
- **project_assets**: Product images associated with projects

### Row Level Security (RLS)

- Users can only access their own projects
- Templates and avatars are readable by all authenticated users
- Project assets are scoped to project ownership

## Features

### Core Features

- ✅ User authentication (Supabase Auth)
- ✅ Template selection (3 templates)
- ✅ Avatar selection (10 avatars)
- ✅ Product image uploads (1-5 images)
- ✅ Script input with length validation
- ✅ Video generation (3–15s)
- ✅ Pace and caption style controls
- ✅ Video preview and download
- ✅ Regenerate variations

### Video Generation Flow

1. User creates project and uploads product images
2. System builds Kling prompt from template + user inputs
3. Images uploaded to Runware
4. Video generation request sent to Runware (async)
5. System polls for completion
6. Generated video downloaded and stored in Supabase
7. User can preview and download

## API Routes

### Stripe billing (test mode)

1. Create Stripe products and prices (Starter $29/mo, Growth $79/mo, Pro $169/mo, Pack 100 credits $35 one-time). Copy the price IDs into `.env.local`.
2. For local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook` and use the printed `whsec_...` as `STRIPE_WEBHOOK_SECRET`.
3. On Vercel, add the webhook endpoint in Stripe Dashboard (e.g. `https://your-app.vercel.app/api/stripe/webhook`) and set `STRIPE_WEBHOOK_SECRET` to the signing secret.

### `/api/upload`
Uploads product images to Supabase Storage.

### `/api/projects/[id]/generate`
Initiates video generation for a project.

### `/api/projects/[id]/duplicate`
Creates a duplicate project and triggers regeneration.

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Ensure all environment variables from `.env.local` are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RUNWARE_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PACK_100`
- `NEXT_PUBLIC_APP_URL` (e.g. `https://reelgen.xyz`; use `http://localhost:3000` for local dev)

## Manual Testing Checklist

### Authentication
- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Redirect to dashboard after login
- [ ] Protected routes redirect to login when not authenticated

### Project Creation
- [ ] Can select template
- [ ] Can upload 1-5 product images
- [ ] Can select avatar
- [ ] Script length validation works (3–15s)
- [ ] Can configure duration, pace, caption style
- [ ] Can add extra instructions
- [ ] Review step shows all selections correctly

### Video Generation
- [ ] Project created with DRAFT status
- [ ] Generation API triggers successfully
- [ ] Status updates to GENERATING
- [ ] Status polling works on project page
- [ ] Video generation completes
- [ ] Status updates to COMPLETE
- [ ] Video preview displays correctly
- [ ] Download button works

### Error Handling
- [ ] Failed generations show error message
- [ ] Can retry failed generations
- [ ] Network errors handled gracefully

### Regenerate
- [ ] Regenerate creates new project
- [ ] New project has same settings
- [ ] Generation triggers automatically

## Troubleshooting

### Video Generation Fails

1. Check Runware API key is valid
2. Verify Runware API endpoint is accessible
3. Check image uploads succeeded
4. Review server logs for detailed errors

### Images Not Uploading

1. Verify Supabase storage buckets exist
2. Check storage policies allow uploads
3. Verify file sizes are within limits

### Authentication Issues

1. Verify Supabase URL and keys are correct
2. Check email confirmation is enabled/disabled as needed
3. Review Supabase auth logs

## Next Steps (Post-MVP)

- [ ] AI script generation (OpenAI integration)
- [ ] More templates (expand from 3 to 10+)
- [ ] Voice customization
- [ ] 60s stitched videos (multi-clip)
- [ ] Shopify integration
- [ ] Analytics dashboard
- [ ] Batch generation

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
