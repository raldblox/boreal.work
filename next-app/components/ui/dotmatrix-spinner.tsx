import { DotmTriangle3 } from "@/components/ui/dotm-triangle-3"
import { cn } from "@/lib/utils"

type DotMatrixSpinnerProps = {
  ariaLabel?: string
  className?: string
  size?: number
}

function DotMatrixSpinner({
  ariaLabel = "Loading",
  className,
  size,
}: DotMatrixSpinnerProps) {
  return (
    <DotmTriangle3
      ariaLabel={ariaLabel}
      className={cn("overflow-visible shrink-0 align-middle", className)}
      size={Math.max(size ?? 30, 30)}
      speed={1.55}
    />
  )
}

export { DotMatrixSpinner }
