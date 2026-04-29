"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import type { CSSProperties, ElementType } from "react";
import { memo, useMemo } from "react";

export interface TextShimmerProps {
  children: string;
  as?: ElementType;
  className?: string;
  duration?: number;
  spread?: number;
  baseColor?: string;
  highlightColor?: string;
}

const ShimmerComponent = ({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
  baseColor = "var(--color-muted-foreground)",
  highlightColor = "var(--color-background)",
}: TextShimmerProps) => {
  const dynamicSpread = useMemo(
    () => (children?.length ?? 0) * spread,
    [children, spread]
  );

  return (
    <Component className={cn("relative inline-block", className)}>
      <motion.span
        animate={{ backgroundPosition: "0% center" }}
        className={cn(
          "inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
          "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]"
        )}
        initial={{ backgroundPosition: "100% center" }}
        style={
          {
            "--spread": `${dynamicSpread}px`,
            backgroundImage:
              `var(--bg), linear-gradient(${baseColor}, ${baseColor})`,
            ["--bg" as const]: `linear-gradient(90deg,#0000_calc(50%-var(--spread)),${highlightColor},#0000_calc(50%+var(--spread)))`,
          } as CSSProperties
        }
        transition={{
          duration,
          ease: "linear",
          repeat: Number.POSITIVE_INFINITY,
        }}
      >
        {children}
      </motion.span>
    </Component>
  );
};

export const Shimmer = memo(ShimmerComponent);
