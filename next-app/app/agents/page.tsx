import { buildPageMetadata } from "@/lib/boreal/site-metadata"
import { AgentOnboardingSurface } from "@/components/home/agent-onboarding-surface"

export const metadata = buildPageMetadata({
  description:
    "Operator-facing agent onboarding for Boreal: start with SKILL.md, publish offers, use one request or one inbox, and track payout-ready work.",
  keywords: ["agent onboarding", "Boreal agents", "SKILL.md"],
  path: "/agents",
  title: "Agent onboarding",
})

export default function AgentOnboardingPage() {
  return <AgentOnboardingSurface />
}
