"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useMutation } from "convex/react"
import { signIn, useSession } from "next-auth/react"
import { ArrowLeftIcon, LogInIcon } from "lucide-react"

import { AccountSettingsSurface } from "@/components/account/account-settings-surface"
import { ProfileBuilderEditor } from "@/components/chat/profile-builder"
import { useShellData } from "@/components/shell-data-provider"
import { Button } from "@/components/ui/button"
import { DotMatrixSpinner } from "@/components/ui/dotmatrix-spinner"
import { convexFunctionRefs } from "@/lib/boreal/integrations/convex/function-refs"
import { usePayment } from "@/hooks/use-payment"
import {
  getBorealChainEnvironment,
  getBorealPrimaryChainFamily,
  getDefaultBorealNetworkKey,
} from "@/lib/boreal/commerce/networks"
import { buildAccountSettingsHref } from "@/lib/boreal/navigation/shell-links"
import {
  applyProfileBuilderListingPath,
  buildProfileBuilderDraftFromRecord,
  createEmptyProfileBuilderDraft,
  hasPublishableSupplyListing,
  hasSavableProfileBuilderDraft,
  mergeProfileBuilderDraft,
  profileBuilderToProfileMutationInput,
  profileBuilderToSupplyMutationInput,
  type ProfileBuilderListingPath,
  type ProfileBuilderDraft,
} from "@/lib/boreal/schemas/profile-builder"

