import fs from "node:fs";
import path from "node:path";

function parseEnvFile(fileName: string) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values: Record<string, string> = {};
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

function databaseIdentity(rawUrl?: string) {
  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(rawUrl);
    const schema = url.searchParams.get("schema") || "public";
    return `${url.hostname}${url.pathname}?schema=${schema}`;
  } catch {
    return "unparseable";
  }
}

function databaseBaseIdentity(rawUrl?: string) {
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

function databaseSchema(rawUrl?: string) {
  if (!rawUrl) {
    return null;
  }

  try {
    return new URL(rawUrl).searchParams.get("schema") || "public";
  } catch {
    return null;
  }
}

export function setup() {
  const testEnv = {
    ...parseEnvFile(".env.test"),
    ...parseEnvFile(".env.test.local"),
    ...process.env
  };

  const testDatabaseUrl = testEnv.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error(
      "Refusing to run tests without TEST_DATABASE_URL. Tests must use an explicit isolated database, never .env or .env.local."
    );
  }

  const testSchema = databaseSchema(testDatabaseUrl);
  if (!testSchema || testSchema === "public") {
    throw new Error(
      "Refusing to run DB tests because TEST_DATABASE_URL must target a non-public schema, for example ?schema=codex_test."
    );
  }

  const testDatabaseIdentity = databaseIdentity(testDatabaseUrl);
  const unsafeDatabaseUrls = [parseEnvFile(".env"), parseEnvFile(".env.local")]
    .map((env) => env.DATABASE_URL)
    .filter(Boolean);

  if (unsafeDatabaseUrls.some((url) => databaseIdentity(url) === testDatabaseIdentity)) {
    throw new Error(
      "Refusing to run tests because TEST_DATABASE_URL matches .env or .env.local DATABASE_URL."
    );
  }

  const testBaseIdentity = databaseBaseIdentity(testDatabaseUrl);
  const sharedBaseWithProduction = unsafeDatabaseUrls.some(
    (url) => databaseBaseIdentity(url) === testBaseIdentity
  );

  if (sharedBaseWithProduction && testSchema === "public") {
    throw new Error(
      "Refusing to run DB tests because shared staging database tests must use a non-public schema."
    );
  }

  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.DIRECT_URL = testEnv.TEST_DIRECT_URL ?? testDatabaseUrl;
}
