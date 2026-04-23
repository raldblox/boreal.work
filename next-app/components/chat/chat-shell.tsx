"use client";

import { useState, useTransition } from "react";
import { makeFunctionReference } from "convex/server";
import { useQuery } from "convex/react";
import { ArrowUpRightIcon, BotIcon, LoaderIcon } from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Separator } from "@/components/ui/separator";
import type { RecentIntentPreview } from "@/lib/boreal/integrations/convex/function-refs";
import type { PersistedIntent } from "@/lib/boreal/schemas/intent";

import { IntentResultCard } from "./intent-result-card";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: PersistedIntent;
};

type ChatResponse = {
  assistantMessage: string;
  conversationId: string;
  intent: PersistedIntent;
  intentId: string;
};

const recentIntentQuery = makeFunctionReference<
  "query",
  { limit: number },
  RecentIntentPreview[]
>("intents:listRecent");

const starterPrompts = [
  "Turn this chat into a product hero image brief for Boreal.",
  "Extract the intent from this request and flag whether it needs video generation.",
  "I need a short launch video and matching stills for a listing page.",
];

export function ChatShell() {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const recentIntents = (useQuery(recentIntentQuery, {
    limit: 6,
  }) ?? []) as RecentIntentPreview[];

  async function submitMessage(message: string) {
    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const userMessage: ChatMessage = {
      content: trimmed,
      id: crypto.randomUUID(),
      role: "user",
    };

    startTransition(() => {
      setMessages((current) => [...current, userMessage]);
    });

    try {
      const response = await fetch("/api/chat", {
        body: JSON.stringify({
          conversationId,
          message: trimmed,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as
        | ChatResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Intent extraction failed.",
        );
      }

      if (!("assistantMessage" in payload)) {
        throw new Error("Intent extraction response was incomplete.");
      }

      setConversationId(payload.conversationId);

      startTransition(() => {
        setMessages((current) => [
          ...current,
          {
            content: payload.assistantMessage,
            id: payload.intentId,
            intent: payload.intent,
            role: "assistant",
          },
        ]);
      });
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Intent extraction failed.";
      setErrorMessage(messageText);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex h-[100svh] w-full max-w-7xl flex-col overflow-hidden px-6 py-8">
      <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-[minmax(0,1.45fr)_22rem]">
        <section className="flex min-h-0 overflow-hidden border border-border">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Conversation className="min-h-0">
              <ConversationContent className="p-6">
                {messages.length === 0 ? (
                  <ConversationEmptyState title="" description="">
                    <div className="flex max-w-2xl flex-col gap-6">
                      <div className="space-y-3">
                        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Boreal I2F Infra
                        </p>
                        <h1 className="font-medium text-3xl tracking-tight">
                          Intent extraction from chat, saved directly into
                          Convex.
                        </h1>
                        <p className="max-w-xl text-muted-foreground">
                          This MVP classifies text, image generation, and video
                          generation demand, emits a structured schema, and
                          persists the result for the broader
                          intent-to-fulfillment pipeline.
                        </p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        {starterPrompts.map((prompt) => (
                          <button
                            className="border border-border p-4 text-left text-sm transition-colors hover:text-foreground"
                            key={prompt}
                            onClick={() => {
                              void submitMessage(prompt);
                            }}
                            type="button"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </ConversationEmptyState>
                ) : (
                  messages.map((message) => (
                    <Message from={message.role} key={message.id}>
                      <MessageContent>
                        <MessageResponse>{message.content}</MessageResponse>
                        {message.intent ? (
                          <IntentResultCard intent={message.intent} />
                        ) : null}
                      </MessageContent>
                    </Message>
                  ))
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>

            <Separator />

            <div className="shrink-0 p-4">
              <PromptInput
                onSubmit={async (input) => {
                  await submitMessage(input.text);
                }}
              >
                <PromptInputBody>
                  <PromptInputTextarea placeholder="Describe the task, asset, or outcome you want Boreal to route." />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputTools>
                    <div className="text-xs text-muted-foreground">
                      Detects text, image, and video generation intent before
                      persistence.
                    </div>
                  </PromptInputTools>
                  <PromptInputSubmit
                    disabled={isSubmitting}
                    status={isSubmitting ? "submitted" : undefined}
                  />
                </PromptInputFooter>
              </PromptInput>

              {errorMessage ? (
                <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
            <section className="border border-border p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    First Agent
                  </p>
                  <h2 className="mt-2 font-medium text-lg">intent-extraction</h2>
                </div>
                {isSubmitting ? (
                  <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <BotIcon className="size-4 text-muted-foreground" />
                )}
              </div>

              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>Embedding-based modality scoring</li>
                <li>Structured output via AI SDK</li>
                <li>Convex persistence for chat + intents</li>
                <li>Reusable provider and DAL abstractions</li>
              </ul>
            </section>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden border border-border p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Convex Feed
                  </p>
                  <h2 className="mt-2 font-medium text-lg">Recent intents</h2>
                </div>
              </div>

              <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                {recentIntents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Saved intents will appear here after the first successful run.
                  </p>
                ) : (
                  recentIntents.map((intent) => (
                    <div className="border border-border p-4" key={intent._id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm">{intent.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {intent.summary}
                          </p>
                        </div>
                        <ArrowUpRightIcon className="mt-1 size-4 text-muted-foreground" />
                      </div>
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {intent.requestedOutputTypes
                          .map((value: string) => value.replaceAll("_", " "))
                          .join(" / ")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="border border-border p-5 text-sm text-muted-foreground">
              Provider selection is dynamic through the Boreal provider registry.
              OpenAI is the first adapter, but the agent layer does not bind to it
              directly.
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
