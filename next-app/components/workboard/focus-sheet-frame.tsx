import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function FocusSheetFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5",
        className
      )}
    >
      {children}
    </div>
  )
}
