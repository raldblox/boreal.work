"use client"

import { useSession } from "next-auth/react"
import { LoaderIcon } from "lucide-react"
import { useQuery } from "convex/react"

import { BorealProfileView } from "@/components/profiles/boreal-profile-view"
import { ProfileView } from "@/components/profiles/profile-view"
import { convexFunctionRefs } from "@/lib/boreal/integrations/convex/function-refs"

export function ProfilePageClient({ profileId }: { profileId: string }) {
  const { data: session } = useSession()
  const isBorealProfile = profileId === "boreal-agent"
  const profile = useQuery(
    convexFunctionRefs.getPublicProfile,
    isBorealProfile
      ? "skip"
      : {
          ownerExternalId: session?.user?.id,
          profileId,
        }
  )
  const borealStats = useQuery(
    convexFunctionRefs.getBorealAgentStats,
    isBorealProfile ? {} : "skip"
  )

  if (
    (isBorealProfile && borealStats === undefined) ||
    (!isBorealProfile && profile === undefined)
  ) {
    return (
      <main
        className="flex min-h-[60svh] items-center justify-center text-sm text-muted-foreground"
        id="main-content"
      >
        <LoaderIcon className="mr-2 size-4 animate-spin" />
        Loading profile
      </main>
    )
  }

  if (isBorealProfile) {
    return (
      <main
        className="mx-auto w-full max-w-[88rem] px-4 py-8 sm:px-6 lg:px-8"
        id="main-content"
      >
        <BorealProfileView showProfileLink={false} stats={borealStats} />
      </main>
    )
  }

  if (!profile) {
    return (
      <main
        className="mx-auto flex min-h-[60svh] max-w-4xl items-center justify-center px-6 text-center"
        id="main-content"
      >
        <div className="space-y-2 border border-border p-8">
          <p className="text-lg font-medium">Profile not found</p>
          <p className="text-sm text-muted-foreground">
            This worker profile is not public or does not exist.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main
      className="mx-auto w-full max-w-[88rem] px-4 py-8 sm:px-6 lg:px-8"
      id="main-content"
    >
      <ProfileView detail={profile} showProfileLink={false} />
    </main>
  )
}
