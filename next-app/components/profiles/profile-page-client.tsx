"use client";

import { useSession } from "next-auth/react";
import { LoaderIcon } from "lucide-react";
import { useQuery } from "convex/react";

import { ProfileView } from "@/components/profiles/profile-view";
import { convexFunctionRefs } from "@/lib/boreal/integrations/convex/function-refs";

export function ProfilePageClient({ profileId }: { profileId: string }) {
  const { data: session } = useSession();
  const profile = useQuery(convexFunctionRefs.getPublicProfile, {
    ownerExternalId: session?.user?.id,
    profileId,
  });

  if (profile === undefined) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center text-sm text-muted-foreground">
        <LoaderIcon className="mr-2 size-4 animate-spin" />
        Loading profile
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto flex min-h-[60svh] max-w-4xl items-center justify-center px-6 text-center">
        <div className="space-y-2 border border-border p-8">
          <p className="text-lg font-medium">Profile not found</p>
          <p className="text-sm text-muted-foreground">
            This worker profile is not public or does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ProfileView detail={profile} showProfileLink={false} />
    </div>
  );
}
