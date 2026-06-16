# Northstar Hiring OS

Northstar Hiring OS is a candidate management and hiring workflow platform for managing jobs, applicants, assessments, and final decisions.

## Stack
- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Prisma
- PostgreSQL (Neon-ready)

## Current Runtime Scope (v1)

### Implemented
- **Jobs:** Create, publish, manage job postings
- **Applicants:** Accept public applications with resume uploads
- **Candidates:** Track candidates through pipeline (applicant → screening → pipeline → advanced review → hired/rejected)
- **Assessment Evidence:** Assign assessments, view results, export data
- **Permissions:** Role-based access control (view_candidates, manage_candidates, view_results, etc.)
- **Notes & Activity:** Track hiring decisions and candidate interactions

### Not Implemented
- Candidate login portal (candidates apply via public page only)
- Email automation or notifications
- Calendar integration or interview scheduling
- Offer management or acceptance flow
- Employee HRMS or performance management
- Interview panels or feedback forms
- AI ranking or automatic decisions

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
- Run the pure/domain suite:
  - `npm test`
- For DB-backed verification, create an isolated test database first.
- Copy `.env.test.example` to `.env.test.local`.
- Set `TEST_DATABASE_URL` and `TEST_DIRECT_URL` to the isolated test database.
- Run the guarded DB suite:
  - `npm run test:db`

DB-backed tests intentionally refuse to use `.env` or `.env.local`.

## Deploy
- From this folder, use:
  - `npm run deploy:preview`
  - `npm run deploy:prod`

## Notes for Windows
- If `npm install` ever hits a Prisma `EPERM ... query_engine-windows.dll.node` lock:
  - close running `next dev` / `node` processes
  - run `npm run prisma:generate`
- `npm run dev` now checks Prisma Client generation before starting. If it stops with a Prisma engine lock error, close the other Node/Next process first.

## Documentation
- Current release status and remaining work: [docs/RELEASE_READINESS_BACKLOG.md](./docs/RELEASE_READINESS_BACKLOG.md)
- Documentation map: [docs/README.md](./docs/README.md)
- Deployment steps: [DEPLOYMENT.md](./DEPLOYMENT.md)
