"use client"

import { useEffect, type ReactNode } from "react"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type FocusSheetProps = {
  children: ReactNode
  className?: string
  open: boolean
  onClose: () => void
  title: string
}

export function FocusSheet({
  children,
  className,
  open,
  onClose,
  title,
}: FocusSheetProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose, open])

  return (
    <div
      aria-hidden={!open}
      className={cn(
        "absolute inset-x-0 bottom-0 top-16 z-40 transition-opacity duration-300",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
      inert={!open}
    >
      <button
        aria-label="Close focus sheet"
        className={cn(
          "absolute inset-0 bg-background/45 backdrop-blur-[2px] transition-opacity duration-300 dark:bg-background/72",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        type="button"
      />

      <div className="absolute inset-x-0 bottom-0 top-3 px-3 pb-3">
        <div
          className={cn(
            "flex h-full min-h-0 flex-col overflow-hidden rounded-[1.6rem] border border-border/85 bg-background/96 shadow-[0_40px_110px_-48px_rgba(15,23,42,0.72)] backdrop-blur-xl dark:bg-background/94",
            open
              ? "animate-[boreal-focus-sheet-enter_620ms_cubic-bezier(0.16,1,0.3,1)]"
              : "animate-[boreal-focus-sheet-exit_260ms_cubic-bezier(0.4,0,1,1)]",
            className
          )}
          data-state={open ? "open" : "closed"}
        >
          <div className="border-b border-border/70 bg-muted/35 px-4 py-4 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium tracking-tight">
                  {title}
                </p>
              </div>

              <Button
                aria-label={`Close ${title}`}
                className="rounded-full"
                onClick={onClose}
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <XIcon />
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  )
}
