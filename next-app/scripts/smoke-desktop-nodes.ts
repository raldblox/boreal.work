import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";
import {
  buildPaymentAuthorizationMessage,
  createOpaqueToken,
} from "../lib/boreal/one-request/auth.ts";
import { createSmokeWalletIdentity } from "./lib/smoke-wallet-identities.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, "..");
const nextBinPath = path.resolve(projectDir, "node_modules", "next", "dist", "bin", "next");

async function main() {
  const client = createAgentConvexClient();
  const owner = createSmokeWalletIdentity("payouts-buyer", "desktop-owner");
  const now = Date.now();
  const externalBaseUrl = process.env.BOREAL_DESKTOP_SMOKE_BASE_URL?.trim() || null;
  const detectedBaseUrl = externalBaseUrl ?? (await findExistingBaseUrl());
  const port = 3200 + Math.floor(Math.random() * 200);
  const baseUrl = detectedBaseUrl || `http://127.0.0.1:${port}`;
  const authHeaders = {
    authorization: `Bearer ${owner.sessionToken}`,
    "content-type": "application/json",
  };

  await client.mutation(api.wallets.syncWalletAccount, {
    chainFamily: "solana",
    environment: "mainnet",
    networkKey: "solana:mainnet",
    ownerDisplayName: owner.displayName,
    ownerExternalId: owner.externalId,
    roles: ["connected", "buyer"],
    setAsDefaultBuyer: true,
    setAsDefaultPayout: false,
    walletAddress: owner.walletAddress,
    walletProvider: "siwx",
  });

  const requestToken = createOpaqueToken("req", `desktop-smoke:${now}`);
  const quoteToken = createOpaqueToken("quote", requestToken);
  await client.mutation(api.requestApi.createRequestSession, {
    chainFamily: "solana",
    conversationId: `desktop-node-conversation-${now}`,
    currency: "USD",
    idempotencyKey: `desktop-node-${now}`,
    message: "Desktop node smoke request",
    networkKey: "solana:mainnet",
    ownerDisplayName: owner.displayName,
    ownerExternalId: owner.externalId,
    paymentProtocol: "x402",
    quoteAmount: 0.01,
    quoteAuthorizationMessage: buildPaymentAuthorizationMessage({
      amount: 0.01,
      currency: "USD",
      quoteToken,
      requestToken,
    }),
    quoteExpiresAt: now + 15 * 60 * 1000,
    quoteToken,
    requestFingerprint: `desktop-node-fingerprint-${now}`,
    requestToken,
    requestedOutputTypes: ["text"],
    routeJson: JSON.stringify({
      selectedAgents: ["boreal-desktop"],
      summary: "Desktop node smoke route",
    }),
    status: "payment_required",
    summary: "Desktop node smoke route",
    title: "Desktop node smoke route",
    walletAddress: owner.walletAddress,
  });
  await client.mutation(api.requestApi.recordQuotePayment, {
    ownerExternalId: owner.externalId,
    payerSource: "agentcash",
    paymentReceiptJson: JSON.stringify({
      amount: 0.01,
      status: "paid",
      txHash: `tx-desktop-node-${now}`,
    }),
    paymentVerificationJson: JSON.stringify({
      confirmed: true,
      memoMatched: true,
      networkKey: "solana:mainnet",
    }),
    requestToken,
    txHash: `tx-desktop-node-${now}`,
  });

  const server = detectedBaseUrl ? null : startNextServer(port);

  try {
    if (server) {
      await waitForServer(baseUrl, server);
    } else {
      await waitForHttp(baseUrl);
    }

    const registerPayload = await requestJson({
      baseUrl,
      body: {
        appVersion: "0.1.0-smoke",
        availabilityStatus: "available",
        healthStatus: "active",
        localMachineCapabilities: ["filesystem_read", "git_read", "shell"],
        machineLabel: "Desktop Smoke Rig",
        maxConcurrentAssignments: 2,
        maxQueueDepth: 4,
        platform: "win32",
        runtimeFamilies: ["codex", "qvac"],
        stableNodeId: "desktop-smoke-rig",
      },
      headers: authHeaders,
      label: "register desktop node",
      method: "POST",
      path: "/api/v1/desktop-nodes/register",
      status: 201,
    });
    assert.equal(registerPayload.node.stableNodeId, "desktop-smoke-rig");
    assert.equal(registerPayload.node.machineLabel, "Desktop Smoke Rig");

    let assignmentsPayload = await requestJson({
      baseUrl,
      headers: authHeaders,
      label: "list desktop assignments",
      method: "GET",
      path: "/api/v1/desktop-nodes/assignments",
      status: 200,
    });

    for (const assignment of assignmentsPayload.assignments.filter((entry: { title: string }) =>
      entry.title.startsWith("Desktop node smoke"),
    )) {
      assignmentsPayload = await requestJson({
        baseUrl,
        headers: authHeaders,
        label: "delete stale smoke assignment",
        method: "DELETE",
        path: `/api/v1/desktop-nodes/assignments/${assignment.id}/status`,
        status: 200,
      });
    }

    const assignmentTitle = `Desktop node smoke assignment ${now}`;
    assignmentsPayload = await requestJson({
      baseUrl,
      body: {
        outputKinds: ["patch", "artifact"],
        requestCallbacksEnabled: true,
        requestToken,
        requiredCapabilities: ["filesystem_read", "filesystem_write", "git_read"],
        runtimeFamily: "codex",
        summary: "Run the private desktop queue smoke against a paid one-request session.",
        title: assignmentTitle,
        workspaceHint: "C:\\Users\\raldb\\boreal.work\\next-app",
      },
      headers: authHeaders,
      label: "create desktop assignment",
      method: "POST",
      path: "/api/v1/desktop-nodes/assignments",
      status: 201,
    });

    const createdAssignment = assignmentsPayload.assignments.find(
      (assignment: { title: string }) => assignment.title === assignmentTitle,
    );
    assert.ok(createdAssignment, "expected created desktop assignment to be present");
    assert.equal(createdAssignment.requestCallbacksEnabled, true);
    assert.equal(createdAssignment.requestToken, requestToken);

    const assignmentId = createdAssignment.id as string;

    assignmentsPayload = await requestJson({
      baseUrl,
      headers: authHeaders,
      label: "accept desktop assignment",
      method: "POST",
      path: `/api/v1/desktop-nodes/assignments/${assignmentId}/accept`,
      status: 200,
    });
    assert.equal(findAssignment(assignmentsPayload, assignmentId).status, "accepted_by_desktop");

    assignmentsPayload = await requestJson({
      baseUrl,
      body: {
        status: "executing_on_desktop",
      },
      headers: authHeaders,
      label: "mark desktop assignment executing",
      method: "POST",
      path: `/api/v1/desktop-nodes/assignments/${assignmentId}/status`,
      status: 200,
    });
    assert.equal(findAssignment(assignmentsPayload, assignmentId).status, "executing_on_desktop");

    const requestExecutingPayload = await requestJson({
      baseUrl,
      body: {
        message: "Desktop node started the owner-scoped execution.",
        status: "executing",
      },
      headers: authHeaders,
      label: "request status executing callback",
      method: "POST",
      path: `/api/v1/requests/${requestToken}/status`,
      status: 200,
    });
    assert.equal(requestExecutingPayload.accepted, true);

    const requestHeartbeatPayload = await requestJson({
      baseUrl,
      body: {
        data: {
          assignmentId,
          runtimeFamily: "codex",
        },
        message: "Desktop node heartbeat arrived during smoke execution.",
      },
      headers: authHeaders,
      label: "request heartbeat callback",
      method: "POST",
      path: `/api/v1/requests/${requestToken}/heartbeat`,
      status: 200,
    });
    assert.equal(requestHeartbeatPayload.accepted, true);

    assignmentsPayload = await requestJson({
      baseUrl,
      body: {
        evidenceCount: 1,
        status: "delivered_by_desktop",
      },
      headers: authHeaders,
      label: "mark desktop assignment delivered",
      method: "POST",
      path: `/api/v1/desktop-nodes/assignments/${assignmentId}/status`,
      status: 200,
    });
    assert.equal(findAssignment(assignmentsPayload, assignmentId).status, "delivered_by_desktop");
    assert.equal(findAssignment(assignmentsPayload, assignmentId).evidenceCount, 1);

    const requestDeliveredPayload = await requestJson({
      baseUrl,
      body: {
        result: {
          assignmentId,
          summary: "Desktop node delivered the owner-scoped result.",
        },
        status: "delivered",
      },
      headers: authHeaders,
      label: "request status delivered callback",
      method: "POST",
      path: `/api/v1/requests/${requestToken}/status`,
      status: 200,
    });
    assert.equal(requestDeliveredPayload.accepted, true);

    const heartbeatPayload = await requestJson({
      baseUrl,
      body: {
        appVersion: "0.1.0-smoke",
        availabilityStatus: "available",
        healthStatus: "active",
        machineLabel: "Desktop Smoke Rig",
        runtimeFamilies: ["codex", "qvac"],
        stableNodeId: "desktop-smoke-rig",
      },
      headers: authHeaders,
      label: "desktop node heartbeat",
      method: "POST",
      path: "/api/v1/desktop-nodes/heartbeat",
      status: 200,
    });
    assert.equal(heartbeatPayload.node.stableNodeId, "desktop-smoke-rig");

    const nodePayload = await requestJson({
      baseUrl,
      headers: authHeaders,
      label: "get desktop node",
      method: "GET",
      path: "/api/v1/desktop-nodes",
      status: 200,
    });
    assert.equal(nodePayload.node.machineLabel, "Desktop Smoke Rig");
    assert.ok(
      nodePayload.assignments.some((assignment: { id: string }) => assignment.id === assignmentId),
      "expected registered desktop node to expose the assignment queue",
    );

    const ownedSuppliesPayload = await requestJson({
      baseUrl,
      headers: authHeaders,
      label: "get owned supplies",
      method: "GET",
      path: "/api/v1/supplies?mine=true",
      status: 200,
    });
    const ownedDesktopSupply = ownedSuppliesPayload.supplies.find(
      (entry: { supply: { executionSurface: string | null; title: string } }) =>
        entry.supply.executionSurface === "desktop" && entry.supply.title === "Boreal Desktop",
    );
    assert.ok(ownedDesktopSupply, "expected owned supplies to include the desktop node supply");

    const publicSearchPayload = await requestJson({
      baseUrl,
      label: "search public supplies",
      method: "GET",
      path: "/api/v1/supplies?query=Boreal%20Desktop&limit=20",
      status: 200,
    });
    assert.equal(
      publicSearchPayload.supplies.some(
        (entry: { executionSurface: string | null; title: string }) =>
          entry.executionSurface === "desktop" || entry.title === "Boreal Desktop",
      ),
      false,
      "expected private desktop node supply to stay out of the public catalog",
    );

    assignmentsPayload = await requestJson({
      baseUrl,
      headers: authHeaders,
      label: "delete desktop assignment",
      method: "DELETE",
      path: `/api/v1/desktop-nodes/assignments/${assignmentId}/status`,
      status: 200,
    });
    assert.equal(
      assignmentsPayload.assignments.some((assignment: { id: string }) => assignment.id === assignmentId),
      false,
      "expected desktop assignment delete to remove the queue entry",
    );

    const events = await client.query(api.requestApi.listRequestEvents, {
      ownerExternalId: owner.externalId,
      requestToken,
    });
    const financials = await client.query(api.requestApi.getRequestFinancials, {
      ownerExternalId: owner.externalId,
      requestToken,
    });

    assert.ok(
      events.some((event) => event.eventType === "request.agent_status"),
      "expected executing callback event",
    );
    assert.ok(
      events.some((event) => event.eventType === "request.heartbeat"),
      "expected heartbeat callback event",
    );
    assert.ok(
      events.some((event) => event.eventType === "request.delivered"),
      "expected delivered callback event",
    );
    assert.equal(
      financials?.settlementStatus,
      "ready_for_payout",
      "expected delivered callback route to move the request into ready_for_payout",
    );

    console.log(
      JSON.stringify(
        {
          desktopSupplyId: nodePayload.node.supplyId,
          eventTypes: events.map((event) => event.eventType),
          requestToken,
          settlementStatus: financials?.settlementStatus ?? null,
        },
        null,
        2,
      ),
    );
  } finally {
    if (server) {
      await stopNextServer(server);
    }
  }
}

