import path from "node:path";
import { fileURLToPath } from "node:url";

import nextEnv from "@next/env";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const { loadEnvConfig } = nextEnv;

loadEnvConfig(projectDir);
