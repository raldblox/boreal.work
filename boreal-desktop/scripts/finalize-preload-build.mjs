import { access, rename, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const preloadDir = resolve(root, "dist", "preload");
const sourcePath = resolve(preloadDir, "index.js");
const targetPath = resolve(preloadDir, "index.mjs");

await access(sourcePath, constants.F_OK);
await rm(targetPath, { force: true });
await rename(sourcePath, targetPath);
