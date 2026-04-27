import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawnSync } from "node:child_process";

const CONFIRMATION_PROMPT = "WIPE";
const CONVEX_CONFIRMATION = "WIPE DEVELOPMENT DATA";
const DEFAULT_BATCH_SIZE = 128;

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  if (args.includes("--prod")) {
    throw new Error(
      "convex:wipe:dev is development-only. Select a dev/local deployment instead of passing --prod.",
    );
  }

  const batchSize = parseBatchSize(args);
  const autoConfirm = args.includes("--yes");
  const deploymentInfo = runConvexCommand(["deployments"], {
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

  if (dryRun) {
    console.log("Dry run only. No Convex data was deleted.");
    return;
  }

  console.log("Wiping all app tables from the current Convex development deployment...");

  runConvexCommand([
    "run",
    "internal.devTools.wipeDevelopmentData",
    formatConvexArgs({
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

function formatConvexArgs(input: {
  batchSize: number;
  confirm: string;
}) {
  const confirm = input.confirm.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  return `{batchSize:${input.batchSize},confirm:'${confirm}'}`;
}

function runConvexCommand(
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

function buildWindowsShellCommand(command: string, args: string[]) {
  return [command, ...args].map(quoteWindowsShellToken).join(" ");
}

function quoteWindowsShellToken(token: string) {
  if (/^[A-Za-z0-9_./:-]+$/.test(token)) {
    return token;
  }

  return `"${token.replace(/"/g, '\\"')}"`;
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Failed to wipe Convex development data.",
  );
  process.exit(1);
});
