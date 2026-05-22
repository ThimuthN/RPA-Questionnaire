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
- Register candidates, upload resumes, and track hiring notes
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
   - `BLOB_READ_WRITE_TOKEN` (for resume uploads)
3. Install dependencies:
   - `npm install`
4. Apply schema:
   - `npm run prisma:migrate:deploy`
5. Start dev server:
   - `npm run dev`

## Tests
- Create an isolated test database before running the suite.
- Copy `.env.test.example` to `.env.test.local`.
- Set `TEST_DATABASE_URL` and `TEST_DIRECT_URL` to the test database.
- Run:
  - `npm test`

Tests intentionally refuse to use `.env` or `.env.local`.

## Deploy
- From this folder, use:
  - `npm run deploy:preview`
  - `npm run deploy:prod`

## Notes for Windows
- If `npm install` ever hits a Prisma `EPERM ... query_engine-windows.dll.node` lock:
  - close running `next dev` / `node` processes
  - run `npm run prisma:generate`
- `npm run dev` now checks Prisma Client generation before starting. If it stops with a Prisma engine lock error, close the other Node/Next process first.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the exact Neon + Vercel steps.
