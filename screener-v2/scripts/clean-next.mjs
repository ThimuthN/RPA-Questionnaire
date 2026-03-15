import { rmSync } from "node:fs";
import path from "node:path";

const nextDir = path.join(process.cwd(), ".next");

try {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("Cleared .next cache.");
} catch (error) {
  console.warn("Could not fully clear .next cache:", error instanceof Error ? error.message : error);
}
