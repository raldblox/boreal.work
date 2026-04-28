export const BOREAL_SHELL_PATH = "/"

export type BorealShellAccountView = "settings"
export type BorealShellModal = "profile-builder"

export function buildBorealShellHref(input?: {
  account?: BorealShellAccountView | null
  browse?: string | null
  chat?: string | null
  modal?: BorealShellModal | null
  paper?: string | null
  profile?: string | null
  request?: string | null
  sheet?: string | null
  view?: string | null
}) {
  const params = new URLSearchParams()

  if (input?.account) {
    params.set("account", input.account)
  }

  if (input?.browse) {
    params.set("browse", input.browse)
  }

  if (input?.chat) {
    params.set("chat", input.chat)
  }

  if (input?.modal) {
    params.set("modal", input.modal)
  }

  if (input?.paper) {
    params.set("paper", input.paper)
  }

  if (input?.profile) {
    params.set("profile", input.profile)
  }

  if (input?.request) {
    params.set("request", input.request)
  }

  if (input?.sheet) {
    params.set("sheet", input.sheet)
  }

  if (input?.view) {
    params.set("view", input.view)
  }

  const query = params.toString()
  return query ? `${BOREAL_SHELL_PATH}?${query}` : BOREAL_SHELL_PATH
}

export function buildAccountSettingsHref() {
  return buildBorealShellHref({
    account: "settings",
  })
}

export function buildProfileBuilderHref() {
  return buildBorealShellHref({
    modal: "profile-builder",
  })
}

export function buildProfileSheetHref(profileId: string) {
  return buildBorealShellHref({
    profile: profileId,
  })
}
