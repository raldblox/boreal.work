export type BoardStatus = "in_progress" | "later" | "live" | "next"

export type BoardTicket = {
  area: string
  evidence: string
  id: string
  report: string
  routes: string[]
  status: BoardStatus
  summary: string
  title: string
  updatedAt: string
}

export type RoadmapHighlight = {
  label: string
  note: string
  value: string
}

export type RoadmapPhaseReadout = {
  label: string
  phase: string
  status: BoardStatus
}

export const roadmapHighlights: RoadmapHighlight[] = [
  {
    label: "Live now",
    note: "Request loop, supply market, merchant-native offers, payment base, connected agents, and provider-backed discovery all ship today.",
    value: "6 milestones",
  },
  {
    label: "Hardening now",
    note: "Mainnet payment depth, team ops, subtype storage, release ops, and trust infrastructure are the main active tracks.",
    value: "5 tracks",
  },
  {
    label: "Queued next",
    note: "Buyer-safe product pages, merchant lifecycle smoke, retrieval depth, and exportable reputation are the clearest near-term upgrades.",
    value: "4 moves",
  },
  {
    label: "Synced",
    note: "Aligned to current ROADMAP.md and BOREAL_BOOK.md source truth.",
    value: "Apr 30, 2026",
  },
]

export const roadmapPhaseReadout: RoadmapPhaseReadout[] = [
  {
    label: "Truth boundary and release framing",
    phase: "0",
    status: "live",
  },
  {
    label: "Request-first core loop",
    phase: "1",
    status: "live",
  },
  {
    label: "Supply onboarding and market density",
    phase: "2",
    status: "in_progress",
  },
  {
    label: "Payment and payout safety",
    phase: "3",
    status: "in_progress",
  },
  {
    label: "Team coordination and collective fulfillment",
    phase: "4",
    status: "in_progress",
  },
  {
    label: "External agents and portable reputation",
    phase: "5",
    status: "in_progress",
  },
  {
    label: "Merchant and digital product flow",
    phase: "6",
    status: "in_progress",
  },
  {
    label: "Rollout operations and widening access",
    phase: "7",
    status: "in_progress",
  },
]

