import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

function BaseIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    />
  )
}

export function ArrowLeft(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M19 12H5" />
      <path d="m11 5-7 7 7 7" />
    </BaseIcon>
  )
}

export function ArrowRight(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </BaseIcon>
  )
}

export function ArrowUpRight(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </BaseIcon>
  )
}

export const ArrowUpRightIcon = ArrowUpRight

export function BotIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3v3" />
      <rect x="5" y="7" width="14" height="11" rx="3" />
      <path d="M8 18v2M16 18v2M3 11h2M19 11h2" />
      <circle cx="9.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M9 15c.8.6 1.9.9 3 .9s2.2-.3 3-.9" />
    </BaseIcon>
  )
}

export function BoxesIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3.5" y="10.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="10.5" width="7" height="7" rx="1.2" />
      <rect x="8.75" y="3.5" width="6.5" height="6.5" rx="1.2" />
      <path d="M10 10.5h4M8.8 10l2-2M15.2 10l-2-2" />
    </BaseIcon>
  )
}

export function CableIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8 6v5a4 4 0 0 0 8 0V6" />
      <path d="M6 6h4M14 6h4" />
      <path d="M10 18h4M12 15v6" />
    </BaseIcon>
  )
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3 5 6v5c0 4.2 2.5 8 7 10 4.5-2 7-5.8 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7L15 10" />
    </BaseIcon>
  )
}

export function WalletIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v2.5" />
      <path d="M4 8v8.5A2.5 2.5 0 0 0 6.5 19H18a2 2 0 0 0 2-2v-7H13a2 2 0 0 0 0 4h7" />
      <circle cx="13.5" cy="12" r=".7" fill="currentColor" stroke="none" />
    </BaseIcon>
  )
}

export function WifiOffIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m3 3 18 18" />
      <path d="M8.2 8.3A8.8 8.8 0 0 1 12 7.5c2.7 0 5.1 1.2 6.8 3" />
      <path d="M5.7 5.8A12.4 12.4 0 0 1 12 4c4 0 7.7 1.9 10 4.8" />
      <path d="M9.8 11.8A4.5 4.5 0 0 1 12 11c1.3 0 2.5.5 3.4 1.3" />
      <path d="M12 17h.01" />
    </BaseIcon>
  )
}
