import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceDir = resolve(root, "src", "renderer");
const outputDir = resolve(root, "dist", "renderer");

await mkdir(outputDir, { recursive: true });
await cp(resolve(sourceDir, "index.html"), resolve(outputDir, "index.html"));
await cp(resolve(sourceDir, "styles.css"), resolve(outputDir, "styles.css"));
