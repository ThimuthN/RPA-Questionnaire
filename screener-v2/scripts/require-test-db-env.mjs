import fs from "node:fs";
import path from "node:path";

function parseEnvFile(fileName) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return values;
}

function databaseIdentity(rawUrl) {
  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(rawUrl);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return "unparseable";
  }
}

const testEnv = {
  ...parseEnvFile(".env.test"),
  ...parseEnvFile(".env.test.local"),
  ...process.env
};

const testDatabaseUrl = testEnv.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  console.error(
    "Refusing to run DB tests without TEST_DATABASE_URL. Put an isolated Neon test database URL in .env.test.local."
  );
  process.exit(1);
}

const testIdentity = databaseIdentity(testDatabaseUrl);
const unsafeIdentities = [parseEnvFile(".env"), parseEnvFile(".env.local")]
  .map((env) => databaseIdentity(env.DATABASE_URL))
  .filter(Boolean);

if (unsafeIdentities.includes(testIdentity)) {
  console.error(
    "Refusing to run DB tests because TEST_DATABASE_URL matches .env or .env.local DATABASE_URL."
  );
  process.exit(1);
}
