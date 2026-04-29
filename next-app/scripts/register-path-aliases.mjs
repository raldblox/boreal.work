import { existsSync } from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptsDir, "..");

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith("@/")) {
      return nextResolve(specifier, context);
    }

    const relativePath = specifier.slice(2).replaceAll("/", path.sep);
    const candidates = [
      relativePath,
      `${relativePath}.ts`,
      `${relativePath}.tsx`,
      `${relativePath}.js`,
      `${relativePath}.mjs`,
      path.join(relativePath, "index.ts"),
      path.join(relativePath, "index.tsx"),
      path.join(relativePath, "index.js"),
      path.join(relativePath, "index.mjs"),
    ];

    for (const candidate of candidates) {
      const absolutePath = path.resolve(appRoot, candidate);

      if (!existsSync(absolutePath)) {
        continue;
      }

      return {
        shortCircuit: true,
        url: pathToFileURL(absolutePath).href,
      };
    }

    return nextResolve(specifier, context);
  },
});
