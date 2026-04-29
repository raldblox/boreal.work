import {
  getCurrentConvexDeploymentSelection,
  looksLikeProdDeployment,
  resolveSelectedDevConvexUrl,
  runNodeStripTypesScript,
} from "./convex-dev-utils.ts";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  if (args.includes("--prod")) {
    throw new Error(
      "convex:reset:dev is development-only. Select a dev/local deployment instead of passing --prod.",
    );
  }

  const selection = getCurrentConvexDeploymentSelection();
  const deploymentText = selection.rawText.trim();

  if (deploymentText) {
    console.log(deploymentText);
  }

  if (looksLikeProdDeployment(selection.rawText)) {
    throw new Error(
      "Refusing to reset because the current Convex selection looks like prod or preview.",
    );
  }

  const resolvedSeedUrl = resolveSelectedDevConvexUrl(selection);

  console.log(`Resolved seed target: ${resolvedSeedUrl}`);

  if (dryRun) {
    console.log("Dry run only. No Convex data was deleted.");
    console.log(`Would wipe deployment ${selection.deployment ?? "unknown"}.`);
    console.log(`Would seed built-in agents on ${resolvedSeedUrl}.`);
    return;
  }

  const wipeArgs = ensureYesFlag(args);
  runNodeStripTypesScript("scripts/wipe-convex-dev.ts", wipeArgs);

  console.log(`Seeding built-in agents on ${resolvedSeedUrl}...`);

  runNodeStripTypesScript(
    "agents/scripts/seed-profiles.ts",
    ["--dev"],
    {
      env: {
        ...process.env,
        BOREAL_AGENT_CONVEX_URL_DEV: resolvedSeedUrl,
        BOREAL_AGENT_RUNTIME_TARGET: "dev",
      },
    },
  );
}

function ensureYesFlag(args: string[]) {
  return args.includes("--yes") ? [...args] : [...args, "--yes"];
}

void main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Failed to reset the Convex development deployment.",
  );
  process.exit(1);
});
