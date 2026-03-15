import { spawnSync } from "node:child_process";
import process from "node:process";

const result = spawnSync("npx prisma generate", {
  encoding: "utf8",
  shell: true,
  stdio: "pipe",
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.status === 0) {
  process.exit(0);
}

if (result.error && result.error.message) {
  console.error(result.error.message);
}

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}\n${result.error?.message ?? ""}`;
const isWindowsEperm =
  process.platform === "win32" &&
  output.includes("EPERM: operation not permitted, rename") &&
  output.includes("node_modules\\.prisma\\client\\query_engine-windows.dll.node");

if (isWindowsEperm) {
  console.warn(
    "Prisma generate skipped because Windows locked query_engine-windows.dll.node.\n" +
      "Stop running Next.js/node processes, then run: npm run prisma:generate",
  );
  process.exit(0);
}

process.exit(result.status ?? 1);
