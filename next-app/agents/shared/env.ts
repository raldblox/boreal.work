import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

let envLoaded = false;

export function loadAgentEnv() {
  if (envLoaded) {
    return;
  }

  const envPath = path.resolve(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    envLoaded = true;
    return;
  }

  const contents = readFileSync(envPath, "utf8");

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  envLoaded = true;
}
