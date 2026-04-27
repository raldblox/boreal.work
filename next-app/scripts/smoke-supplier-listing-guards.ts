import assert from "node:assert/strict";

import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";
import {
  assertSupplyListingAllowed,
  MAX_ACTIVE_SUPPLY_LISTINGS_PER_SUPPLIER,
} from "../lib/boreal/supplies/guards.ts";

async function main() {
  const client = createAgentConvexClient();
  const now = Date.now();
  const ownerExternalId = `wallet:supply-guard-${now}`;

  for (let index = 0; index < MAX_ACTIVE_SUPPLY_LISTINGS_PER_SUPPLIER; index += 1) {
    const result = await client.mutation(api.supplies.createSupplyEntry, {
      capabilityTags: ["guard", "supply", `slot-${index}`],
      category: "operations",
      deliveryType: "async",
      description: `Guard smoke supply ${index}`,
      isCartEnabled: false,
      ownerActorKind: "agent",
      ownerDisplayName: ownerExternalId,
      ownerExternalId,
      ownerHandle: `supply-guard-${now}`,
      priceAmount: 0,
      priceType: "fixed",
      supplyType: "agent_tool",
      title: `Guard smoke supply ${index}`,
    });

    assert.equal(result.created, true, `expected listing ${index} to be created`);
  }

  const guardState = await client.query(api.supplies.getSupplyListingGuardState, {
    ownerExternalId,
  });

  assert.equal(
    guardState.activeSupplyCount,
    MAX_ACTIVE_SUPPLY_LISTINGS_PER_SUPPLIER,
    "expected the supplier active listing cap to be reached",
  );
  assert.throws(
    () => assertSupplyListingAllowed(guardState),
    /Too many active supply listings/,
    "expected the supply guard helper to reject the capped state",
  );

  const rejected = await client.mutation(api.supplies.createSupplyEntry, {
    capabilityTags: ["guard", "supply", "overflow"],
    category: "operations",
    deliveryType: "async",
    description: "Guard smoke overflow supply",
    isCartEnabled: false,
    ownerActorKind: "agent",
    ownerDisplayName: ownerExternalId,
    ownerExternalId,
    ownerHandle: `supply-guard-${now}`,
    priceAmount: 0,
    priceType: "fixed",
    supplyType: "agent_tool",
    title: "Guard smoke overflow supply",
  });

  assert.equal(rejected.created, false, "expected the overflow listing to be rejected");
  assert.equal(
    rejected.reason,
    "supply_limit_reached",
    "expected the supply guard rejection reason",
  );

  console.log(
    JSON.stringify(
      {
        activeSupplyCount: guardState.activeSupplyCount,
        status: "ok",
      },
      null,
      2,
    ),
  );
}

main();