export function AccountPageClient() {
  const { data: session, status } = useSession()
  const ownerExternalId = session?.user?.id
  const {
    connectedWallets,
    defaultWallet,
    defaultWalletAddress,
    isWalletConnected,
    isWalletReady,
    openWalletModal,
  } = usePayment()
  const runtimeEnvironment = getBorealChainEnvironment()
  const runtimePrimaryChainFamily = getBorealPrimaryChainFamily()
  const runtimeDefaultNetworkKey = getDefaultBorealNetworkKey({
    chainFamily: runtimePrimaryChainFamily,
    environment: runtimeEnvironment,
  })
  const {
    isReady: isShellDataReady,
    myProfileRecord,
    purgePublicMarket,
    refreshShellData,
    walletAccounts,
  } = useShellData()
  const setDefaultPayoutWalletAccount = useMutation(
    convexFunctionRefs.setDefaultPayoutWalletAccount
  )
  const upsertMyProfile = useMutation(convexFunctionRefs.upsertMyProfile)
  const createSupplyEntry = useMutation(convexFunctionRefs.createSupplyEntry)

  const [isProfileBuilderOpen, setIsProfileBuilderOpen] = useState(false)
  const [profileBuilderMessage, setProfileBuilderMessage] = useState("")
  const [isDraftingProfileBuilder, setIsDraftingProfileBuilder] =
    useState(false)
  const [isSavingProfileBuilder, setIsSavingProfileBuilder] = useState(false)
  const [isProfileAvailabilityUpdating, setIsProfileAvailabilityUpdating] =
    useState(false)
  const [isSettingDefaultPayoutWalletId, setIsSettingDefaultPayoutWalletId] =
    useState<string | null>(null)
  const [editingSupplyId, setEditingSupplyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [profileBuilderDraft, setProfileBuilderDraft] =
    useState<ProfileBuilderDraft>(createEmptyProfileBuilderDraft())
  const editingSupply =
    editingSupplyId && myProfileRecord
      ? myProfileRecord.supplies.find((supply) => supply._id === editingSupplyId) ??
        null
      : null

  function handleOpenWalletModal() {
    void openWalletModal()
  }

  function openProfileBuilder(
    path?: Exclude<ProfileBuilderListingPath, "provider_sync">
  ) {
    const baseDraft = myProfileRecord
      ? buildProfileBuilderDraftFromRecord(myProfileRecord)
      : createEmptyProfileBuilderDraft(session?.user?.name ?? "")
    const nextDraft = path
      ? applyProfileBuilderListingPath(baseDraft, path)
      : baseDraft

    setEditingSupplyId(null)
    setProfileBuilderDraft(nextDraft)
    setProfileBuilderMessage("")
    setIsProfileBuilderOpen(true)
  }

  function openOwnedSupplyEditor(supplyId: string) {
    if (!myProfileRecord) {
      return
    }

    const targetSupply =
      myProfileRecord.supplies.find((supply) => supply._id === supplyId) ?? null

    if (!targetSupply) {
      setNotice("Boreal could not load that offer right now.")
      return
    }

    if (targetSupply.sourceProviderKey && targetSupply.sourceProviderKey !== "manual") {
      setNotice(
        "Synced provider listings stay read-only here. Update them through the provider sync path."
      )
      return
    }

    setEditingSupplyId(supplyId)
    setProfileBuilderDraft(
      buildProfileBuilderDraftFromRecord(myProfileRecord, { supplyId })
    )
    setProfileBuilderMessage("")
    setNotice(null)
    setIsProfileBuilderOpen(true)
  }

  async function handleDraftProfileBuilder(message: string) {
    const trimmedMessage = message.trim()

    if (!trimmedMessage || isDraftingProfileBuilder) {
      return
    }

    setNotice(null)
    setProfileBuilderMessage(trimmedMessage)
    setIsDraftingProfileBuilder(true)

    try {
      const response = await fetch("/api/profile-builder/draft", {
        body: JSON.stringify({
          message: trimmedMessage,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      const payload = (await response.json()) as {
        draft?: ProfileBuilderDraft
        error?: string
      }

      if (!response.ok || !payload.draft) {
        throw new Error(payload.error ?? "Could not draft the profile.")
      }

      setProfileBuilderDraft((current) =>
        mergeProfileBuilderDraft(current, payload.draft!)
      )
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not draft the profile."
      )
    } finally {
      setIsDraftingProfileBuilder(false)
    }
  }

  async function handleSetDefaultPayoutWallet(walletAccountId: string) {
    if (!ownerExternalId) {
      setNotice("Sign in with X first so Boreal can save wallet settings.")
      return
    }

    setIsSettingDefaultPayoutWalletId(walletAccountId)
    setNotice(null)

    try {
      const result = await setDefaultPayoutWalletAccount({
        ownerExternalId,
        walletAccountId,
      })

      setNotice(
        result.updated
          ? "Default payout wallet updated."
          : "Boreal could not update the payout wallet right now."
      )
      if (result.updated) {
        await refreshShellData(["profile-summary", "wallet-summary"])
      }
    } catch {
      setNotice("Boreal could not update the payout wallet right now.")
    } finally {
      setIsSettingDefaultPayoutWalletId(null)
    }
  }

  async function handleToggleProfileAvailability(checked: boolean) {
    if (!ownerExternalId) {
      setNotice("Sign in with X first before updating your profile.")
      return
    }

    setIsProfileAvailabilityUpdating(true)
    setNotice(null)

    try {
      const draft = myProfileRecord
        ? buildProfileBuilderDraftFromRecord(myProfileRecord)
        : createEmptyProfileBuilderDraft(session?.user?.name ?? "")

      draft.profile.availabilityStatus = checked ? "available" : "unavailable"
      draft.profile.isPublic = checked

      const result = await upsertMyProfile(
        profileBuilderToProfileMutationInput(draft, {
          displayName:
            (draft.profile.displayName || session?.user?.name) ?? undefined,
          externalId: ownerExternalId,
          handle: undefined,
        })
      )

      if (!result.saved) {
        throw new Error("Could not update profile availability.")
      }

      await refreshShellData(["profile-summary"])

      setNotice(
        checked
          ? "Profile is now available for work."
          : "Profile is now hidden from Boreal work discovery."
      )
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not update profile availability."
      )
    } finally {
      setIsProfileAvailabilityUpdating(false)
    }
  }

  async function saveProfileBuilder(includeListing: boolean) {
    if (!ownerExternalId || isSavingProfileBuilder) {
      if (!ownerExternalId) {
        setNotice("Sign in with X first before saving your profile.")
      }
      return
    }

    if (!hasSavableProfileBuilderDraft(profileBuilderDraft)) {
      setNotice("Add at least a headline or bio before saving the profile.")
      return
    }

    if (includeListing && !hasPublishableSupplyListing(profileBuilderDraft)) {
      setNotice(
        "Complete the offer title, category, and description before publishing."
      )
      return
    }

    setNotice(null)
    setIsSavingProfileBuilder(true)

    try {
      const profileResult = await upsertMyProfile(
        profileBuilderToProfileMutationInput(profileBuilderDraft, {
          displayName:
            (profileBuilderDraft.profile.displayName || session?.user?.name) ??
            undefined,
          externalId: ownerExternalId,
          handle: undefined,
        })
      )

      if (!profileResult.saved) {
        throw new Error("Could not save the profile.")
      }

      if (includeListing) {
        const supplyInput = profileBuilderToSupplyMutationInput(
          profileBuilderDraft,
          {
            displayName:
              (profileBuilderDraft.profile.displayName ||
                session?.user?.name) ??
              undefined,
            externalId: ownerExternalId,
            handle: undefined,
          }
        )

        if (!supplyInput) {
          throw new Error("Could not publish the offer.")
        }

        const supplyResult = await createSupplyEntry({
          ...supplyInput,
          supplyId: editingSupplyId ?? undefined,
        })

        if (!supplyResult.created) {
          throw new Error(
            supplyResult.reason === "missing_payout_wallet"
              ? "Connect a Solana wallet first so Boreal knows where payouts should go."
              : editingSupplyId
                ? "Could not update the offer."
                : "Could not publish the offer."
          )
        }
      }

      await refreshShellData(["profile-summary"])
      purgePublicMarket(["workers"])

      setNotice(
        includeListing
          ? editingSupplyId
            ? "Your work profile and offer have been updated."
            : "Your work profile and primary offer are now live."
          : "Your work profile has been updated."
      )
      setEditingSupplyId(null)
      setIsProfileBuilderOpen(false)
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not save your account."
      )
    } finally {
      setIsSavingProfileBuilder(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[60svh] items-center justify-center">
        <DotMatrixSpinner className="text-muted-foreground" size={34} />
      </div>
    )
  }

  if (!ownerExternalId) {
    return (
      <div className="mx-auto flex min-h-[70svh] max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm font-medium">Sign in to manage your account</p>
        <p className="max-w-xl text-sm text-muted-foreground">
          Boreal ties requests, offers, payouts, and reviews to your X account.
        </p>
        <Button
          onClick={() =>
            void signIn("twitter", {
              callbackUrl: buildAccountSettingsHref(),
            })
          }
          type="button"
        >
          <LogInIcon />
          Sign in with X
        </Button>
      </div>
    )
  }

  if (!isShellDataReady) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center">
        <DotMatrixSpinner className="text-muted-foreground" size={34} />
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <Button asChild size="sm" type="button" variant="ghost">
              <Link href="/chat">
                <ArrowLeftIcon />
                Back to Boreal chat
              </Link>
            </Button>
            <h1 className="text-xl font-medium">Account settings</h1>
            <p className="text-sm text-muted-foreground">
              Set up one public work profile, then choose the path that fits:
              custom service, digital product, or provider-backed sync.
            </p>
          </div>
        </div>

        <AccountSettingsSurface
          accountName={session?.user?.name ?? null}
          builderSlot={
            isProfileBuilderOpen ? (
              <ProfileBuilderEditor
                connectWalletLabel="Connect Solana mainnet wallet"
                draft={profileBuilderDraft}
                isDrafting={isDraftingProfileBuilder}
                isSaving={isSavingProfileBuilder}
                isWalletReady={isWalletReady}
                listingActionLabel={
                  editingSupply ? "Update offer" : "Publish offer"
                }
                listingContextLabel={
                  editingSupply
                    ? `Editing offer: ${editingSupply.title}`
                    : "Drafting a Boreal-native offer"
                }
                onConnectWallet={handleOpenWalletModal}
                onDraftWithBoreal={handleDraftProfileBuilder}
                onSaveProfile={() => saveProfileBuilder(false)}
                onSaveProfileAndListing={() => saveProfileBuilder(true)}
                setDraft={setProfileBuilderDraft}
                setSourceMessage={setProfileBuilderMessage}
                sourceMessage={profileBuilderMessage}
              />
            ) : null
          }
          defaultWalletAddress={defaultWalletAddress}
          connectedWallets={connectedWallets}
          isEditingPublicSetup={isProfileBuilderOpen}
          isProfileAvailabilityUpdating={isProfileAvailabilityUpdating}
          isPayoutWalletUpdating={isSettingDefaultPayoutWalletId}
          isWalletConnected={isWalletConnected}
          isWalletReady={isWalletReady}
          myProfileRecord={myProfileRecord}
          notice={notice}
          onConnectWallet={handleOpenWalletModal}
          onEditSupplyListing={openOwnedSupplyEditor}
          onOpenProfileBuilder={openProfileBuilder}
          onToggleProfileAvailability={handleToggleProfileAvailability}
          onSetDefaultPayoutWallet={handleSetDefaultPayoutWallet}
          runtimeDefaultNetworkKey={runtimeDefaultNetworkKey}
          walletAccounts={walletAccounts}
        />
      </div>
    </>
  )
}
