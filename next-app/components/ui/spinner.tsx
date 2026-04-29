import { DotmTriangle16 } from "@/components/ui/dotm-triangle-16"
import { cn } from "@/lib/utils"

type SpinnerProps = {
  ariaLabel?: string
  className?: string
  size?: number
}

function resolveSpinnerClassName(className?: string) {
  const tokens = className?.split(/\s+/).filter(Boolean) ?? []
  const cleanedTokens: string[] = []

  for (const token of tokens) {
    if (token === "animate-spin" || token.startsWith("size-")) {
      continue
    }

    cleanedTokens.push(token)
  }

  return cleanedTokens.join(" ")
}

function Spinner({ ariaLabel = "Loading", className, size }: SpinnerProps) {
  const resolvedSize = Math.max(size ?? 30, 30)
  const resolvedClassName = resolveSpinnerClassName(className)

  return (
    <DotmTriangle16
      ariaLabel={ariaLabel}
      className={cn("overflow-visible shrink-0 align-middle", resolvedClassName)}
      size={resolvedSize}
      speed={1.6}
    />
  )
}

export { Spinner }
