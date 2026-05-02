import { buildPageMetadata } from "@/lib/boreal/site-metadata"
import { redirect } from "next/navigation"

import { buildProfileSheetHref } from "@/lib/boreal/navigation/shell-links"

export const metadata = buildPageMetadata({
  description: "Legacy Boreal profile redirect.",
  noIndex: true,
  path: "/p",
  title: "Profile redirect",
})

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  redirect(buildProfileSheetHref(id))
}
