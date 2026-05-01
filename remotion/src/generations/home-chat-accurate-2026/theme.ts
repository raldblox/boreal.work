export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const SCALE = 1.42;
export const OUTER_WIDTH = 896;
export const INNER_WIDTH = 768;
export const STARTER_WIDTH = 720;

export const RADIUS = {
  sm: 6.24,
  md: 8.32,
  lg: 10.4,
} as const;

export const TOKENS = {
  accent: "oklch(0.76 0.13 196)",
  accentForeground: "oklch(0.17 0 0)",
  accentGlow: "rgba(104, 216, 208, 0.24)",
  background: "oklch(0 0 0)",
  border: "rgba(255, 255, 255, 0.10)",
  foreground: "oklch(0.96 0 0)",
  input: "rgba(255, 255, 255, 0.045)",
  inputHover: "rgba(255, 255, 255, 0.06)",
  muted: "rgba(255, 255, 255, 0.028)",
  mutedForeground: "oklch(0.72 0 0)",
  secondary: "oklch(0.26 0 0)",
  secondaryForeground: "oklch(0.9 0 0)",
  shadow: "0 28px 70px -44px rgba(15, 23, 42, 0.42)",
  strongBorder: "rgba(255, 255, 255, 0.16)",
} as const;

export const FONTS = {
  heading: '"Boreal Heading", "Syne", "Arial", sans-serif',
  mono: '"Boreal Mono", "Geist Mono", "Consolas", monospace',
  sans: '"Boreal Sans", "Manrope", "Arial", sans-serif',
} as const;
