import { DotmSquare17 } from "@/components/ui/dotm-square-17"
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
    <span
      aria-label={ariaLabel}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        className,
      )}
      role="status"
    >
      <DotmSquare17
        color="var(--color-dotmatrix)"
        opacityBase={0.2}
        opacityMid={0.5}
        size={size}
        speed={1.5}
      />
    </span>
  )
}

export { DotMatrixSpinner }
