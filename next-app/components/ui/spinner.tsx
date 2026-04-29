import { LoaderCircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type SpinnerProps = {
  ariaLabel?: string
  className?: string
  size?: number
}

function Spinner({ ariaLabel = "Loading", className, size: _size }: SpinnerProps) {
  return (
    <LoaderCircleIcon
      aria-label={ariaLabel}
      className={cn("shrink-0 animate-spin", className)}
      role="status"
      size={_size}
    />
  )
}

export { Spinner }
