import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  getCurrentConvexDeploymentSelection,
  looksLikeProdDeployment,
  runConvexCommand,
} from "./convex-dev-utils.ts";

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
  const selection = getCurrentConvexDeploymentSelection();
  const deploymentText = selection.rawText;

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

  console.log("Wiping all app tables and referenced stored files from the current Convex development deployment...");

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
      `Type ${CONFIRMATION_PROMPT} to delete all rows and referenced stored files from the current Convex development deployment: `,
    )
    .then((answer) => answer.trim() === CONFIRMATION_PROMPT)
    .finally(() => readline.close());
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

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Failed to wipe Convex development data.",
  );
  process.exit(1);
});