function startNextServer(port: number) {
  return spawn(process.execPath, [nextBinPath, "dev", "--port", String(port)], {
    cwd: projectDir,
    env: {
      ...process.env,
      NODE_ENV: "development",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function waitForServer(
  baseUrl: string,
  server: ReturnType<typeof startNextServer>,
) {
  let stdout = "";
  let stderr = "";

  server.stdout?.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  server.stderr?.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(
        `Next dev server exited early.\nstdout:\n${stdout}\nstderr:\n${stderr}`,
      );
    }

    try {
      const response = await fetch(`${baseUrl}/api/v1/supplies?limit=1`);
      if (response.status > 0) {
        return;
      }
    } catch {
      // Keep polling until the dev server accepts requests.
    }

    await delay(1000);
  }

  throw new Error(`Timed out waiting for Next dev server.\nstdout:\n${stdout}\nstderr:\n${stderr}`);
}

async function waitForHttp(baseUrl: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/supplies?limit=1`);
      if (response.status > 0) {
        return;
      }
    } catch {
      // Keep polling the provided base URL.
    }

    await delay(1000);
  }

  throw new Error(`Timed out waiting for existing server at ${baseUrl}.`);
}

async function findExistingBaseUrl() {
  const candidates = [3000, 3001, 3002, 3003, 3100, 3200, 3344];

  for (const port of candidates) {
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1000);
      const response = await fetch(`${baseUrl}/api/v1/supplies?limit=1`, {
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok) {
        return baseUrl;
      }
    } catch {
      // Keep scanning likely dev ports.
    }
  }

  return null;
}

async function stopNextServer(server: ReturnType<typeof startNextServer>) {
  if (server.exitCode !== null) {
    return;
  }

  server.kill("SIGTERM");

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (server.exitCode !== null) {
      return;
    }

    await delay(250);
  }

  if (server.exitCode === null) {
    server.kill("SIGKILL");
  }
}

async function requestJson(input: {
  baseUrl: string;
  body?: unknown;
  headers?: Record<string, string>;
  label: string;
  method: "DELETE" | "GET" | "POST";
  path: string;
  status: number;
}) {
  const response = await fetch(`${input.baseUrl}${input.path}`, {
    body: input.body ? JSON.stringify(input.body) : undefined,
    headers: input.headers,
    method: input.method,
  });
  const payload = await response.json().catch(() => null);

  assert.equal(
    response.status,
    input.status,
    `${input.label} failed with ${response.status}: ${JSON.stringify(payload)}`,
  );

  return payload as any;
}

function findAssignment(
  payload: {
    assignments: Array<{ evidenceCount: number; id: string; status: string }>;
  },
  assignmentId: string,
) {
  const assignment = payload.assignments.find((entry) => entry.id === assignmentId);
  assert.ok(assignment, `expected assignment ${assignmentId} to exist`);
  return assignment;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
