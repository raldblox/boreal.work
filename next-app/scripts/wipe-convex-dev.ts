import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawnSync } from "node:child_process";

import { loadAgentEnv } from "../agents/shared/env.ts";

const CONFIRMATION_PROMPT = "WIPE";
const CONVEX_CONFIRMATION = "WIPE DEVELOPMENT DATA";
const DEFAULT_BATCH_SIZE = 128;

async function main() {
  loadAgentEnv();

  const args = process.argv.slice(2);

  if (args.includes("--prod")) {
    throw new Error(
      "convex:wipe:dev is development-only. Select a dev/local deployment instead of passing --prod.",
    );
  }

  const batchSize = parseBatchSize(args);
  const autoConfirm = args.includes("--yes");
  const deploymentInfo = runConvexCommand(["convex", "deployments"], {
    captureOutput: true,
  });
  const deploymentText = `${deploymentInfo.stdout}${deploymentInfo.stderr}`;

  console.log(deploymentText.trim());

  if (looksLikeProdDeployment(deploymentText)) {
    throw new Error(
      "Refusing to wipe because the current Convex selection looks like prod or preview.",
    );
  }

  if (!autoConfirm) {
    const confirmed = await confirmWipe();

    if (!confirmed) {
      console.log("Cancelled. No Convex data was deleted.");
      return;
    }
  }

  console.log("Wiping all app tables from the current Convex development deployment...");

  runConvexCommand([
    "convex",
    "run",
    "internal.devTools.wipeDevelopmentData",
    JSON.stringify({
      batchSize,
      confirm: CONVEX_CONFIRMATION,
    }),
  ]);
}

function confirmWipe() {
  const readline = createInterface({ input, output });

  return readline
    .question(
      `Type ${CONFIRMATION_PROMPT} to delete all rows from the current Convex development deployment: `,
    )
    .then((answer) => answer.trim() === CONFIRMATION_PROMPT)
    .finally(() => readline.close());
}

function looksLikeProdDeployment(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized.includes("preview deployment") ||
    normalized.includes("(prod)") ||
    normalized.includes("type: prod")
  );
}

function parseBatchSize(args: string[]) {
  const inline = args.find((arg) => arg.startsWith("--batch-size="));

  if (inline) {
    return normalizeBatchSize(Number(inline.split("=")[1]));
  }

  const flagIndex = args.indexOf("--batch-size");

  if (flagIndex !== -1) {
    return normalizeBatchSize(Number(args[flagIndex + 1]));
  }

  return DEFAULT_BATCH_SIZE;
}

function normalizeBatchSize(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.max(1, Math.min(512, Math.floor(value)));
}

function runConvexCommand(
  args: string[],
  options?: {
    captureOutput?: boolean;
  },
) {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: options?.captureOutput ? "pipe" : "inherit",
  });

  if (result.status !== 0) {
    if (options?.captureOutput) {
      process.stdout.write(result.stdout ?? "");
      process.stderr.write(result.stderr ?? "");
    }

    throw new Error(`Failed to run: ${[command, ...args].join(" ")}`);
  }

  return result;
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Failed to wipe Convex development data.",
  );
  process.exit(1);
});
