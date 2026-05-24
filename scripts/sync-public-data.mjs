import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(
  fileURLToPath(new URL("../package.json", import.meta.url)),
);
const source = join(root, "src", "data");
const target = join(root, "public", "data");

if (!existsSync(source)) {
  throw new Error("Expected src/data to exist before syncing public data.");
}

rmSync(target, { force: true, recursive: true });
mkdirSync(dirname(target), { recursive: true });
cpSync(source, target, { recursive: true });
