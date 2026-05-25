const unitDatabaseUrl =
  "postgresql://unit:unit@localhost:65432/screener_unit_no_connect?connect_timeout=1";

process.env.DATABASE_URL = unitDatabaseUrl;
process.env.DIRECT_URL = unitDatabaseUrl;
process.env.AUTH_SESSION_SECRET =
  process.env.AUTH_SESSION_SECRET ?? "unit-test-auth-secret-not-for-runtime";
process.env.APP_URL = process.env.APP_URL ?? "http://localhost:3000";
