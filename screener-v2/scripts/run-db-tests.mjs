import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

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

function parseTarget(rawUrl) {
  if (!rawUrl) {
    return null;
  }

  const url = new URL(rawUrl);
  return {
    baseIdentity: `${url.hostname}${url.pathname}`,
    schema: url.searchParams.get("schema") || "public"
  };
}

function runCommand(command, args, env, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env,
      stdio: ["pipe", "inherit", "inherit"],
      shell: false
    });

    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  const testEnv = {
    ...parseEnvFile(".env.test"),
    ...parseEnvFile(".env.test.local"),
    ...process.env
  };

  const testDatabaseUrl = testEnv.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL is required.");
  }

  const target = parseTarget(testDatabaseUrl);
  if (!target || target.schema === "public") {
    throw new Error("TEST_DATABASE_URL must target a non-public schema, for example ?schema=codex_test.");
  }

  const env = {
    ...process.env,
    ...testEnv,
    DATABASE_URL: testDatabaseUrl,
    DIRECT_URL: testEnv.TEST_DIRECT_URL || testDatabaseUrl
  };

  const nodeCommand = process.execPath;
  const prismaCliPath = path.resolve(process.cwd(), "node_modules/prisma/build/index.js");
  const vitestCliPath = path.resolve(process.cwd(), "node_modules/vitest/vitest.mjs");

  await runCommand(nodeCommand, [prismaCliPath, "db", "execute", "--url", testDatabaseUrl, "--stdin"], env, `CREATE SCHEMA IF NOT EXISTS "${target.schema}";`);
  await runCommand(nodeCommand, [prismaCliPath, "db", "push", "--skip-generate"], env);
  await runCommand(nodeCommand, [vitestCliPath, "run", "--config", "vitest.db.config.ts"], env);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
