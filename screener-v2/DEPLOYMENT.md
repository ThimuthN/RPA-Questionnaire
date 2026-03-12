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
- Deploy.

## Notes
- Invite links and employee verify URLs use `APP_URL` when present.
- Employee magic-link delivery is still dev-style: the API returns the token directly.
- The app now requires Postgres-backed persistence for invites, attempts, results, and magic tokens.
