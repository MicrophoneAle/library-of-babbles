# Library of Babbles

Mystical first-floor personal website + library administration project built with Next.js App Router, Tailwind CSS, Framer Motion, and Supabase/PostgreSQL.

## Features

- Animated wooden-door intro that transitions into a first-floor lobby
- Lobby navigation hub with lectern intro, carved gold signs, shelves, vines, and under-construction stairway
- First-floor sections: `about`, `projects`, `blog`, `books`
- Books page backed by Supabase with graceful local sample-data fallback
- API route for reading and creating books
- SQL schema + seed scripts for immediate preview data

## Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- Framer Motion
- Supabase (PostgreSQL)
- Vercel-ready deployment structure

## Local setup

1. Install dependencies:
   - `npm install`
2. Copy `.env.example` to `.env.local` and fill in Supabase values.
3. In Supabase SQL editor, run:
   - `supabase/schema.sql`
   - `supabase/seed.sql`
4. Run locally:
   - `npm run dev`

If Supabase env vars are not configured, the books UI still renders using sample data from `src/lib/sample-books.ts`.
