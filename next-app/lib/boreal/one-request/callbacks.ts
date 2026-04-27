import { api } from "../../../convex/_generated/api.js";
import { createConvexServerClient } from "../integrations/convex/server-client.ts";
import { isPublicRequestToken } from "../one-inbox/tokens.ts";

type Caller = {
  externalId: string;
};

export type OneRequestStatusCallbackPayload = {
  data?: unknown;
  errorCode?: string;
  message?: string;
  payoutTargets?: Array<{
    agentExternalId: string;
    amount: number;
    walletAddress: string;
  }>;
  result?: unknown;
  status?: string;
};

export type OneRequestEvidenceCallbackPayload = {
  data?: unknown;
  kind?: string;
  message?: string;
};

export type OneRequestHeartbeatCallbackPayload = {
  data?: unknown;
  message?: string;
};

export async function handleOneRequestStatusCallback(input: {
  caller: Caller;
  body: OneRequestStatusCallbackPayload;
  requestToken: string;
}) {
  if (isPublicRequestToken(input.requestToken)) {
    throw new Error("Supplier market requests do not accept one-request status callbacks.");
  }

  const status = input.body.status?.trim();

  if (!status) {
    throw new Error("status is required.");
  }

  const convex = createConvexServerClient();
  const session = await convex.query(api.requestApi.getRequestSession, {
    ownerExternalId: input.caller.externalId,
    requestToken: input.requestToken,
  });

  if (!session) {
    throw new Error("Request not found.");
  }

  if (status === "executing") {
    await convex.mutation(api.requestApi.markExecutionStarted, {
      ownerExternalId: input.caller.externalId,
      requestToken: input.requestToken,
    });

    await convex.mutation(api.requestApi.appendRequestEvent, {
      dataJson: safeStringify(input.body.data),
      message:
        input.body.message?.trim() || "Connected agent reported active execution progress.",
      ownerExternalId: input.caller.externalId,
      requestToken: input.requestToken,
      status: "executing",
      type: "request.agent_status",
    });

    return { accepted: true, status: "executing" as const };
  }

  if (status === "delivered") {
    await convex.mutation(api.requestApi.markRequestDelivered, {
      ownerExternalId: input.caller.externalId,
      payoutTargets: normalizePayoutTargets(input.body.payoutTargets),
      requestToken: input.requestToken,
      resultJson: safeStringify(
        input.body.result ?? input.body.data ?? { message: input.body.message ?? null },
      ),
    });

    return { accepted: true, status: "delivered" as const };
  }

  if (status === "failed") {
    await convex.mutation(api.requestApi.markRequestFailed, {
      errorCode: input.body.errorCode?.trim() || undefined,
      errorMessage:
        input.body.message?.trim() || "Connected agent reported a delivery failure.",
      ownerExternalId: input.caller.externalId,
      requestToken: input.requestToken,
    });

    return { accepted: true, status: "failed" as const };
  }

  throw new Error("Unsupported status callback. Use executing, delivered, or failed.");
}

export async function handleOneRequestEvidenceCallback(input: {
  caller: Caller;
  body: OneRequestEvidenceCallbackPayload;
  requestToken: string;
}) {
  if (isPublicRequestToken(input.requestToken)) {
    throw new Error("Supplier market requests do not accept one-request evidence callbacks.");
  }

  const convex = createConvexServerClient();
  const session = await convex.query(api.requestApi.getRequestSession, {
    ownerExternalId: input.caller.externalId,
    requestToken: input.requestToken,
  });

  if (!session) {
    throw new Error("Request not found.");
  }

  await convex.mutation(api.requestApi.appendRequestEvent, {
    dataJson: safeStringify({
      data: input.body.data ?? null,
      kind: input.body.kind?.trim() || null,
    }),
    message:
      input.body.message?.trim() || "Connected agent attached supporting evidence.",
    ownerExternalId: input.caller.externalId,
    requestToken: input.requestToken,
    status: normalizeSessionStatus(session.status),
    type: "request.evidence",
  });

  return { accepted: true };
}

export async function handleOneRequestHeartbeatCallback(input: {
  caller: Caller;
  body: OneRequestHeartbeatCallbackPayload;
  requestToken: string;
}) {
  if (isPublicRequestToken(input.requestToken)) {
    throw new Error("Supplier market requests do not accept one-request heartbeat callbacks.");
  }

  const convex = createConvexServerClient();
  const session = await convex.query(api.requestApi.getRequestSession, {
    ownerExternalId: input.caller.externalId,
    requestToken: input.requestToken,
  });

  if (!session) {
    throw new Error("Request not found.");
  }

  await convex.mutation(api.requestApi.appendRequestEvent, {
    dataJson: safeStringify(input.body.data),
    message:
      input.body.message?.trim() || "Connected agent heartbeat received by Boreal.",
    ownerExternalId: input.caller.externalId,
    requestToken: input.requestToken,
    status: normalizeSessionStatus(session.status),
    type: "request.heartbeat",
  });

  return {
    accepted: true,
    requestToken: input.requestToken,
    status: session.status,
  };
}

function normalizeSessionStatus(value: string) {
  if (
    value === "clarification_required" ||
    value === "delivered" ||
    value === "executing" ||
    value === "failed" ||
    value === "fallback_required" ||
    value === "paid" ||
    value === "payment_required" ||
    value === "received" ||
    value === "routing"
  ) {
    return value;
  }

  return "executing";
}

function normalizePayoutTargets(
  value: OneRequestStatusCallbackPayload["payoutTargets"],
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is { agentExternalId: string; amount: number; walletAddress: string } =>
      Boolean(
        entry &&
          typeof entry.agentExternalId === "string" &&
          typeof entry.amount === "number" &&
          Number.isFinite(entry.amount) &&
          typeof entry.walletAddress === "string",
      ),
  );
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return JSON.stringify({});
  }
}
