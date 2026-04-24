import { ProfilePageClient } from "@/components/profiles/profile-page-client";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProfilePageClient profileId={id} />;
}