export const roadmapTickets: BoardTicket[] = [
  {
    area: "request execution",
    evidence:
      "The live app already supports mounted specialist selection from Offers, request creation, route preview, specialist follow-up, delivery, review, and attached checkout state on one record.",
    id: "BRL-101",
    report:
      "This is the strongest current Boreal feature story. The board can safely present it as live because the same request thread already carries mounted start or approval, fulfillment, proof, and review without splitting into a second system of record.",
    routes: ["/chat", "/api/v1/requests", "/one-request-api.md"],
    status: "live",
    summary:
      "One request can start from mounted specialist selection or normal route preview, then move through follow-up, delivery, review, and attached checkout without leaving the Boreal thread.",
    title: "Request-first execution loop",
    updatedAt: "2026-04-29",
  },
  {
    area: "supply market",
    evidence:
      "Suppliers can publish through /account or /api/v1/supplies, receive matched demand through one inbox, and move into delivery plus payout readiness.",
    id: "BRL-102",
    report:
      "This milestone is live and externally meaningful. It proves Boreal is more than a buyer-side request shell because suppliers can now join, get matched, propose or claim, and finish work through the same contract surface.",
    routes: ["/account", "/api/v1/supplies", "/api/v1/inbox", "/one-inbox-api.md"],
    status: "live",
    summary:
      "Suppliers can onboard through UI or API, watch matched demand through one inbox, and carry work toward delivery plus payout readiness.",
    title: "Supplier onboarding and matched inbox",
    updatedAt: "2026-04-29",
  },
  {
    area: "merchant flow",
    evidence:
      "The account surface now separates custom services, digital products, owned native-offer management, and provider-sync read-only boundaries.",
    id: "BRL-103",
    report:
      "This is a meaningful product milestone because merchants no longer have to infer the route model from low-level supply fields. Boreal now exposes a usable native merchant path while keeping provider-backed sync honest about what is and is not self-serve.",
    routes: ["/account", "/roadmap"],
    status: "live",
    summary:
      "Boreal-native merchants can now author service offers and digital products in /account while synced provider listings stay visible but read-only.",
    title: "Merchant-native offer path",
    updatedAt: "2026-04-29",
  },
  {
    area: "agent network",
    evidence:
      "Specialist registry routes, connected HTTP and MCP runtimes, request-scoped local runtime invites, one-request callbacks, and the Hermes bridge are all already shipped.",
    id: "BRL-104",
    report:
      "This belongs in the live lane because Boreal already supports both direct specialist surfaces and advanced connected-runtime control under Boreal's request model. The public message still needs to keep agent trust and runtime health as unfinished work.",
    routes: ["/agents", "/developers/agents", "/api/v1/agents", "/agent-registry.md"],
    status: "live",
    summary:
      "Direct specialists, request-scoped local runtimes, request callbacks, and the Hermes bridge already make Boreal a working agent network surface.",
    title: "Connected agents and specialist registry",
    updatedAt: "2026-04-29",
  },
  {
    area: "solana specialist",
    evidence:
      "Solana Operator now supports explicit wallet-approved Solana mainnet memo, simple SOL transfer, and wallet-message signing inside the mounted request thread, while the public direct route is still planning-first and the broader Solana runtime remains unfinished.",
    id: "BRL-107",
    report:
      "This still belongs in progress, not full live execution, because the shipped Solana path is intentionally narrow. Boreal now has a real mounted-thread wallet bridge for a few safe request-thread actions, but the next milestone is fuller Solana runtime coverage with richer preview, approval, submission, and confirmation handling.",
    routes: ["/agents", "/agent-registry.md", "/roadmap"],
    status: "in_progress",
    summary:
      "Mounted request-thread Solana actions are now real for a limited mainnet slice, but broader signer-backed Solana execution still needs the fuller runtime and approval flow.",
    title: "Solana wallet bridge",
    updatedAt: "2026-04-29",
  },
  {
    area: "commerce spine",
    evidence:
      "Wallet sync, a 402 boundary, Solana mainnet verification, payout progression, and provider-backed checkout states already write through the same transaction spine.",
    id: "BRL-105",
    report:
      "This milestone is live because the payment and payout base is concrete and auditable. It still stays separate from the harder claim of full production payment rail readiness, funded-start discipline, or treasury-grade settlement proof.",
    routes: ["/one-request-api.md", "/one-inbox-api.md", "/about"],
    status: "live",
    summary:
      "Boreal already has a real commerce spine with wallet sync, payment verification, payout progression, and provider-backed checkout for supported paths.",
    title: "Payment and payout foundation",
    updatedAt: "2026-04-29",
  },
  {
    area: "external supply",
    evidence:
      "Agentic Market sync is live, and the service-provider layer now also includes curated AgentCash fallback and Frames handoff adapters.",
    id: "BRL-106",
    report:
      "This is safe to show as live because the discovery and normalization layer is real today. The wording must stay precise: these adapters widen supply discovery and handoff coverage, but not every external listing is a native direct-invoke execution path yet.",
    routes: ["/about", "/docs", "/roadmap"],
    status: "live",
    summary:
      "Provider-backed discovery now includes Agentic Market sync plus curated AgentCash fallback and Frames handoff coverage.",
    title: "Provider-backed discovery layer",
    updatedAt: "2026-04-29",
  },
  {
    area: "payment hardening",
    evidence:
      "Mainnet verification is live, but EARLY_ACCESS still marks payment hardening, funded-start, payout verification, refunds, and disputes as unfinished release work.",
    id: "BRL-201",
    report:
      "This is one of the most important in-progress tracks because it separates today's auditable payment boundary from a broader public-ready production rail. It is not a missing base, but it is still the key trust gap before wider paid access.",
    routes: ["/roadmap", "/one-request-api.md", "/about"],
    status: "in_progress",
    summary:
      "Boreal is hardening from a verified 402 plus payout base into funded-start, stronger payout proof, and safer post-payment lifecycle handling.",
    title: "Mainnet payment hardening",
    updatedAt: "2026-04-29",
  },
  {
    area: "team workboard",
    evidence:
      "Collectives, shared request participation, request-scoped local runtime invites, and first runtime-health presence are live, but explicit role acceptance, reassignment, validator lanes, and escalation paths are still open work.",
    id: "BRL-202",
    report:
      "This belongs in progress because Boreal already supports collective execution, but the request-side team surface is not yet strong enough to claim robust in-app multi-party coordination without caveats.",
    routes: ["/chat", "/roadmap", "/papers/swarm-workspace"],
    status: "in_progress",
    summary:
      "Collective execution and local runtime invite are real, but the Team and Workboard surfaces still need stronger assignment, validation, and escalation behavior.",
    title: "Team coordination hardening",
    updatedAt: "2026-04-29",
  },
  {
    area: "supply model",
    evidence:
      "ROADMAP and EARLY_ACCESS still call out subtype tables as a missing step so products, service offers, provider services, connected agents, and collectives stop overloading one row shape.",
    id: "BRL-203",
    report:
      "This is active architecture work because matching quality and merchant reliability now depend more on type-aware supply storage than on adding another generic listing flow.",
    routes: ["/roadmap", "/about"],
    status: "in_progress",
    summary:
      "The canonical supplies table works today, but Boreal still needs subtype storage so each supply class carries the fields matching actually needs.",
    title: "Type-aware supply model",
    updatedAt: "2026-04-29",
  },
  {
    area: "release ops",
    evidence:
      "The early-access truth docs and cohort rollout playbook are now real, but EARLY_ACCESS still calls out release metrics, runbooks, and kill switches as missing.",
    id: "BRL-204",
    report:
      "This track is in progress because Boreal now has a clearer release boundary and a real cohort playbook. It is not ready to move to live until widening access is backed by scorecards, incident handling, and rollback discipline.",
    routes: ["/roadmap", "/about"],
    status: "in_progress",
    summary:
      "Boreal has a stronger early-access truth boundary now, but still needs real release metrics, runbooks, and control surfaces before wider traffic.",
    title: "Release operations hardening",
    updatedAt: "2026-04-29",
  },
  {
    area: "agent trust",
    evidence:
      "Connected-agent execution is live, but portable agent identity, reputation export, runtime verification, and connector health are still open in EARLY_ACCESS.",
    id: "BRL-205",
    report:
      "This belongs in progress because the network surface exists, but the trust base is not yet portable or operationally strong enough to describe connected agents as fully production-grade third-party infrastructure.",
    routes: ["/agents", "/developers/agents", "/roadmap"],
    status: "in_progress",
    summary:
      "Boreal can already connect outside runtimes, but still needs stronger identity, reputation, and connector-health layers.",
    title: "Agent trust base",
    updatedAt: "2026-04-29",
  },
  {
    area: "buyer surface",
    evidence:
      "EARLY_ACCESS still leaves richer product pages, merchant-safe checkout flows, and route guards as the next merchant-facing upgrade.",
    id: "BRL-301",
    report:
      "This is the clearest next buyer-surface milestone because Boreal already has merchant-native offers and provider-backed checkout foundations. The gap is making catalog and checkout feel complete and safe from dead-end branches.",
    routes: ["/roadmap", "/about"],
    status: "next",
    summary:
      "Turn the current merchant base into richer public product pages and buyer-safe checkout flows with stronger dead-end guards.",
    title: "Product pages and buyer-safe checkout",
    updatedAt: "next",
  },
  {
    area: "merchant verification",
    evidence:
      "EARLY_ACCESS explicitly calls out a missing deterministic merchant smoke suite even though native merchant authoring is now live.",
    id: "BRL-302",
    report:
      "This belongs in the next lane because it is the fastest way to turn the new merchant path from UI truth into stronger release truth. The merchant surface should not widen much further without its own deterministic lifecycle proof.",
    routes: ["/roadmap", "/account"],
    status: "next",
    summary:
      "Add a dedicated merchant lifecycle smoke for onboarding, listing, purchase, fulfillment, and payout.",
    title: "Merchant lifecycle smoke",
    updatedAt: "next",
  },
  {
    area: "retrieval depth",
    evidence:
      "ROADMAP still names historical analog retrieval, LLM reranking, and deeper hard filters as the next routing quality step after classifier-first fetch paths.",
    id: "BRL-303",
    report:
      "This remains a clear next step because the fetch policy is now live. The right follow-on is not another generic matching claim, but deeper retrieval and reranking quality on top of the new classifier-first base.",
    routes: ["/roadmap", "/chat"],
    status: "next",
    summary:
      "Build the next retrieval layer with historical analogs, stronger hard filters, and LLM reranking over top candidates.",
    title: "Retrieval depth pass",
    updatedAt: "next",
  },
  {
    area: "portable reputation",
    evidence:
      "Reviews and collective trust inputs exist today, but EARLY_ACCESS still leaves portable identity binding and exportable reputation snapshots as open work.",
    id: "BRL-304",
    report:
      "This is near-term rather than later because Boreal already has request-linked outcomes and profile analytics. The next gap is turning that into exportable, portable proof instead of keeping trust trapped inside one app surface.",
    routes: ["/roadmap", "/papers/portable-reputation", "/agents"],
    status: "next",
    summary:
      "Move from in-app reviews and trust inputs toward portable identity binding and exportable reputation snapshots.",
    title: "Portable reputation exports",
    updatedAt: "next",
  },
  {
    area: "realtime workspace",
    evidence:
      "The durable request workboard is live today, but richer realtime presence, validator lanes, and Swarm Workspace upgrades remain future work.",
    id: "BRL-401",
    report:
      "This is later-stage because Boreal already has the durable request object and collective execution base. The realtime coordination layer should follow stronger trust, assignment, and connector foundations rather than arrive as premature surface complexity.",
    routes: ["/papers/swarm-workspace", "/roadmap"],
    status: "later",
    summary:
      "Upgrade selected requests into richer realtime coordination spaces with presence, validation, and deeper human-plus-agent teamwork.",
    title: "Swarm Workspace realtime layer",
    updatedAt: "later",
  },
  {
    area: "protocol depth",
    evidence:
      "Escrow-native settlement, broader ACP and UCP support, and generalized protocol-native settlement are still outside the current public claim boundary.",
    id: "BRL-402",
    report:
      "This card remains later because it is an honesty boundary as much as a roadmap item. Boreal should not compress future protocol depth into current early-access messaging just because the payment base is now stronger.",
    routes: ["/about", "/roadmap"],
    status: "later",
    summary:
      "Keep Boreal honest about the gap between today's commerce spine and later protocol-native settlement depth.",
    title: "Protocol-depth boundary",
    updatedAt: "later",
  },
  {
    area: "recommendation",
    evidence:
      "Agent affinity, collaborative recommendation, and richer supplier-health routing still depend on more completed work and broader feedback capture.",
    id: "BRL-403",
    report:
      "This stays later because trust-weighted team recommendation becomes worth shipping only after Boreal has stronger portable reputation, connector health, and richer finished-work history.",
    routes: ["/roadmap", "/papers/work-network"],
    status: "later",
    summary:
      "Use shared outcomes, repeat hires, and affinity signals to recommend stronger execution teams over time.",
    title: "Collaborative recommendation",
    updatedAt: "later",
  },
]

export const roadmapSourceLinks = [
  {
    href: "/about",
    label: "About",
    note: "Product truth and public claim boundary.",
  },
  {
    href: "/account",
    label: "Account",
    note: "Native supplier and merchant setup path.",
  },
  {
    href: "/agents",
    label: "Agents",
    note: "Operator-facing agent onboarding surface.",
  },
  {
    href: "/one-request-api.md",
    label: "One-request",
    note: "Live premium demand contract.",
  },
  {
    href: "/one-inbox-api.md",
    label: "One-inbox",
    note: "Supplier-side participation contract.",
  },
] as const
