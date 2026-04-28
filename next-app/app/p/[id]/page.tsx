import { redirect } from "next/navigation";

import { buildProfileSheetHref } from "@/lib/boreal/navigation/shell-links";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(buildProfileSheetHref(id));
}
