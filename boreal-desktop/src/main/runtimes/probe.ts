import { access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { RuntimeFamily, RuntimeProbe } from "../../shared/contracts.js";

const execFileAsync = promisify(execFile);

type RuntimeConfig = {
  authFile?: string;
  commands: string[];
  family: RuntimeFamily;
  supportedJobTypes: string[];
};

const runtimeConfigs: RuntimeConfig[] = [
  {
    authFile: join(homedir(), ".codex", "auth.json"),
    commands: ["codex.cmd", "codex"],
    family: "codex",
    supportedJobTypes: [
      "repo_analysis",
      "implementation",
      "debugging",
      "artifact_delivery",
      "local_build",
    ],
  },
  {
    commands: ["qvac.exe", "qvac.cmd", "qvac"],
    family: "qvac",
    supportedJobTypes: ["local_inference", "embeddings", "transcription", "ocr"],
  },
];

export async function probeAllRuntimes(): Promise<RuntimeProbe[]> {
  const probes = await Promise.all(runtimeConfigs.map((config) => probeRuntime(config)));
  return probes;
}

async function probeRuntime(config: RuntimeConfig): Promise<RuntimeProbe> {
  const now = new Date().toISOString();
  const commandResult = await findCommand(config.commands);
  const notes: string[] = [];
  let version: string | null = null;
  let availability: RuntimeProbe["availability"] = "missing";

  if (commandResult.path && commandResult.command) {
    availability = "available";
    version = await probeVersion(commandResult.command);
    if (!version) {
      notes.push("Command found, but version probe did not return a value.");
    }
  } else {
    notes.push("Executable not found on PATH.");
  }

  const authState =
    config.family === "qvac"
      ? "not_required"
      : await fileExists(config.authFile ?? "") ? "authenticated" : "missing";

  if (config.family === "codex" && authState === "missing") {
    notes.push("Codex auth cache was not detected under ~/.codex/auth.json.");
  }

  return {
    authState,
    availability,
    command: commandResult.command,
    family: config.family,
    lastCheckedAt: now,
    notes,
    path: commandResult.path,
    supportedJobTypes: config.supportedJobTypes,
    version,
  };
}

async function findCommand(commands: string[]): Promise<{
  command: string | null;
  path: string | null;
}> {
  for (const command of commands) {
    try {
      const locator = process.platform === "win32" ? "where.exe" : "which";
      const { stdout } = await execFileAsync(locator, [command], { timeout: 3000 });
      const firstLine = stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
      if (firstLine) {
        return { command, path: firstLine };
      }
    } catch {
      continue;
    }
  }

  return { command: null, path: null };
}

async function probeVersion(command: string): Promise<string | null> {
  try {
    const { stdout, stderr } = await execFileAsync(command, ["--version"], {
      timeout: 4000,
    });
    const output = `${stdout}\n${stderr}`.trim();
    return output.length > 0 ? output.split(/\r?\n/)[0]?.trim() ?? null : null;
  } catch {
    return null;
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
