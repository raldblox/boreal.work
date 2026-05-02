import { buildPageMetadata } from "@/lib/boreal/site-metadata"
import { WifiOffIcon } from "@/components/ui/static-icons"

export const metadata = buildPageMetadata({
  description:
    "Cached Boreal shell fallback shown while the network is unavailable.",
  noIndex: true,
  path: "/offline",
  title: "Offline shell",
})

export default function OfflinePage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground"
    >
      <div className="w-full max-w-md rounded-[1.75rem] border border-border/80 bg-card/92 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.42)]">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-border/80 bg-muted/20">
            <WifiOffIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Offline shell ready</p>
            <p className="text-sm text-muted-foreground">
              Boreal can open the cached shell, but live requests, inbox data,
              and payouts will refresh when the network returns.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
