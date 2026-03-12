# Innobot Premium Screener v1

Next.js + TypeScript assessment product for creating tests, running timed assessments, and reviewing results.

## Stack
- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Prisma
- PostgreSQL (Neon-ready)

## Current runtime scope
- Create tests with role + multi-stack setup
- Generate share links, tokens, passcodes, and Test IDs
- Run timed assessments with autosave
- Auto-score and store results
- Review results and export CSV/JSON
- Employee magic-link flow remains dev-style in this version

## Local setup
1. Copy `.env.example` to `.env.local`
2. Set:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `APP_URL`
3. Install dependencies:
   - `npm install`
4. Apply schema:
   - `npm run prisma:migrate:deploy`
5. Start dev server:
   - `npm run dev`

## Deploy
- Vercel is configured to run:
  - `npm run build:vercel`
- That executes:
  - `prisma migrate deploy`
  - `next build`

See [DEPLOYMENT.md](C:\Users\USER\Documents\RPA-Questionnaire\Screener v2\DEPLOYMENT.md) for the exact Neon + Vercel steps.
