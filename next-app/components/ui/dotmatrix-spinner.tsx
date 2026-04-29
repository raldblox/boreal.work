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
    <DotmSquare17 color="var(--color-dotmatrix)" speed={1.5} size={36} dotSize={5} opacityMid={0.5} opacityBase={0.2} />

  )
}

export { DotMatrixSpinner }
