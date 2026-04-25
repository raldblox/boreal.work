"use client"

import type { Dispatch, SetStateAction } from "react"
import {
  CheckIcon,
  LoaderIcon,
  SparklesIcon,
  StoreIcon,
  UserRoundPenIcon,
} from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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
    <div className="space-y-4 border border-border p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Profile and supply builder</p>
        <p className="text-xs text-muted-foreground">
          Boreal can draft this for you, but the final profile and listing stay
          editable before anything is saved.
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
            <p className="text-sm font-medium">Profile draft</p>
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
            <p className="text-sm font-medium">Listing draft</p>
          </div>
          <p className="text-sm">
            {draft.listing.title || "Listing not drafted yet."}
          </p>
          <p className="text-xs text-muted-foreground">
            {draft.listing.description ||
              "Open the builder to shape the listing, delivery terms, pricing, and searchable metadata."}
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
          {hasProfile || hasListing ? "Review builder" : "Open builder form"}
        </Button>
      </div>
    </div>
  )
}

export function ProfileBuilderDialog({
  draft,
  isDrafting,
  isOpen,
  isSaving,
  onDraftWithBoreal,
  onOpenChange,
  onSaveProfile,
  onSaveProfileAndListing,
  setDraft,
  setSourceMessage,
  sourceMessage,
}: {
  draft: ProfileBuilderDraft
  isDrafting: boolean
  isOpen: boolean
  isSaving: boolean
  onDraftWithBoreal: () => Promise<void>
  onOpenChange: (open: boolean) => void
  onSaveProfile: () => Promise<void>
  onSaveProfileAndListing: () => Promise<void>
  setDraft: Dispatch<SetStateAction<ProfileBuilderDraft>>
  setSourceMessage: Dispatch<SetStateAction<string>>
  sourceMessage: string
}) {
  const canSaveProfile = hasSavableProfileBuilderDraft(draft)
  const canPublishListing = hasPublishableSupplyListing(draft)

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-5xl p-0 sm:max-w-5xl">
        <div className="flex max-h-[88svh] min-h-[72svh] flex-col overflow-hidden">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Profile and supply builder</DialogTitle>
            <DialogDescription>
              Draft the profile manually or let Boreal shape it first. Save the
              public profile on its own, or publish the first listing together
              with it.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              <label className="space-y-2">
                <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                  Source brief
                </span>
                <Textarea
                  className="min-h-32 rounded-xl px-3 py-3 text-sm"
                  onChange={(event) => setSourceMessage(event.target.value)}
                  placeholder="Describe what you offer, who it is for, what makes you good at it, and anything you want Boreal to highlight."
                  value={sourceMessage}
                />
              </label>

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4 border border-border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Public profile</p>
                    <p className="text-xs text-muted-foreground">
                      This shapes how Boreal presents and matches you.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
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

                    <BuilderSelectField
                      label="Availability"
                      onValueChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          profile: {
                            ...current.profile,
                            availabilityStatus:
                              value === "limited" || value === "unavailable"
                                ? value
                                : "available",
                          },
                        }))
                      }
                      options={[
                        { label: "Available", value: "available" },
                        { label: "Limited", value: "limited" },
                        { label: "Unavailable", value: "unavailable" },
                      ]}
                      value={draft.profile.availabilityStatus}
                    />

                    <label className="space-y-2 md:col-span-2">
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

                    <label className="space-y-2 md:col-span-2">
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
                      label="Skill tags"
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          profile: {
                            ...current.profile,
                            skillTags: parseTagInput(value),
                          },
                        }))
                      }
                      placeholder="copywriting, tutoring, design systems"
                      value={formatTagInput(draft.profile.skillTags)}
                    />

                    <TagField
                      label="Capability tags"
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          profile: {
                            ...current.profile,
                            capabilityTags: parseTagInput(value),
                          },
                        }))
                      }
                      placeholder="landing pages, research, math tutorials"
                      value={formatTagInput(draft.profile.capabilityTags)}
                    />

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                        Products or offer labels
                      </span>
                      <Input
                        className="h-10"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            profile: {
                              ...current.profile,
                              productLabels: parseTagInput(event.target.value),
                            },
                          }))
                        }
                        placeholder="prompt packs, tutorials, audits"
                        value={formatTagInput(draft.profile.productLabels)}
                      />
                    </label>

                    <ToggleField
                      checked={draft.profile.isPublic}
                      label="Keep this profile public in Boreal discovery"
                      onCheckedChange={(checked) =>
                        setDraft((current) => ({
                          ...current,
                          profile: { ...current.profile, isPublic: checked },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4 border border-border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Supply listing</p>
                    <p className="text-xs text-muted-foreground">
                      Publish one strong listing now, or save only the profile
                      first.
                    </p>
                  </div>

                  <ToggleField
                    checked={draft.listing.enabled}
                    label="Publish a first supply listing"
                    onCheckedChange={(checked) =>
                      setDraft((current) => ({
                        ...current,
                        listing: { ...current.listing, enabled: checked },
                      }))
                    }
                  />

                  <div className="grid gap-3">
                    <label className="space-y-2">
                      <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                        Listing title
                      </span>
                      <Input
                        className="h-10"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            listing: {
                              ...current.listing,
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
                        Subtitle
                      </span>
                      <Input
                        className="h-10"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            listing: {
                              ...current.listing,
                              subtitle: event.target.value,
                            },
                          }))
                        }
                        placeholder="One-line context or positioning"
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
                              description: event.target.value,
                            },
                          }))
                        }
                        placeholder="Describe the offer, outcome, buyer fit, and what is included."
                        value={draft.listing.description}
                      />
                    </label>

                    <div className="grid gap-3 md:grid-cols-2">
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
                              },
                            }))
                          }
                          placeholder="education, marketing, operations"
                          value={draft.listing.category}
                        />
                      </label>

                      <BuilderSelectField
                        label="Type"
                        onValueChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            listing: {
                              ...current.listing,
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
                                priceAmount:
                                  event.target.value.trim().length === 0
                                    ? null
                                    : Number.parseFloat(event.target.value) ||
                                      null,
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
                                estimatedDeliveryLabel: event.target.value,
                              },
                            }))
                          }
                          placeholder="2 days, same day, next week"
                          value={draft.listing.estimatedDeliveryLabel}
                        />
                      </label>

                      <TagField
                        label="Listing tags"
                        onChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            listing: {
                              ...current.listing,
                              capabilityTags: parseTagInput(value),
                            },
                          }))
                        }
                        placeholder="quadratic equations, tutoring, study guides"
                        value={formatTagInput(draft.listing.capabilityTags)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Manual save does not require Boreal approval. Boreal drafting only
              runs when you click Improve with Boreal.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={isDrafting || sourceMessage.trim().length === 0}
                onClick={() => void onDraftWithBoreal()}
                size="sm"
                type="button"
                variant="outline"
              >
                {isDrafting ? (
                  <LoaderIcon className="animate-spin" />
                ) : (
                  <SparklesIcon />
                )}
                Improve with Boreal
              </Button>
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
                Save profile
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
                Save profile & publish listing
              </Button>
            </div>
          </DialogFooter>
        </div>
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

function ToggleField({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border/80 p-3 text-sm text-muted-foreground md:col-span-2">
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      <span>{label}</span>
    </label>
  )
}
