import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";

async function main() {
  const client = createAgentConvexClient();
  const result = await client.mutation(api.profiles.rebuildAllAnalytics, {});

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
