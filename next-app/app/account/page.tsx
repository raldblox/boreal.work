import { buildPageMetadata } from "@/lib/boreal/site-metadata"
import { redirect } from "next/navigation"

import { buildAccountSettingsHref } from "@/lib/boreal/navigation/shell-links"

export const metadata = buildPageMetadata({
  description: "Signed-in Boreal account redirect.",
  noIndex: true,
  path: "/account",
  title: "Account",
})

export default function AccountPage() {
  redirect(buildAccountSettingsHref())
}
