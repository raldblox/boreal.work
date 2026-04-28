"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import { usePrivy } from "@privy-io/react-auth"
import { signIn, useSession } from "next-auth/react"
import { ArrowLeftIcon, LoaderIcon, LogInIcon } from "lucide-react"

import { AccountSettingsSurface } from "@/components/account/account-settings-surface"
import { ProfileBuilderEditor } from "@/components/chat/profile-builder"
import { Button } from "@/components/ui/button"
import { convexFunctionRefs } from "@/lib/boreal/integrations/convex/function-refs"
import { usePayment } from "@/hooks/use-payment"
import {
  getBorealChainEnvironment,
  getBorealPrimaryChainFamily,
  getDefaultBorealNetworkKey,
} from "@/lib/boreal/commerce/networks"
import {
  buildProfileBuilderDraftFromRecord,
  createEmptyProfileBuilderDraft,
  hasPublishableSupplyListing,
  hasSavableProfileBuilderDraft,
  mergeProfileBuilderDraft,
  profileBuilderToProfileMutationInput,
  profileBuilderToSupplyMutationInput,
  type ProfileBuilderDraft,
} from "@/lib/boreal/schemas/profile-builder"

export function AccountPageClient() {
  const { data: session, status } = useSession()
  const ownerExternalId = session?.user?.id
  const {
    authenticated: privyAuthenticated,
    login,
  } = usePrivy()
  const { defaultWallet, defaultWalletAddress, isWalletReady } = usePayment()
  const runtimeEnvironment = getBorealChainEnvironment()
  const runtimePrimaryChainFamily = getBorealPrimaryChainFamily()
  const runtimeDefaultNetworkKey = getDefaultBorealNetworkKey({
    chainFamily: runtimePrimaryChainFamily,
    environment: runtimeEnvironment,
  })

  const myProfileResult = useQuery(
    convexFunctionRefs.getMyProfile,
    ownerExternalId ? { ownerExternalId } : "skip"
  )
  const walletAccountsResult = useQuery(
    convexFunctionRefs.getMyWalletAccounts,
    ownerExternalId ? { ownerExternalId } : "skip"
  )
  const syncWalletAccount = useMutation(convexFunctionRefs.syncWalletAccount)
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
  const [isSettingDefaultPayoutWalletId, setIsSettingDefaultPayoutWalletId] =
    useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [profileBuilderDraft, setProfileBuilderDraft] =
    useState<ProfileBuilderDraft>(createEmptyProfileBuilderDraft())

  const myProfileRecord = myProfileResult ?? null
  const walletAccounts = walletAccountsResult ?? []

  useEffect(() => {
    if (!ownerExternalId || !defaultWallet || !isWalletReady) {
      return
    }

    void syncWalletAccount({
      chainFamily:
        defaultWallet.chainFamily === "evm" ? "evm" : "solana",
      chainId: defaultWallet.chainId ?? undefined,
      networkKey: defaultWallet.networkKey,
      ownerDisplayName: session?.user?.name ?? undefined,
      ownerExternalId,
      roles: ["connected", "buyer", "payout"],
      setAsDefaultBuyer: true,
      setAsDefaultPayout: true,
      walletAddress: defaultWallet.address,
    })
  }, [
    defaultWallet,
    isWalletReady,
    ownerExternalId,
    session?.user?.name,
    syncWalletAccount,
  ])

  function openProfileBuilder() {
    const base = myProfileRecord
      ? buildProfileBuilderDraftFromRecord(myProfileRecord)
      : createEmptyProfileBuilderDraft(session?.user?.name ?? "")

    setProfileBuilderDraft(base)
    setProfileBuilderMessage("")
    setIsProfileBuilderOpen(true)
  }

  function closeProfileBuilder() {
    setIsProfileBuilderOpen(false)
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
    } catch {
      setNotice("Boreal could not update the payout wallet right now.")
    } finally {
      setIsSettingDefaultPayoutWalletId(null)
    }
  }

  async function handleDraftProfileBuilder() {
    if (!profileBuilderMessage.trim() || isDraftingProfileBuilder) {
      return
    }

    setNotice(null)
    setIsDraftingProfileBuilder(true)

    try {
      const response = await fetch("/api/profile-builder/draft", {
        body: JSON.stringify({
          message: profileBuilderMessage,
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

        const supplyResult = await createSupplyEntry(supplyInput)

        if (!supplyResult.created) {
          throw new Error(
            supplyResult.reason === "missing_payout_wallet"
              ? `Connect a ${runtimePrimaryChainFamily === "solana" ? "Solana" : "compatible"} wallet first so Boreal knows where payouts should go.`
              : "Could not publish the offer."
          )
        }
      }

      setNotice(
        includeListing
          ? "Your public profile and primary offer are now live."
          : "Your public profile has been updated."
      )
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
        <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
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
        <Button onClick={() => void signIn("twitter", { callbackUrl: "/account" })} type="button">
          <LogInIcon />
          Sign in with X
        </Button>
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
              Package one public profile, one primary offer, and the wallets
              behind paid work.
            </p>
          </div>
        </div>

        <AccountSettingsSurface
          accountName={session?.user?.name ?? null}
          builderSlot={
            isProfileBuilderOpen ? (
              <ProfileBuilderEditor
                connectWalletLabel={
                  runtimePrimaryChainFamily === "solana"
                    ? "Connect Solana wallet"
                    : "Connect EVM wallet"
                }
                draft={profileBuilderDraft}
                isDrafting={isDraftingProfileBuilder}
                isSaving={isSavingProfileBuilder}
                isWalletReady={isWalletReady}
                onConnectWallet={login}
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
          isEditingPublicSetup={isProfileBuilderOpen}
          isPayoutWalletUpdating={isSettingDefaultPayoutWalletId}
          isPrivyAuthenticated={privyAuthenticated}
          isWalletReady={isWalletReady}
          myProfileRecord={myProfileRecord}
          notice={notice}
          onCloseProfileBuilder={closeProfileBuilder}
          onConnectWallet={login}
          onOpenProfileBuilder={openProfileBuilder}
          onSetDefaultPayoutWallet={handleSetDefaultPayoutWallet}
          runtimeDefaultNetworkKey={runtimeDefaultNetworkKey}
          runtimeEnvironment={runtimeEnvironment}
          runtimePrimaryChainFamily={runtimePrimaryChainFamily}
          walletAccounts={walletAccounts}
        />
      </div>
    </>
  )
}
