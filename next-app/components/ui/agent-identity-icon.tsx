import {
  BotIcon,
  SparklesIcon,
  UserIcon,
  type LucideProps,
} from "lucide-react"

import { cn } from "@/lib/utils"

type AgentIdentityIconProps = LucideProps & {
  actorKind?: string | null
  directAgentKey?: string | null
  displayName?: string | null
  externalId?: string | null
  handle?: string | null
  title?: string | null
}

export function AgentIdentityIcon({
  actorKind = "agent",
  className,
  directAgentKey,
  displayName,
  externalId,
  handle,
  title,
  ...props
}: AgentIdentityIconProps) {
  if (
    isSolanaOperatorIdentity({
      directAgentKey,
      displayName,
      externalId,
      handle,
      title,
    })
  ) {
    return <SolanaLogoIcon className={className} {...props} />
  }

  if (actorKind === "human") {
    return <UserIcon className={className} {...props} />
  }

  if (actorKind === "tool") {
    return <SparklesIcon className={className} {...props} />
  }

  return <BotIcon className={className} {...props} />
}

export function isSolanaOperatorIdentity(input: {
  directAgentKey?: string | null
  displayName?: string | null
  externalId?: string | null
  handle?: string | null
  title?: string | null
}) {
  if (input.directAgentKey === "solana-operator") {
    return true
  }

  const haystack = [
    input.displayName,
    input.externalId,
    input.handle,
    input.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return (
    haystack.includes("solana operator") ||
    haystack.includes("solana-operator") ||
    haystack.includes("agent:solana-operator")
  )
}

function SolanaLogoIcon({ className, ...props }: LucideProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("fill-current", className)}
      viewBox="0 0 128 96"
      {...props}
    >
      <path d="M20 12c1.7-1.7 4-2.7 6.4-2.7h83.8c5.7 0 8.6 6.9 4.6 10.9l-11.4 11.4c-1.7 1.7-4 2.7-6.4 2.7H13.2c-5.7 0-8.6-6.9-4.6-10.9L20 12Z" />
      <path d="M20 62.8c1.7-1.7 4-2.7 6.4-2.7h83.8c5.7 0 8.6 6.9 4.6 10.9L103.4 82.4c-1.7 1.7-4 2.7-6.4 2.7H13.2c-5.7 0-8.6-6.9-4.6-10.9L20 62.8Z" />
      <path d="M108 37.5c-1.7-1.7-4-2.7-6.4-2.7H17.8c-5.7 0-8.6 6.9-4.6 10.9l11.4 11.4c1.7 1.7 4 2.7 6.4 2.7h83.8c5.7 0 8.6-6.9 4.6-10.9L108 37.5Z" />
    </svg>
  )
}
