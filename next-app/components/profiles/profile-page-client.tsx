"use client"

import { useSession } from "next-auth/react"
import { useQuery } from "convex/react"

import { ProfileView } from "@/components/profiles/profile-view"
import { Spinner as LoaderIcon } from "@/components/ui/spinner"
import { BOREAL_AGENT_EXTERNAL_ID } from "@/lib/boreal/boreal-agent"
import { convexFunctionRefs } from "@/lib/boreal/integrations/convex/function-refs"

export function ProfilePageClient({ profileId }: { profileId: string }) {
  const { data: session } = useSession()
  const isBorealProfile = profileId === "boreal-agent"
  const profile = useQuery(
    isBorealProfile
      ? convexFunctionRefs.getPublicProfileByExternalId
      : convexFunctionRefs.getPublicProfile,
    isBorealProfile
      ? {
          externalId: BOREAL_AGENT_EXTERNAL_ID,
          ownerExternalId: session?.user?.id,
        }
      : {
          ownerExternalId: session?.user?.id,
          profileId,
        }
  )

  if (profile === undefined) {
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
