import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export type ConvexDeploymentSelection = {
  deployment: string | null;
  project: string | null;
  rawText: string;
  team: string | null;
  type: string | null;
};

export function getCurrentConvexDeploymentSelection() {
  const deploymentInfo = runConvexCommand(["deployments"], {
    captureOutput: true,
  });
  const rawText = `${deploymentInfo.stdout}${deploymentInfo.stderr}`;

  return {
    ...parseConvexDeploymentSelection(rawText),
    rawText,
  } satisfies ConvexDeploymentSelection;
}

export function parseConvexDeploymentSelection(
  rawText: string,
): Omit<ConvexDeploymentSelection, "rawText"> {
  const lines = rawText.split(/\r?\n/);
  const values = new Map<string, string>();

  for (const line of lines) {
    const match = line.match(/^\s*(Team|Project|Deployment|Type):\s*(.+?)\s*$/);

    if (!match) {
      continue;
    }

    values.set(match[1].toLowerCase(), match[2]);
  }

  return {
    deployment: values.get("deployment") ?? null,
    project: values.get("project") ?? null,
    team: values.get("team") ?? null,
    type: values.get("type") ?? null,
  };
}

export function looksLikeProdDeployment(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized.includes("preview deployment") ||
    normalized.includes("(prod)") ||
    normalized.includes("type: prod")
  );
}

export function resolveSelectedDevConvexUrl(selection: ConvexDeploymentSelection) {
  if (looksLikeProdDeployment(selection.rawText)) {
    throw new Error(
      "Refusing to resolve a seed target because the current Convex selection looks like prod or preview.",
    );
  }

  const deployment = selection.deployment?.trim();
  const type = selection.type?.trim().toLowerCase() ?? "";

  if (!deployment) {
    throw new Error(
      "Could not resolve the current Convex deployment name from `npx convex deployments`.",
    );
  }

  if (type === "local" || deployment === "local") {
    return (
      firstNonEmptyEnv([
        "BOREAL_AGENT_CONVEX_URL_DEV",
        "BOREAL_AGENT_CONVEX_URL",
        "NEXT_PUBLIC_CONVEX_URL",
      ]) ??
      fail(
        "Local Convex deployment selected, but no local Convex URL was found in BOREAL_AGENT_CONVEX_URL_DEV, BOREAL_AGENT_CONVEX_URL, or NEXT_PUBLIC_CONVEX_URL.",
      )
    );
  }

  return `https://${deployment}.convex.cloud`;
}

export function runConvexCommand(
  args: string[],
  options?: {
    captureOutput?: boolean;
  },
) {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const commandArgs = ["convex", ...args];
  const result =
    process.platform === "win32"
      ? spawnSync(buildWindowsShellCommand(command, commandArgs), {
          cwd: process.cwd(),
          encoding: "utf8",
          shell: true,
          stdio: options?.captureOutput ? "pipe" : "inherit",
        })
      : spawnSync(command, commandArgs, {
          cwd: process.cwd(),
          encoding: "utf8",
          stdio: options?.captureOutput ? "pipe" : "inherit",
        });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    if (options?.captureOutput) {
      process.stdout.write(result.stdout ?? "");
      process.stderr.write(result.stderr ?? "");
    }

    throw new Error(`Failed to run: ${[command, ...commandArgs].join(" ")}`);
  }

  return result;
}

export function runNodeStripTypesScript(
  scriptRelativePath: string,
  args: string[],
  input?: {
    env?: NodeJS.ProcessEnv;
  },
) {
  const command = process.platform === "win32" ? "node.exe" : "node";
  const commandArgs = [
    "--experimental-strip-types",
    scriptRelativePath,
    ...args,
  ];
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: input?.env ?? process.env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Failed to run: ${[command, ...commandArgs].join(" ")}`);
  }
}

function firstNonEmptyEnv(keys: string[]) {
  const fileValues = readLocalEnvFile();

  for (const key of keys) {
    const runtimeValue = process.env[key]?.trim();

    if (runtimeValue) {
      return runtimeValue;
    }

    const fileValue = fileValues.get(key)?.trim();

    if (fileValue) {
      return fileValue;
    }
  }

  return null;
}

function readLocalEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const values = new Map<string, string>();

  if (!existsSync(envPath)) {
    return values;
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
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    values.set(key, value);
  }

  return values;
}

function buildWindowsShellCommand(command: string, args: string[]) {
  return [command, ...args].map(quoteWindowsShellToken).join(" ");
}

function quoteWindowsShellToken(token: string) {
  if (/^[A-Za-z0-9_./:-]+$/.test(token)) {
    return token;
  }

  return `"${token.replace(/"/g, '\\"')}"`;
}

function fail(message: string): never {
  throw new Error(message);
}
