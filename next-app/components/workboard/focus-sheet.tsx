"use client"

import { useEffect, useState, type ReactNode } from "react"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export const FOCUS_SHEET_ENTER_MS = 360

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
  const [isPresented, setIsPresented] = useState(false)

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

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsPresented(open)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [open])

  return (
    <div
      aria-hidden={!open}
      className={cn(
        "absolute inset-x-0 bottom-0 top-16 z-40",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      inert={!open}
    >
      <button
        aria-label="Close focus sheet"
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />

      <div className="absolute inset-x-0 bottom-0 top-3 px-3 pb-3">
        <div
          className={cn(
            "flex h-full min-h-0 flex-col overflow-hidden rounded-[1.6rem] border border-border/85 bg-background shadow-[0_40px_110px_-48px_rgba(15,23,42,0.72)] transition-transform dark:bg-background",
            className
          )}
          data-state={open ? "open" : "closed"}
          style={{
            transform: isPresented ? "translateY(0)" : "translateY(3rem)",
            transitionDuration: `${FOCUS_SHEET_ENTER_MS}ms`,
            transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
            willChange: "transform",
          }}
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

          <ScrollArea blurHeight="4rem" className="min-h-0 flex-1">
            {children}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
