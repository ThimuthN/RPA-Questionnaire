import { spawnSync } from "node:child_process";
import process from "node:process";

const result = spawnSync("npx prisma generate", {
  encoding: "utf8",
  shell: true,
  stdio: "pipe"
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.status === 0) {
  process.exit(0);
}

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}\n${result.error?.message ?? ""}`;
const isWindowsEngineLock =
  process.platform === "win32" &&
  output.includes("EPERM: operation not permitted, rename") &&
  output.includes("node_modules\\.prisma\\client\\query_engine-windows.dll.node");

if (isWindowsEngineLock) {
  console.error(
    "Prisma Client could not be regenerated because a running Next.js/node process is locking the Prisma engine.\n" +
      "Stop running dev processes, then run:\n" +
      "  npm run prisma:generate"
  );
}

if (result.error?.message) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
