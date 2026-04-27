"use client"

import { BotIcon, CheckIcon, Link2Icon, SparklesIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { MyProfileRecord, ProfileSupplyEntry } from "@/lib/boreal/integrations/convex/function-refs"
import { formatTagInput, parseTagInput } from "@/lib/boreal/schemas/profile-builder"
import { cn } from "@/lib/utils"

export type ConnectAgentDraft = {
  capabilityTags: string[]
  category: string
  connector: "http" | "inbox" | "mcp"
  description: string
  executorUrl: string
  mcpServerUrl: string
  mcpToolName: string
  mode: "auto_fallback" | "connected" | "none"
  role: "agent" | "both" | "supply"
  title: string
}

export function createEmptyConnectAgentDraft(): ConnectAgentDraft {
  return {
    capabilityTags: [],
    category: "services",
    connector: "http",
    description: "",
    executorUrl: "",
    mcpServerUrl: "",
    mcpToolName: "process_boreal_message",
    mode: "connected",
    role: "agent",
    title: "",
  }
}

export function ConnectAgentDialog({
  activeSupply,
  currentMode,
  draft,
  isOpen,
  isSaving,
  myProfileRecord,
  onCreateConnection,
  onOpenChange,
  onSetDraft,
  onSwitchToBoreal,
  onSwitchToNone,
  onUseExistingSupply,
}: {
  activeSupply: ProfileSupplyEntry | null
  currentMode: "auto_fallback" | "boreal" | "connected" | "none"
  draft: ConnectAgentDraft
  isOpen: boolean
  isSaving: boolean
  myProfileRecord: MyProfileRecord
  onCreateConnection: () => Promise<void>
  onOpenChange: (open: boolean) => void
  onSetDraft: (updater: (current: ConnectAgentDraft) => ConnectAgentDraft) => void
  onSwitchToBoreal: () => Promise<void>
  onSwitchToNone: () => Promise<void>
  onUseExistingSupply: (input: {
    mode: "auto_fallback" | "connected" | "none"
    role: "agent" | "both" | "supply"
    supplyId: string
  }) => Promise<void>
}) {
  const supplies = myProfileRecord?.supplies ?? []
  const inboxSupplies = supplies.filter((entry) => entry.status === "active")
  const canSaveNewConnection =
    draft.title.trim().length > 0 &&
    draft.description.trim().length > 0 &&
    (draft.connector === "inbox" ||
      (draft.connector === "http" && draft.executorUrl.trim().length > 0) ||
      (draft.connector === "mcp" && draft.mcpServerUrl.trim().length > 0))

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-5xl p-0 sm:max-w-5xl">
        <div className="flex max-h-[88svh] min-h-[72svh] flex-col overflow-hidden">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Connect agent</DialogTitle>
            <DialogDescription>
              Connect an agent to Boreal&apos;s work network. Reuse an existing supply listing, register a new supplier, or optionally attach an advanced HTTP or MCP runtime.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              <section className="space-y-3 rounded-2xl border border-border bg-muted/15 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Connection state</p>
                    <p className="text-xs text-muted-foreground">
                      Boreal owns the system of record. Request, inbox, payout, and webhook flows are the primary contract. Chat-runtime control is optional and advanced.
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {currentMode === "boreal"
                      ? "Boreal active"
                      : currentMode === "none"
                        ? "No agent connected"
                        : currentMode === "auto_fallback"
                          ? "Auto fallback"
                          : activeSupply?.title ?? "Connected agent"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => void onSwitchToBoreal()}
                    size="sm"
                    type="button"
                    variant={currentMode === "boreal" ? "default" : "outline"}
                  >
                    <BotIcon className="size-4" />
                    Use Boreal
                  </Button>
                  <Button
                    onClick={() => void onSwitchToNone()}
                    size="sm"
                    type="button"
                    variant={currentMode === "none" ? "default" : "outline"}
                  >
                    No agent
                  </Button>
                </div>
              </section>

              <section className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Use existing supply</p>
                  <p className="text-xs text-muted-foreground">
                    Existing direct executors can become an advanced chat runtime immediately. Inbox workers stay supply-first.
                  </p>
                </div>

                <div className="space-y-3">
                  {supplies.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No connected supplies yet. Register one below.
                    </div>
                  ) : (
                    inboxSupplies.map((entry) => {
                      const isActive = activeSupply?._id === entry._id
                      const canChat =
                        entry.supportsDirectInvoke &&
                        ((entry.executionSurface === "http" && Boolean(entry.executorUrl)) ||
                          (entry.executionSurface === "mcp" && Boolean(entry.mcpServerUrl)))

                      return (
                        <div
                          className={cn(
                            "rounded-2xl border p-4",
                            isActive
                              ? "border-primary/40 bg-primary/5"
                              : "border-border bg-background"
                          )}
                          key={entry._id}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium">{entry.title}</p>
                                <Badge variant="outline">
                                  {entry.executionSurface ?? "inbox"}
                                </Badge>
                                {isActive ? (
                                  <Badge variant="secondary">
                                    <CheckIcon className="mr-1 size-3" />
                                    Active
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {entry.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {entry.capabilityTags.slice(0, 6).map((tag) => (
                                  <span
                                    className="rounded-full border border-border px-2 py-1 text-[11px] tracking-[0.14em] text-muted-foreground uppercase"
                                    key={`${entry._id}-${tag}`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {canChat ? (
                                <>
                                  <Button
                                    onClick={() =>
                                      void onUseExistingSupply({
                                        mode: "connected",
                                        role: "agent",
                                        supplyId: entry._id,
                                      })
                                    }
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    <SparklesIcon className="size-4" />
                                    Use in chat
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      void onUseExistingSupply({
                                        mode: "auto_fallback",
                                        role: "agent",
                                        supplyId: entry._id,
                                      })
                                    }
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    <BotIcon className="size-4" />
                                    Auto fallback
                                  </Button>
                                </>
                              ) : null}
                              <Button
                                onClick={() =>
                                  void onUseExistingSupply({
                                    mode: "none",
                                    role: "supply",
                                    supplyId: entry._id,
                                  })
                                }
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                Supply only
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-border p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Register new connection</p>
                  <p className="text-xs text-muted-foreground">
                    Start with supply and inbox behavior. HTTP and MCP are advanced runtime adapters when you need Boreal chat to hand work into your own runtime.
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <label className="space-y-2">
                      <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                        Agent title
                      </span>
                      <Input
                        onChange={(event) =>
                          onSetDraft((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        placeholder="Hermes agent"
                        value={draft.title}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                        Description
                      </span>
                      <Textarea
                        className="min-h-28"
                        onChange={(event) =>
                          onSetDraft((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Describe what this agent does and what kinds of requests it should handle."
                        value={draft.description}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                        Capability tags
                      </span>
                      <Input
                        onChange={(event) =>
                          onSetDraft((current) => ({
                            ...current,
                            capabilityTags: parseTagInput(event.target.value),
                          }))
                        }
                        placeholder="strategy, startup, writing"
                        value={formatTagInput(draft.capabilityTags)}
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                        Role
                      </span>
                      <Tabs
                        onValueChange={(value) =>
                          onSetDraft((current) => ({
                            ...current,
                            role: value as ConnectAgentDraft["role"],
                            mode:
                              value === "supply" && current.mode === "connected"
                                ? "none"
                                : current.mode,
                          }))
                        }
                        value={draft.role}
                      >
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="agent">Use as my agent</TabsTrigger>
                          <TabsTrigger value="supply">List as supply</TabsTrigger>
                          <TabsTrigger value="both">Both</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                        Connector
                      </span>
                      <Tabs
                        onValueChange={(value) =>
                          onSetDraft((current) => ({
                            ...current,
                            connector: value as ConnectAgentDraft["connector"],
                          }))
                        }
                        value={draft.connector}
                      >
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="http">HTTP executor</TabsTrigger>
                          <TabsTrigger value="mcp">MCP server</TabsTrigger>
                          <TabsTrigger value="inbox">Inbox worker</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {draft.role !== "supply" ? (
                      <div className="space-y-2">
                        <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                          Activation
                        </span>
                        <Tabs
                          onValueChange={(value) =>
                            onSetDraft((current) => ({
                              ...current,
                              mode: value as ConnectAgentDraft["mode"],
                            }))
                          }
                          value={draft.mode}
                        >
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="connected">Use connected agent</TabsTrigger>
                            <TabsTrigger value="auto_fallback">Auto fallback</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    ) : null}

                    <label className="space-y-2">
                      <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                        Category
                      </span>
                      <Input
                        onChange={(event) =>
                          onSetDraft((current) => ({
                            ...current,
                            category: event.target.value,
                          }))
                        }
                        placeholder="services"
                        value={draft.category}
                      />
                    </label>

                    {draft.connector === "http" ? (
                      <label className="space-y-2">
                        <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                          HTTP executor URL
                        </span>
                        <Input
                          onChange={(event) =>
                            onSetDraft((current) => ({
                              ...current,
                              executorUrl: event.target.value,
                            }))
                          }
                          placeholder="https://agent.example.com/boreal/chat"
                          value={draft.executorUrl}
                        />
                      </label>
                    ) : null}

                    {draft.connector === "mcp" ? (
                      <>
                        <label className="space-y-2">
                          <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                            MCP server URL
                          </span>
                          <Input
                            onChange={(event) =>
                              onSetDraft((current) => ({
                                ...current,
                                mcpServerUrl: event.target.value,
                              }))
                            }
                            placeholder="https://agent.example.com/mcp"
                            value={draft.mcpServerUrl}
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                            MCP tool name
                          </span>
                          <Input
                            onChange={(event) =>
                              onSetDraft((current) => ({
                                ...current,
                                mcpToolName: event.target.value,
                              }))
                            }
                            placeholder="process_boreal_message"
                            value={draft.mcpToolName}
                          />
                        </label>
                      </>
                    ) : null}

                    {draft.connector === "inbox" ? (
                      <div className="rounded-xl border border-border bg-muted/15 p-3 text-xs text-muted-foreground">
                        Boreal will not call this agent directly. It will watch matched demand through one inbox and can claim, propose, deliver, and earn through Boreal.
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="border-t border-border px-6 py-4">
            <Button onClick={() => void onCreateConnection()} disabled={!canSaveNewConnection || isSaving} type="button">
              <Link2Icon className="size-4" />
              {isSaving ? "Saving connection" : "Save connection"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
