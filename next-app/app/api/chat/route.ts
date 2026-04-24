import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { chatAssistantAgent } from "@/lib/boreal/agents/chat-assistant/agent";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = parseChatRequest(await request.json());
    const result = await chatAssistantAgent.run({
      ...body,
      requester: {
        displayName: session.user.name ?? undefined,
        externalId: session.user.id ?? undefined,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InvalidChatPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Chat request failed.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}

type ParsedChatRequest = {
  conversationId?: string;
  message: string;
  provider?: string;
};

class InvalidChatPayloadError extends Error {}

function parseChatRequest(value: unknown): ParsedChatRequest {
  if (!value || typeof value !== "object") {
    throw new InvalidChatPayloadError("Chat payload must be an object.");
  }

  const payload = value as Record<string, unknown>;
  const message = payload.message;
  const conversationId = payload.conversationId;
  const provider = payload.provider;

  if (typeof message !== "string" || message.trim().length === 0) {
    throw new InvalidChatPayloadError("Chat payload requires a message.");
  }

  if (
    conversationId !== undefined &&
    (typeof conversationId !== "string" || conversationId.trim().length === 0)
  ) {
    throw new InvalidChatPayloadError(
      "conversationId must be a non-empty string when provided.",
    );
  }

  return {
    conversationId,
    message,
    provider: typeof provider === "string" ? provider : undefined,
  };
}
