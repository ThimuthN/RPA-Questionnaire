# Neon + Vercel Deployment

## 1. Create a Neon database
- Create a new Postgres project in Neon.
- Copy the pooled connection string into `DATABASE_URL`.
- Copy the direct connection string into `DIRECT_URL`.

## 2. Configure environment variables
- Copy `.env.example` to `.env.local` for local work.
- In Vercel, set:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `APP_URL`
  - `AUTH_SESSION_SECRET`
  - `BOOTSTRAP_ADMIN_EMAIL`
  - `BOOTSTRAP_ADMIN_PASSWORD`
  - `BOOTSTRAP_ADMIN_NAME`

## 3. Apply the schema
```bash
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
```

## 4. Deploy to Vercel
- Push the repo to GitHub.
- Import the project into Vercel.
- Confirm the environment variables are present for Preview and Production.
- From `screener-v2`, run:
```bash
npm run deploy:preview
# or
npm run deploy:prod
```

## Notes
- Invite links and employee verify URLs use `APP_URL` when present.
- Internal create/results/admin routes use app login with a signed session cookie.
- Public assessment entry remains open, but internal management features require sign-in.
- The bootstrap admin login comes from `BOOTSTRAP_ADMIN_*` env vars, and admins can create more users from the `/users` page after signing in.
- Employee magic-link delivery is still dev-style: the API returns the token directly.
- The app now requires Postgres-backed persistence for invites, attempts, results, and magic tokens.
- On Windows, if Prisma generation fails with `EPERM ... query_engine-windows.dll.node`, stop the running local `node`/`next dev` process and rerun `npm run prisma:generate`.

## Logging and debugging
- Server-side API failures now emit structured JSON logs with a `requestId`, route, method, path, deployment metadata, and stack trace.
- Most mutation error responses now include the same `requestId`, which makes it easier to match a user-reported failure to a Vercel log entry.
- To inspect a deployment after it fails, use:
```bash
vercel inspect <deployment-url> --logs
vercel logs <deployment-url>
```
- When debugging a report from the UI, search the Vercel logs for the returned `requestId`.
