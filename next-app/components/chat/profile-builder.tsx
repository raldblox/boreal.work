"use client";

import type { Dispatch, SetStateAction } from "react";
import { CheckIcon, LoaderIcon, SparklesIcon, StoreIcon, UserRoundPenIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  formatTagInput,
  hasPublishableSupplyListing,
  hasSavableProfileBuilderDraft,
  parseTagInput,
  type ProfileBuilderDraft,
} from "@/lib/boreal/schemas/profile-builder";

export function ProfileBuilderWorkspaceCard({
  draft,
  onOpen,
  sourceBrief,
}: {
  draft: ProfileBuilderDraft;
  onOpen: () => void;
  sourceBrief: string;
}) {
  const hasListing = hasPublishableSupplyListing(draft);
  const hasProfile = hasSavableProfileBuilderDraft(draft);

  return (
    <div className="space-y-4 border border-border p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Profile and supply builder</p>
        <p className="text-xs text-muted-foreground">
          Boreal can draft this for you, but the final profile and listing stay editable before anything is saved.
        </p>
      </div>

      {sourceBrief.trim().length > 0 ? (
        <div className="space-y-2 border border-border p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
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
          <p className="text-sm">{draft.profile.headline || "Headline not drafted yet."}</p>
          <p className="text-xs text-muted-foreground">
            {draft.profile.bio || "Open the builder to write the bio, skills, and capability tags."}
          </p>
          <div className="flex flex-wrap gap-2">
            {draft.profile.skillTags.slice(0, 6).map((tag) => (
              <span
                className="inline-flex items-center border border-border px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
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
          <p className="text-sm">{draft.listing.title || "Listing not drafted yet."}</p>
          <p className="text-xs text-muted-foreground">
            {draft.listing.description ||
              "Open the builder to shape the listing, delivery terms, pricing, and searchable metadata."}
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="border border-border px-2 py-1">
              {hasListing ? draft.listing.supplyType.replaceAll("_", " ") : "not published"}
            </span>
            {draft.listing.category ? (
              <span className="border border-border px-2 py-1">{draft.listing.category}</span>
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
  );
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
  draft: ProfileBuilderDraft;
  isDrafting: boolean;
  isOpen: boolean;
  isSaving: boolean;
  onDraftWithBoreal: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onSaveProfile: () => Promise<void>;
  onSaveProfileAndListing: () => Promise<void>;
  setDraft: Dispatch<SetStateAction<ProfileBuilderDraft>>;
  setSourceMessage: Dispatch<SetStateAction<string>>;
  sourceMessage: string;
}) {
  const canSaveProfile = hasSavableProfileBuilderDraft(draft);
  const canPublishListing = hasPublishableSupplyListing(draft);

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-5xl p-0 sm:max-w-5xl">
        <div className="flex max-h-[88svh] min-h-[72svh] flex-col overflow-hidden">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Profile and supply builder</DialogTitle>
            <DialogDescription>
              Draft the profile manually or let Boreal shape it first. Save the public profile on its own, or publish the first listing together with it.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Source brief
                </span>
                <textarea
                  className="min-h-32 w-full border border-border bg-transparent p-3 text-sm outline-none"
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
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Display name
                      </span>
                      <Input
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            profile: { ...current.profile, displayName: event.target.value },
                          }))
                        }
                        placeholder="How you should appear publicly"
                        value={draft.profile.displayName}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Availability
                      </span>
                      <select
                        className="h-10 w-full border border-border bg-transparent px-3 text-sm outline-none"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            profile: {
                              ...current.profile,
                              availabilityStatus:
                                event.target.value === "limited" ||
                                event.target.value === "unavailable"
                                  ? event.target.value
                                  : "available",
                            },
                          }))
                        }
                        value={draft.profile.availabilityStatus}
                      >
                        <option value="available">Available</option>
                        <option value="limited">Limited</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Headline
                      </span>
                      <Input
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            profile: { ...current.profile, headline: event.target.value },
                          }))
                        }
                        placeholder="Short line describing what you do best"
                        value={draft.profile.headline}
                      />
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Bio
                      </span>
                      <textarea
                        className="min-h-40 w-full border border-border bg-transparent p-3 text-sm outline-none"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            profile: { ...current.profile, bio: event.target.value },
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
                          profile: { ...current.profile, skillTags: parseTagInput(value) },
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
                          profile: { ...current.profile, capabilityTags: parseTagInput(value) },
                        }))
                      }
                      placeholder="landing pages, research, math tutorials"
                      value={formatTagInput(draft.profile.capabilityTags)}
                    />

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Products or offer labels
                      </span>
                      <Input
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

                    <label className="flex items-center gap-3 text-sm text-muted-foreground md:col-span-2">
                      <input
                        checked={draft.profile.isPublic}
                        className="size-4 border border-border bg-transparent"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            profile: { ...current.profile, isPublic: event.target.checked },
                          }))
                        }
                        type="checkbox"
                      />
                      Keep this profile public in Boreal discovery
                    </label>
                  </div>
                </div>

                <div className="space-y-4 border border-border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Supply listing</p>
                    <p className="text-xs text-muted-foreground">
                      Publish one strong listing now, or save only the profile first.
                    </p>
                  </div>

                  <label className="flex items-center gap-3 text-sm text-muted-foreground">
                    <input
                      checked={draft.listing.enabled}
                      className="size-4 border border-border bg-transparent"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          listing: { ...current.listing, enabled: event.target.checked },
                        }))
                      }
                      type="checkbox"
                    />
                    Publish a first supply listing
                  </label>

                  <div className="grid gap-3">
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Listing title
                      </span>
                      <Input
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            listing: { ...current.listing, title: event.target.value },
                          }))
                        }
                        placeholder="What buyers should see first"
                        value={draft.listing.title}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Subtitle
                      </span>
                      <Input
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            listing: { ...current.listing, subtitle: event.target.value },
                          }))
                        }
                        placeholder="One-line context or positioning"
                        value={draft.listing.subtitle}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Description
                      </span>
                      <textarea
                        className="min-h-36 w-full border border-border bg-transparent p-3 text-sm outline-none"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            listing: { ...current.listing, description: event.target.value },
                          }))
                        }
                        placeholder="Describe the offer, outcome, buyer fit, and what is included."
                        value={draft.listing.description}
                      />
                    </label>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Category
                        </span>
                        <Input
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              listing: { ...current.listing, category: event.target.value },
                            }))
                          }
                          placeholder="education, marketing, operations"
                          value={draft.listing.category}
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Type
                        </span>
                        <select
                          className="h-10 w-full border border-border bg-transparent px-3 text-sm outline-none"
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              listing: {
                                ...current.listing,
                                supplyType:
                                  event.target.value === "product" ||
                                  event.target.value === "agent_tool" ||
                                  event.target.value === "collective"
                                    ? event.target.value
                                    : "capability",
                              },
                            }))
                          }
                          value={draft.listing.supplyType}
                        >
                          <option value="capability">Capability</option>
                          <option value="product">Product</option>
                          <option value="agent_tool">Agent tool</option>
                          <option value="collective">Collective</option>
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Delivery
                        </span>
                        <select
                          className="h-10 w-full border border-border bg-transparent px-3 text-sm outline-none"
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              listing: {
                                ...current.listing,
                                deliveryType:
                                  event.target.value === "instant" ||
                                  event.target.value === "scheduled"
                                    ? event.target.value
                                    : "async",
                              },
                            }))
                          }
                          value={draft.listing.deliveryType}
                        >
                          <option value="async">Async</option>
                          <option value="instant">Instant</option>
                          <option value="scheduled">Scheduled</option>
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Pricing
                        </span>
                        <select
                          className="h-10 w-full border border-border bg-transparent px-3 text-sm outline-none"
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              listing: {
                                ...current.listing,
                                priceType:
                                  event.target.value === "fixed" ||
                                  event.target.value === "hourly"
                                    ? event.target.value
                                    : "scoped",
                              },
                            }))
                          }
                          value={draft.listing.priceType}
                        >
                          <option value="scoped">Scoped</option>
                          <option value="fixed">Fixed</option>
                          <option value="hourly">Hourly</option>
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Price amount
                        </span>
                        <Input
                          inputMode="decimal"
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              listing: {
                                ...current.listing,
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
                        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Est. delivery
                        </span>
                        <Input
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
                            listing: { ...current.listing, capabilityTags: parseTagInput(value) },
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
              Manual save does not require Boreal approval. Boreal drafting only runs when you click Improve with Boreal.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={isDrafting || sourceMessage.trim().length === 0}
                onClick={() => void onDraftWithBoreal()}
                size="sm"
                type="button"
                variant="outline"
              >
                {isDrafting ? <LoaderIcon className="animate-spin" /> : <SparklesIcon />}
                Improve with Boreal
              </Button>
              <Button
                disabled={isSaving || !canSaveProfile}
                onClick={() => void onSaveProfile()}
                size="sm"
                type="button"
                variant="outline"
              >
                {isSaving ? <LoaderIcon className="animate-spin" /> : <CheckIcon />}
                Save profile
              </Button>
              <Button
                disabled={isSaving || !canSaveProfile || !canPublishListing}
                onClick={() => void onSaveProfileAndListing()}
                size="sm"
                type="button"
              >
                {isSaving ? <LoaderIcon className="animate-spin" /> : <StoreIcon />}
                Save profile & publish listing
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TagField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <Input onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </label>
  );
}
