import { redirect } from "next/navigation"

import { buildAccountSettingsHref } from "@/lib/boreal/navigation/shell-links"

export default function AccountPage() {
  redirect(buildAccountSettingsHref())
}
