"use client"

import { useState, type Dispatch, type SetStateAction } from "react"
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  SparklesIcon,
  StoreIcon,
  UserRoundPenIcon,
  WalletIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import { BorealAgentCue } from "@/components/chat/boreal-agent-cue"
import { Spinner as LoaderIcon } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  formatTagInput,
  hasPublishableSupplyListing,
  hasSavableProfileBuilderDraft,
  parseTagInput,
  type ProfileBuilderDraft,
} from "@/lib/boreal/schemas/profile-builder"

export function ProfileBuilderWorkspaceCard({
  draft,
  onOpen,
  sourceBrief,
}: {
  draft: ProfileBuilderDraft
  onOpen: () => void
  sourceBrief: string
}) {
  const hasListing = hasPublishableSupplyListing(draft)
  const hasProfile = hasSavableProfileBuilderDraft(draft)

  return (
      <div className="space-y-4 rounded-[1.2rem] border border-border/80 bg-background/75 p-4">
        <div className="space-y-1">
        <p className="text-sm font-medium">Profile editor</p>
        <p className="text-xs text-muted-foreground">
          Update the work profile first. Add one primary offer when you want
          paid work routed here.
        </p>
        </div>

      {sourceBrief.trim().length > 0 ? (
        <div className="space-y-2 border border-border p-3">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
            Source brief
          </p>
          <p className="text-sm text-muted-foreground">{sourceBrief}</p>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 border border-border p-3">
          <div className="flex items-center gap-2">
            <UserRoundPenIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Work profile draft</p>
          </div>
          <p className="text-sm">
            {draft.profile.headline || "Headline not drafted yet."}
          </p>
          <p className="text-xs text-muted-foreground">
            {draft.profile.bio ||
              "Open the builder to write the bio, skills, and capability tags."}
          </p>
          <div className="flex flex-wrap gap-2">
            {draft.profile.skillTags.slice(0, 6).map((tag) => (
              <span
                className="inline-flex items-center border border-border px-2 py-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2 border border-border p-3">
          <div className="flex items-center gap-2">
            <StoreIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Primary offer draft</p>
          </div>
          <p className="text-sm">
            {draft.listing.title || "Offer not drafted yet."}
          </p>
          <p className="text-xs text-muted-foreground">
            {draft.listing.description ||
              "Open the setup to shape the offer, delivery terms, pricing, and searchable details."}
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            <span className="border border-border px-2 py-1">
              {hasListing
                ? draft.listing.supplyType.replaceAll("_", " ")
                : "not published"}
            </span>
            {draft.listing.category ? (
              <span className="border border-border px-2 py-1">
                {draft.listing.category}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onOpen} size="sm" type="button">
          <SparklesIcon />
          Update profile
        </Button>
      </div>
    </div>
  )
}

type ProfileBuilderEditorProps = {
  draft: ProfileBuilderDraft
  isDrafting: boolean
  isSaving: boolean
  isWalletReady: boolean
  connectWalletLabel: string
  onConnectWallet: () => void
  onDraftWithBoreal: (message: string) => Promise<void>
  onSaveProfile: () => Promise<void>
  onSaveProfileAndListing: () => Promise<void>
  setDraft: Dispatch<SetStateAction<ProfileBuilderDraft>>
  setSourceMessage: Dispatch<SetStateAction<string>>
  sourceMessage: string
  variant?: "dialog" | "page"
}

export function ProfileBuilderEditor({
  draft,
  isDrafting,
  isSaving,
  isWalletReady,
  connectWalletLabel,
  onConnectWallet,
  onDraftWithBoreal,
  onSaveProfile,
  onSaveProfileAndListing,
  setDraft,
  setSourceMessage,
  sourceMessage,
  variant = "page",
}: ProfileBuilderEditorProps) {
  const canSaveProfile = hasSavableProfileBuilderDraft(draft)
  const canPublishListing = hasPublishableSupplyListing(draft)
  const isDialog = variant === "dialog"
  const combinedProfileTags = formatTagInput(
    Array.from(
      new Set([...draft.profile.skillTags, ...draft.profile.capabilityTags])
    )
  )
  const hasOfferDraftContent =
    draft.listing.title.trim().length > 0 ||
    draft.listing.subtitle.trim().length > 0 ||
    draft.listing.description.trim().length > 0 ||
    draft.listing.estimatedDeliveryLabel.trim().length > 0 ||
    draft.listing.capabilityTags.length > 0 ||
    draft.listing.priceAmount !== null
  const showOfferEditor = draft.listing.enabled || hasOfferDraftContent
  const [showOfferDetails, setShowOfferDetails] = useState(
    () =>
      draft.listing.category !== "services" ||
      draft.listing.supplyType !== "capability" ||
      draft.listing.deliveryType !== "async" ||
      draft.listing.priceType !== "scoped" ||
      draft.listing.capabilityTags.length > 0
  )

  return (
    <div
      className={
        isDialog
          ? "flex max-h-[88svh] min-h-[72svh] flex-col overflow-hidden"
          : "overflow-hidden rounded-[1.5rem] border border-border/80 bg-background shadow-[0_22px_70px_-46px_rgba(15,23,42,0.42)]"
      }
    >
      <div className={isDialog ? "border-b border-border px-6 py-4" : "border-b border-border px-5 py-5 sm:px-6"}>
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Profile editor
          </p>
          <div className="space-y-1">
            <h2 className="text-lg font-medium tracking-tight">
              Work profile and primary offer
            </h2>
            <p className="max-w-3xl text-sm/7 text-muted-foreground">
              Update the work profile fast. Add or refine one offer only if
              you want Boreal to route paid work here.
            </p>
          </div>
        </div>
      </div>

      <div className={isDialog ? "min-h-0 flex-1 overflow-y-auto px-6 py-5" : "px-5 py-5 sm:px-6"}>
        <div className="space-y-6">
          <section className="rounded-[1.25rem] border border-border/80 bg-muted/15 p-4 sm:p-5">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Automated profile optimizer</p>
                <p className="text-xs text-muted-foreground">
                  Start with a short prompt. Boreal rewrites the profile and
                  offer fields below so you can tighten them fast.
                </p>
              </div>
              <PromptInput
                className="w-full"
                onSubmit={async (input) => {
                  if (!input.text.trim()) {
                    return
                  }

                  setSourceMessage(input.text)
                  await onDraftWithBoreal(input.text)
                }}
              >
                <PromptInputBody>
                  <PromptInputTextarea
                    className="min-h-24 text-sm"
                    onChange={(event) => setSourceMessage(event.currentTarget.value)}
                    placeholder="Example: tighten my profile for Solana growth work and draft one clear offer for startup founders."
                    value={sourceMessage}
                  />
                </PromptInputBody>
              <PromptInputFooter className="items-center justify-between gap-2">
                <BorealAgentCue />
                <PromptInputSubmit
                  disabled={isDrafting || sourceMessage.trim().length === 0}
                  size="sm"
                  status={isDrafting ? "submitted" : undefined}
                >
                    Improve profile
                  </PromptInputSubmit>
                </PromptInputFooter>
              </PromptInput>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <section className="space-y-4 rounded-[1.25rem] border border-border/80 bg-background p-4 sm:p-5">
              <div className="space-y-1">
                <p className="text-sm font-medium">Work profile</p>
                <p className="text-xs text-muted-foreground">
                  What Boreal shows when someone checks who you are and what
                  you are reliable for.
                </p>
              </div>

              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                    Display name
                  </span>
                  <Input
                    className="h-10"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        profile: {
                          ...current.profile,
                          displayName: event.target.value,
                        },
                      }))
                    }
                    placeholder="How you should appear publicly"
                    value={draft.profile.displayName}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                    Headline
                  </span>
                  <Input
                    className="h-10"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        profile: {
                          ...current.profile,
                          headline: event.target.value,
                        },
                      }))
                    }
                    placeholder="Short line describing what you do best"
                    value={draft.profile.headline}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                    Bio
                  </span>
                  <Textarea
                    className="min-h-40 rounded-xl px-3 py-3 text-sm"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        profile: {
                          ...current.profile,
                          bio: event.target.value,
                        },
                      }))
                    }
                    placeholder="Explain what you offer, who it is for, and what makes you useful on Boreal."
                    value={draft.profile.bio}
                  />
                </label>

                <TagField
                  label="Search tags"
                  onChange={(value) =>
                    {
                      const tags = parseTagInput(value)
                      setDraft((current) => ({
                        ...current,
                        profile: {
                          ...current.profile,
                          capabilityTags: tags,
                          skillTags: tags,
                        },
                      }))
                    }
                  }
                  placeholder="startup strategy, research, landing pages"
                  value={combinedProfileTags}
                />
              </div>
            </section>

            <section className="space-y-4 rounded-[1.25rem] border border-border/80 bg-background p-4 sm:p-5">
              <div className="space-y-1">
                <p className="text-sm font-medium">Primary offer</p>
                <p className="text-xs text-muted-foreground">
                  Start with one concrete thing a buyer can understand fast.
                  Leave the rest for later.
                </p>
              </div>

              {!showOfferEditor ? (
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">No primary offer yet</p>
                      <p className="text-xs text-muted-foreground">
                        Add one clear sellable offer when you want Boreal to
                        route paid work to you.
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          listing: { ...current.listing, enabled: true },
                        }))
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <PlusIcon />
                      Add primary offer
                    </Button>
                  </div>
                </div>
              ) : null}

              {!isWalletReady && showOfferEditor ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/15 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Connect a payout wallet before publishing paid work
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You can still save the work profile now. Paid offers need
                      a wallet so Boreal knows where proceeds should go.
                    </p>
                  </div>
                  <Button onClick={onConnectWallet} size="sm" type="button" variant="outline">
                    <WalletIcon />
                    {connectWalletLabel}
                  </Button>
                </div>
              ) : null}

              {showOfferEditor ? (
                <div className="grid gap-4">
                  <label className="space-y-2">
                    <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                      Offer title
                    </span>
                    <Input
                      className="h-10"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          listing: {
                            ...current.listing,
                            enabled: true,
                            title: event.target.value,
                          },
                        }))
                      }
                      placeholder="What buyers should see first"
                      value={draft.listing.title}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                      Short summary
                    </span>
                    <Input
                      className="h-10"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          listing: {
                            ...current.listing,
                            enabled: true,
                            subtitle: event.target.value,
                          },
                        }))
                      }
                      placeholder="One-line explanation of the outcome"
                      value={draft.listing.subtitle}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                      Description
                    </span>
                    <Textarea
                      className="min-h-36 rounded-xl px-3 py-3 text-sm"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          listing: {
                            ...current.listing,
                            enabled: true,
                            description: event.target.value,
                          },
                        }))
                      }
                      placeholder="Describe the offer, the outcome, who it is for, and what is included."
                      value={draft.listing.description}
                    />
                  </label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                        Price amount
                      </span>
                      <Input
                        className="h-10"
                        inputMode="decimal"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            listing: {
                              ...current.listing,
                              enabled: true,
                              priceAmount:
                                event.target.value.trim().length === 0
                                  ? null
                                  : Number.parseFloat(event.target.value) || null,
                            },
                          }))
                        }
                        placeholder="Leave blank if price needs a quote"
                        type="number"
                        value={draft.listing.priceAmount ?? ""}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                        Est. delivery
                      </span>
                      <Input
                        className="h-10"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            listing: {
                              ...current.listing,
                              enabled: true,
                              estimatedDeliveryLabel: event.target.value,
                            },
                          }))
                        }
                        placeholder="2 days, same day, next week"
                        value={draft.listing.estimatedDeliveryLabel}
                      />
                    </label>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-muted/10 p-3">
                    <button
                      className="flex w-full items-center justify-between gap-3 text-left"
                      onClick={() => setShowOfferDetails((current) => !current)}
                      type="button"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Advanced offer</p>
                        <p className="text-xs text-muted-foreground">
                          Category, pricing model, delivery mode, and deeper
                          search tags.
                        </p>
                      </div>
                      {showOfferDetails ? (
                        <ChevronUpIcon className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDownIcon className="size-4 text-muted-foreground" />
                      )}
                    </button>

                    {showOfferDetails ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                            Category
                          </span>
                          <Input
                            className="h-10"
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                listing: {
                                  ...current.listing,
                                  category: event.target.value,
                                  enabled: true,
                                },
                              }))
                            }
                            placeholder="education, marketing, operations"
                            value={draft.listing.category}
                          />
                        </label>

                        <BuilderSelectField
                          label="Offer type"
                          onValueChange={(value) =>
                            setDraft((current) => ({
                              ...current,
                              listing: {
                                ...current.listing,
                                enabled: true,
                                supplyType:
                                  value === "product" ||
                                  value === "agent_tool" ||
                                  value === "collective"
                                    ? value
                                    : "capability",
                              },
                            }))
                          }
                          options={[
                            { label: "Capability", value: "capability" },
                            { label: "Product", value: "product" },
                            { label: "Agent tool", value: "agent_tool" },
                            { label: "Collective", value: "collective" },
                          ]}
                          value={draft.listing.supplyType}
                        />

                        <BuilderSelectField
                          label="Delivery"
                          onValueChange={(value) =>
                            setDraft((current) => ({
                              ...current,
                              listing: {
                                ...current.listing,
                                enabled: true,
                                deliveryType:
                                  value === "instant" || value === "scheduled"
                                    ? value
                                    : "async",
                              },
                            }))
                          }
                          options={[
                            { label: "Async", value: "async" },
                            { label: "Instant", value: "instant" },
                            { label: "Scheduled", value: "scheduled" },
                          ]}
                          value={draft.listing.deliveryType}
                        />

                        <BuilderSelectField
                          label="Pricing"
                          onValueChange={(value) =>
                            setDraft((current) => ({
                              ...current,
                              listing: {
                                ...current.listing,
                                enabled: true,
                                priceType:
                                  value === "fixed" || value === "hourly"
                                    ? value
                                    : "scoped",
                              },
                            }))
                          }
                          options={[
                            { label: "Scoped", value: "scoped" },
                            { label: "Fixed", value: "fixed" },
                            { label: "Hourly", value: "hourly" },
                          ]}
                          value={draft.listing.priceType}
                        />

                        <TagField
                          label="Offer tags"
                          onChange={(value) =>
                            setDraft((current) => ({
                              ...current,
                              listing: {
                                ...current.listing,
                                capabilityTags: parseTagInput(value),
                                enabled: true,
                              },
                            }))
                          }
                          placeholder="startup audit, math tutoring, study guides"
                          value={formatTagInput(draft.listing.capabilityTags)}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </div>

      <div className={isDialog ? "border-t border-border px-6 py-4" : "border-t border-border px-5 py-4 sm:px-6"}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-xs text-muted-foreground">
            Save the profile first. Publish the offer only when you want it
            live in Boreal.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isSaving || !canSaveProfile}
              onClick={() => void onSaveProfile()}
              size="sm"
              type="button"
              variant="outline"
            >
              {isSaving ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <CheckIcon />
              )}
              Update profile
            </Button>
            <Button
              disabled={isSaving || !canSaveProfile || !canPublishListing}
              onClick={() => void onSaveProfileAndListing()}
              size="sm"
              type="button"
            >
              {isSaving ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <StoreIcon />
              )}
              Publish offer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProfileBuilderDialog({
  draft,
  isDrafting,
  isOpen,
  isSaving,
  isWalletReady,
  connectWalletLabel,
  onConnectWallet,
  onDraftWithBoreal,
  onOpenChange,
  onSaveProfile,
  onSaveProfileAndListing,
  setDraft,
  setSourceMessage,
  sourceMessage,
}: ProfileBuilderEditorProps & {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-5xl p-0 sm:max-w-5xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Update profile</DialogTitle>
          <DialogDescription>
            Draft and edit your Boreal work profile and primary offer.
          </DialogDescription>
        </DialogHeader>
        <ProfileBuilderEditor
          connectWalletLabel={connectWalletLabel}
          draft={draft}
          isDrafting={isDrafting}
          isSaving={isSaving}
          isWalletReady={isWalletReady}
          onConnectWallet={onConnectWallet}
          onDraftWithBoreal={onDraftWithBoreal}
          onSaveProfile={onSaveProfile}
          onSaveProfileAndListing={onSaveProfileAndListing}
          setDraft={setDraft}
          setSourceMessage={setSourceMessage}
          sourceMessage={sourceMessage}
          variant="dialog"
        />
      </DialogContent>
    </Dialog>
  )
}

function TagField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </span>
      <Input
        className="h-10"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}

function BuilderSelectField({
  label,
  onValueChange,
  options,
  value,
}: {
  label: string
  onValueChange: (value: string) => void
  options: Array<{ label: string; value: string }>
  value: string
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </span>
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger className="h-10 w-full text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}
