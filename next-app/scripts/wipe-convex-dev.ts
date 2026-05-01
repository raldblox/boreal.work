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
const MIN_BATCH_SIZE = 8;
const WIPE_RETRY_DELAYS_MS = [1500, 3000, 5000, 8000] as const;
const DEV_WIPE_TABLES = [
  "matchEvents",
  "matchCandidates",
  "activityEvents",
  "evidences",
  "fulfillments",
  "proposals",
  "artifacts",
  "disputes",
  "refunds",
  "transactionScenarioRuns",
  "transactionAuditEvents",
  "payouts",
  "settlements",
  "transactions",
  "webhookDeliveries",
  "webhookSubscriptions",
  "supplierRequestDecisions",
  "agentRequestEvents",
  "agentRequestSessions",
  "walletSessions",
  "transactionApprovals",
  "paymentAttempts",
  "serviceInvocations",
  "serviceProviderSyncs",
  "serviceCapabilities",
  "serviceProviders",
  "checkoutItems",
  "checkouts",
  "cartLineItems",
  "carts",
  "supplies",
  "intentRuns",
  "intents",
  "chatMessages",
  "conversations",
  "walletAccounts",
  "profiles",
  "users",
] as const;

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

  const summary = await wipeDevelopmentDeployment(batchSize);

  console.log(
    `Wipe completed. Deleted ${summary.totalDeleted} rows and ${summary.totalStorageDeleted} stored files across ${summary.tablesTouched} tables.`,
  );
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
  tableName: string;
}) {
  const confirm = input.confirm.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const tableName = input.tableName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  return `{batchSize:${input.batchSize},confirm:'${confirm}',tableName:'${tableName}'}`;
}

async function wipeDevelopmentDeployment(batchSize: number) {
  let totalDeleted = 0;
  let totalStorageDeleted = 0;
  let tablesTouched = 0;

  for (const tableName of DEV_WIPE_TABLES) {
    let deletedCount = 0;
    let deletedStorageCount = 0;
    let effectiveBatchSize = batchSize;

    for (;;) {
      const result = await runWipeDevelopmentBatch({
        batchSize: effectiveBatchSize,
        confirm: CONVEX_CONFIRMATION,
        tableName,
      });

      deletedCount += result.deletedCount;
      deletedStorageCount += result.deletedStorageCount;
      effectiveBatchSize = result.batchSize;

      if (!result.hasMore) {
        break;
      }
    }

    if (deletedCount > 0 || deletedStorageCount > 0) {
      tablesTouched += 1;
      console.log(
        `  ${tableName}: ${deletedCount} rows, ${deletedStorageCount} stored files deleted`,
      );
    }

    totalDeleted += deletedCount;
    totalStorageDeleted += deletedStorageCount;
  }

  return {
    tablesTouched,
    totalDeleted,
    totalStorageDeleted,
  };
}

async function runWipeDevelopmentBatch(input: {
  batchSize: number;
  confirm: string;
  tableName: string;
}) {
  let currentBatchSize = input.batchSize;

  for (;;) {
    try {
      return {
        ...(runConvexJson<{
          deletedCount: number;
          deletedStorageCount: number;
          hasMore: boolean;
          tableName: string;
        }>([
          "run",
          "internal.devTools.wipeDevelopmentBatch",
          formatConvexArgs({
            batchSize: currentBatchSize,
            confirm: input.confirm,
            tableName: input.tableName,
          }),
        ])),
        batchSize: currentBatchSize,
      };
    } catch (error) {
      if (!isRetryableConvexRunError(error)) {
        throw error;
      }

      for (const delayMs of WIPE_RETRY_DELAYS_MS) {
        console.warn(
          `  ${input.tableName}: wipe batch failed at size ${currentBatchSize}; retrying in ${Math.round(
            delayMs / 1000,
          )}s...`,
        );
        await sleep(delayMs);

        try {
          return {
            ...(runConvexJson<{
              deletedCount: number;
              deletedStorageCount: number;
              hasMore: boolean;
              tableName: string;
            }>([
              "run",
              "internal.devTools.wipeDevelopmentBatch",
              formatConvexArgs({
                batchSize: currentBatchSize,
                confirm: input.confirm,
                tableName: input.tableName,
              }),
            ])),
            batchSize: currentBatchSize,
          };
        } catch (retryError) {
          if (!isRetryableConvexRunError(retryError)) {
            throw retryError;
          }

          error = retryError;
        }
      }

      const nextBatchSize = Math.max(
        MIN_BATCH_SIZE,
        Math.floor(currentBatchSize / 2),
      );

      if (nextBatchSize === currentBatchSize) {
        throw error;
      }

      console.warn(
        `  ${input.tableName}: falling back from batch size ${currentBatchSize} to ${nextBatchSize}.`,
      );
      currentBatchSize = nextBatchSize;
    }
  }
}

function runConvexJson<T>(args: string[]) {
  const result = runConvexCommand(args, {
    captureOutput: true,
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();

  const parsed = parseConvexJsonOutput(output);

  return parsed as T;
}

function isRetryableConvexRunError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  return /fetch failed|etimedout|econnreset|eai_again|network|timeout|temporar|try again/i.test(
    message,
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseConvexJsonOutput(output: string) {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines[index]!);
    } catch {
      // Keep scanning until the last JSON line is found.
    }
  }

  const objectStart = output.indexOf("{");
  const objectEnd = output.lastIndexOf("}");

  if (objectStart !== -1 && objectEnd > objectStart) {
    const candidate = output.slice(objectStart, objectEnd + 1);

    try {
      return JSON.parse(candidate);
    } catch {
      // Fall through to the explicit error below.
    }
  }

  throw new Error(
    output
      ? `Could not parse Convex JSON output: ${output}`
      : "Convex returned no JSON output.",
  );
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Failed to wipe Convex development data.",
  );
  process.exit(1);
});
