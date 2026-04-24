import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { syncVideoArtifact } from "@/lib/boreal/dal/intent-repository";
import { resolveProviderAdapter } from "@/lib/boreal/integrations/providers/registry";

export const runtime = "nodejs";

type OpenAIWebhookEvent = {
  created_at?: number;
  data?: {
    id?: string;
  };
  id?: string;
  type?: string;
};

const TIMESTAMP_TOLERANCE_SECONDS = 300;

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const secret = process.env.OPENAI_WEBHOOK_SECRET;

    if (secret && !verifyWebhookSignature(request, rawBody, secret)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as OpenAIWebhookEvent;

    if (
      event.type !== "video.completed" &&
      event.type !== "video.failed"
    ) {
      return NextResponse.json({ received: true });
    }

    const videoId = event.data?.id;

    if (!videoId) {
      return NextResponse.json({ error: "Missing video id." }, { status: 400 });
    }

    const provider = resolveProviderAdapter();

    if (!provider.getVideoGeneration) {
      return NextResponse.json(
        { error: `Provider "${provider.key}" does not support video status retrieval.` },
        { status: 400 },
      );
    }

    const job = await provider.getVideoGeneration(videoId);
    await syncVideoArtifact({
      mediaType: job.mediaType ?? "video/mp4",
      metadataJson: JSON.stringify({
        ...job,
        downloadUrl:
          job.status === "completed"
            ? `/api/video-jobs/${job.jobId}/content`
            : undefined,
      }),
      remoteId: videoId,
      status: job.status === "completed" ? "ready" : job.status,
    });

    return NextResponse.json({ received: true, videoId });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook handling failed.",
      },
      { status: 500 },
    );
  }
}

function verifyWebhookSignature(request: Request, rawBody: string, secret: string) {
  const webhookId = request.headers.get("webhook-id");
  const webhookTimestamp = request.headers.get("webhook-timestamp");
  const webhookSignature = request.headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return false;
  }

  const timestampSeconds = Number(webhookTimestamp);

  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > TIMESTAMP_TOLERANCE_SECONDS) {
    return false;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const expected = createHmac("sha256", decodeWebhookSecret(secret))
    .update(signedContent)
    .digest("base64");

  return webhookSignature
    .split(" ")
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith("v1,"))
    .some((entry) => safeCompare(entry.slice(3), expected));
}

function decodeWebhookSecret(secret: string) {
  if (secret.startsWith("whsec_")) {
    const encoded = secret.slice("whsec_".length);

    try {
      return Buffer.from(encoded, "base64");
    } catch {
      return Buffer.from(secret, "utf8");
    }
  }

  return Buffer.from(secret, "utf8");
}

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}
