"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

import GradualBlur from "@/components/GradualBlur"
import { cn } from "@/lib/utils"

function ScrollArea({
  blur = true,
  blurHeight = "4.5rem",
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  blur?: boolean
  blurHeight?: string
}) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const [showBottomBlur, setShowBottomBlur] = React.useState(false)

  React.useEffect(() => {
    if (!blur) {
      return
    }

    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    const updateBlurVisibility = () => {
      const canScrollVertically =
        viewport.scrollHeight > viewport.clientHeight + 1
      const atBottom =
        viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 2

      setShowBottomBlur(canScrollVertically && !atBottom)
    }

    const content = viewport.firstElementChild
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateBlurVisibility())
        : null

    resizeObserver?.observe(viewport)
    if (content instanceof HTMLElement) {
      resizeObserver?.observe(content)
    }

    viewport.addEventListener("scroll", updateBlurVisibility, { passive: true })
    window.addEventListener("resize", updateBlurVisibility)

    const frame = window.requestAnimationFrame(updateBlurVisibility)

    return () => {
      window.cancelAnimationFrame(frame)
      viewport.removeEventListener("scroll", updateBlurVisibility)
      window.removeEventListener("resize", updateBlurVisibility)
      resizeObserver?.disconnect()
    }
  }, [blur, children])

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {blur && showBottomBlur ? (
        <GradualBlur
          className="rounded-b-[inherit]"
          divCount={6}
          height={blurHeight}
          opacity={0.92}
          position="bottom"
          strength={1.15}
          zIndex={2}
        />
      ) : null}
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "relative z-[3] flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
