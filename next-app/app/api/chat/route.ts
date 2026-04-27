import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { chatAssistantAgent } from "@/lib/boreal/agents/chat-assistant/agent";
import type { ChatUiContext } from "@/lib/boreal/schemas/chat";

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = parseChatRequest(await request.json());
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    void (async () => {
      try {
        const result = await chatAssistantAgent.run({
          conversationId: body.conversationId,
          message: body.message,
          requester: {
            displayName: user.name ?? undefined,
            externalId: user.id ?? undefined,
          },
          uiContext: body.context,
        });

        for (const delta of chunkAssistantMessage(result.assistantMessage)) {
          await writer.write(
            encoder.encode(
              `${JSON.stringify({ delta, type: "assistant-delta" })}\n`,
            ),
          );
        }

        await writer.write(
          encoder.encode(
            `${JSON.stringify({ payload: result, type: "final" })}\n`,
          ),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Chat request failed.";

        await writer.write(
          encoder.encode(
            `${JSON.stringify({ message, type: "error" })}\n`,
          ),
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Cache-Control": "no-store",
        Connection: "keep-alive",
        "Content-Type": "application/x-ndjson; charset=utf-8",
      },
    });
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
  context?: ChatUiContext;
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
  const context = payload.context;
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
    context: isValidChatContext(context) ? context : undefined,
    message,
    provider: typeof provider === "string" ? provider : undefined,
  };
}

function isValidChatContext(value: unknown): value is ChatUiContext {
  if (!value || typeof value !== "object") {
    return false;
  }

  const context = value as Record<string, unknown>;

  return context.surface === "home" || context.surface === "request";
}

function chunkAssistantMessage(message: string) {
  if (!message.trim()) {
    return [];
  }

  const chunks: string[] = [];
  const words = message.split(/(\s+)/);
  let current = "";

  for (const part of words) {
    if ((current + part).length > 48 && current) {
      chunks.push(current);
      current = part;
      continue;
    }

    current += part;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}
