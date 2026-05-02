import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { api, createAgentConvexClient } from "../agents/shared/convex-client.ts";
import { createDesktopConnectGrant } from "../lib/boreal/desktop-connect/grants.ts";
import { verifySessionToken } from "../lib/boreal/one-request/auth.ts";
import { createSmokeWalletIdentity } from "./lib/smoke-wallet-identities.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, "..");
const nextBinPath = path.resolve(projectDir, "node_modules", "next", "dist", "bin", "next");

async function main() {
  const client = createAgentConvexClient();
  const owner = createSmokeWalletIdentity("payouts-buyer", "desktop-connect-owner");
  const externalBaseUrl = process.env.BOREAL_DESKTOP_SMOKE_BASE_URL?.trim() || null;
  const detectedBaseUrl = externalBaseUrl ?? (await findExistingBaseUrl());
  const port = 3400 + Math.floor(Math.random() * 100);
  const baseUrl = detectedBaseUrl || `http://127.0.0.1:${port}`;
  const server = detectedBaseUrl ? null : startNextServer(port);

  await client.mutation(api.wallets.syncWalletAccount, {
    chainFamily: "solana",
    environment: "mainnet",
    networkKey: "solana:mainnet",
    ownerDisplayName: owner.displayName,
    ownerExternalId: owner.externalId,
    roles: ["connected", "buyer", "payout"],
    setAsDefaultBuyer: true,
    setAsDefaultPayout: true,
    walletAddress: owner.walletAddress,
    walletProvider: "siwx",
  });

  try {
    if (server) {
      await waitForServer(baseUrl, server);
    } else {
      await waitForHttp(baseUrl);
    }

    const grant = createDesktopConnectGrant({
      ownerExternalId: owner.externalId,
      walletAddress: owner.walletAddress,
    });

    const payload = await requestJson({
      baseUrl,
      body: {
        grantToken: grant.grantToken,
      },
      label: "redeem desktop connect grant",
      method: "POST",
      path: "/api/v1/desktop-connect/redeem",
      status: 200,
    });

    assert.equal(payload.ownerExternalId, owner.externalId);
    assert.equal(payload.walletAddress, owner.walletAddress);
    assert.equal(
      verifySessionToken(payload.sessionToken).walletAddress,
      owner.walletAddress,
    );

    console.log(
      JSON.stringify(
        {
          ownerExternalId: payload.ownerExternalId,
          walletAddress: payload.walletAddress,
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
  label: string;
  method: "GET" | "POST";
  path: string;
  status: number;
}) {
  const response = await fetch(`${input.baseUrl}${input.path}`, {
    body: input.body ? JSON.stringify(input.body) : undefined,
    headers: input.body
      ? {
          "content-type": "application/json",
        }
      : undefined,
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

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
