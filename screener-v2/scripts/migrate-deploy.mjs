import { execSync } from 'child_process';

execSync('npx prisma migrate deploy', {
  stdio: 'inherit',
  env: { ...process.env, PRISMA_MIGRATE_SKIP_ADVISORY_LOCK: '1' }
});
