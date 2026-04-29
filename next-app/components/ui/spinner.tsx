import { DotmTriangle16 } from "@/components/ui/dotm-triangle-16"
import { cn } from "@/lib/utils"

type SpinnerProps = {
  ariaLabel?: string
  className?: string
  size?: number
}

const SIZE_TOKEN_TO_PX: Record<string, number> = {
  "size-3": 12,
  "size-4": 16,
  "size-5": 20,
  "size-6": 24,
}

function resolveSpinnerPresentation(className?: string, explicitSize?: number) {
  const tokens = className?.split(/\s+/).filter(Boolean) ?? []
  let size = explicitSize ?? 16
  const cleanedTokens: string[] = []

  for (const token of tokens) {
    if (token === "animate-spin") {
      continue
    }

    const mappedSize = SIZE_TOKEN_TO_PX[token]
    if (mappedSize) {
      size = explicitSize ?? mappedSize
      continue
    }

    cleanedTokens.push(token)
  }

  return {
    className: cleanedTokens.join(" "),
    size,
  }
}

function buildDotMetrics(size: number) {
  const dotSize = Math.max(1.15, Number((size / 7.8).toFixed(2)))
  const remaining = Math.max(0, size - dotSize * 7)
  const cellPadding = Number((remaining / 6).toFixed(2))

  return {
    cellPadding,
    dotSize,
  }
}

function Spinner({ ariaLabel = "Loading", className, size }: SpinnerProps) {
  const presentation = resolveSpinnerPresentation(className, size)
  const metrics = buildDotMetrics(presentation.size)

  return (
    <DotmTriangle16
      ariaLabel={ariaLabel}
      cellPadding={metrics.cellPadding}
      className={cn("inline-flex shrink-0 align-middle", presentation.className)}
      dotSize={metrics.dotSize}
      size={presentation.size}
      speed={1.6}
    />
  )
}

export { Spinner }
