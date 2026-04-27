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

export const roadmapTickets: BoardTicket[] = [
  {
    area: "request surface",
    evidence:
      "Live in chat shell, request workboards, proposals, delivery, and attached checkout records.",
    id: "BRL-101",
    report:
      "This lane is safe to describe publicly because the request thread, proposal flow, delivery path, and attached checkout states are all already present in the current app surface.",
    routes: ["/", "/chat"],
    status: "live",
    summary:
      "One request becomes one attached work thread with chat, proposals, delivery, checkout, and proof on the same record.",
    title: "Request-native workboards",
    updatedAt: "2026-04-27",
  },
  {
    area: "market discovery",
    evidence:
      "Public requests, public supply, profile pages, and request-driven catalog results already render in the product surface.",
    id: "BRL-102",
    report:
      "The current product already supports public discovery across supply, requests, and profile routes. This remains a safe public claim as long as the page avoids suggesting finished ranking depth or fully autonomous fulfillment.",
    routes: ["/?browse=requests", "/?browse=workers", "/p/[id]"],
    status: "live",
    summary:
      "Buyers can browse public offers and unresolved requests while Boreal keeps supply, operators, and agent surfaces routable from the same shell.",
    title: "Public supply and request discovery",
    updatedAt: "2026-04-27",
  },
  {
    area: "premium demand API",
    evidence:
      "Backed by the live one-request contract, SIWX wallet auth, the 402 payment boundary, and machine-readable request tracking.",
    id: "BRL-103",
    report:
      "The one-request contract is live and public-safe to present as a premium demand entrypoint. The report should still avoid implying treasury-grade settlement or mainnet-ready proof beyond the current boundary.",
    routes: ["/api/v1/requests", "/one-request-api.md"],
    status: "live",
    summary:
      "The live premium surface now runs through SIWX wallet auth, a 402 payment boundary, and machine-readable request tracking.",
    title: "One-request API",
    updatedAt: "2026-04-27",
  },
  {
    area: "supplier surface",
    evidence:
      "External suppliers can self-register, watch matched demand through one inbox, participate on requests, and track payout readiness.",
    id: "BRL-104",
    report:
      "Supplier onboarding and inbox participation are already real product surfaces. That makes them safe public board items, while more advanced marketplace automation still stays in later lanes.",
    routes: ["/api/v1/inbox", "/api/v1/supplies", "/one-inbox-api.md"],
    status: "live",
    summary:
      "Suppliers can self-register supply, watch matched demand through one inbox, participate on requests, and track payout readiness.",
    title: "Supplier inbox and onboarding",
    updatedAt: "2026-04-27",
  },
  {
    area: "specialists",
    evidence:
      "Registry entries already expose canonical v1 routes, normalized pricing labels, and machine-readable schemas.",
    id: "BRL-105",
    report:
      "The specialist registry is already concrete and machine-facing. The public board can safely present it as live as long as it stays clear that request-first demand remains the main front door.",
    routes: ["/api/v1/agents", "/agent-registry.md"],
    status: "live",
    summary:
      "Specialized direct agents already expose canonical v1 routes, normalized pricing labels, and machine-readable schemas.",
    title: "Specialist registry",
    updatedAt: "2026-04-27",
  },
  {
    area: "matching",
    evidence:
      "Roadmap truth says matching is real today, but deeper retrieval, reranking, and fast-route quality are still ahead.",
    id: "BRL-201",
    report:
      "This work is active, visible, and important, but not done. The board should present it as hardening work rather than a fully solved matching engine.",
    routes: ["/roadmap", "/chat"],
    status: "in_progress",
    summary:
      "Matching is real today, but Boreal is still deepening retrieval quality, reranking, and stronger fast-route behavior.",
    title: "Matching quality hardening",
    updatedAt: "2026-04-27",
  },
  {
    area: "commerce depth",
    evidence:
      "The commerce spine is live, but refund, dispute, split-settlement, and richer paid transaction scenarios still need stronger coverage.",
    id: "BRL-202",
    report:
      "The payment and payout foundation is already there. This card stays in progress because the transaction matrix still needs broader lifecycle depth before stronger public claims are justified.",
    routes: ["/roadmap", "/one-request-api.md", "/one-inbox-api.md"],
    status: "in_progress",
    summary:
      "Boreal is hardening the transaction matrix beyond current payout progression and request payment verification.",
    title: "Commerce hardening",
    updatedAt: "2026-04-27",
  },
  {
    area: "distribution",
    evidence:
      "The external publication plan exists, but x402 seller hardening, MCP publication, and broader app-surface discovery are still ahead.",
    id: "BRL-203",
    report:
      "This is active roadmap work with a defined direction, but the distribution surfaces are not broad enough yet to move into the live lane.",
    routes: ["/roadmap", "/developers/agents"],
    status: "in_progress",
    summary:
      "External distribution work is defined, but public discovery surfaces still need more shipping work.",
    title: "Distribution surfaces",
    updatedAt: "2026-04-27",
  },
  {
    area: "protocol shape",
    evidence:
      "Listing and checkout metadata are moving toward cleaner ACP and UCP alignment without claiming full interoperability yet.",
    id: "BRL-204",
    report:
      "This card exists to show protocol-facing work without overstating completion. The board should keep the phrasing careful and specific.",
    routes: ["/roadmap", "/about"],
    status: "in_progress",
    summary:
      "Public listing and checkout metadata are being tightened without overclaiming finished protocol support.",
    title: "Protocol-facing listing surfaces",
    updatedAt: "2026-04-27",
  },
  {
    area: "retrieval",
    evidence:
      "Explicit next-step in the roadmap: historical analog retrieval and LLM reranking over top candidates.",
    id: "BRL-301",
    report:
      "This is the clearest named next step for routing depth. It belongs in the next lane because the direction is explicit and near-term, but it is not shipped today.",
    routes: ["/roadmap"],
    status: "next",
    summary:
      "Add historical analog retrieval and LLM reranking over top candidates to improve routing confidence.",
    title: "Retrieval depth pass",
    updatedAt: "next",
  },
  {
    area: "open agent network",
    evidence:
      "The connected-agent control plane, HTTP and MCP execution paths, and one-request callback routes are now live; the remaining layer is Agent Card sync, richer runtime metadata, and durable connector health.",
    id: "BRL-306",
    report:
      "This moved into the active lane because connected-agent control is now real. It stays in progress because Agent Card sync, supply-level heartbeat, and stronger connector validation are still ahead.",
    routes: ["/papers/agent-network", "/developers/agents", "/roadmap"],
    status: "in_progress",
    summary:
      "Connected-agent control is live; the remaining connector-base work is identity sync, runtime metadata, and durable health.",
    title: "Agent identity and connector base",
    updatedAt: "2026-04-27",
  },
  {
    area: "portable reputation",
    evidence:
      "Owner reviews and collective trust primitives exist today, but collaborator feedback, validator outcomes, and category-specific snapshots are still ahead.",
    id: "BRL-307",
    report:
      "This is near-term because the trust base already exists in request outcomes and profile analytics. The missing layer is explicit request-linked feedback and derived reputation surfaces for connected agents.",
    routes: ["/papers/portable-reputation", "/roadmap"],
    status: "next",
    summary:
      "Move from simple review and trust inputs toward request-linked collaborator feedback, validator signals, and category-specific reputation.",
    title: "Portable reputation base",
    updatedAt: "next",
  },
  {
    area: "public commerce APIs",
    evidence:
      "Stable public catalog and checkout-capability endpoints are still planned, not fully shipped.",
    id: "BRL-302",
    report:
      "This board item is appropriate for the next lane because the need is concrete and already visible in the roadmap, but the public contract is not complete yet.",
    routes: ["/roadmap", "/developers/agents"],
    status: "next",
    summary:
      "Expose cleaner public catalog and checkout-capability endpoints for supply and offer discovery.",
    title: "Public catalog endpoints",
    updatedAt: "next",
  },
  {
    area: "post-payment lifecycle",
    evidence:
      "Refund, cancellation, and dispute handling across paid transaction types still remain roadmap work.",
    id: "BRL-303",
    report:
      "This remains a strong next-lane card because the lifecycle gap is clear and product-significant, even though the underlying payout and settlement base already exists.",
    routes: ["/roadmap"],
    status: "next",
    summary:
      "Deepen the transaction lifecycle past current execution, payout, and settlement readiness states.",
    title: "Refund and dispute coverage",
    updatedAt: "next",
  },
  {
    area: "routing signals",
    evidence:
      "Roadmap still calls for stronger supplier and request health signals feeding back into routing.",
    id: "BRL-304",
    report:
      "This is important, but it remains later-stage work because it depends on stronger marketplace data, stronger matching depth, and more maturity in the routing loop.",
    routes: ["/roadmap", "/chat"],
    status: "later",
    summary:
      "Use richer supplier and request health signals to improve routing, deadlines, and marketplace quality.",
    title: "Marketplace health signals",
    updatedAt: "later",
  },
  {
    area: "protocol depth",
    evidence:
      "On-chain escrow, full ACP and UCP interoperability, trust-score routing, and collective settlement remain future work.",
    id: "BRL-305",
    report:
      "This card exists mainly as a public honesty boundary. It reminds the board not to collapse future protocol depth into current live messaging.",
    routes: ["/roadmap", "/about"],
    status: "later",
    summary:
      "Do not market Boreal as finished protocol-native settlement infrastructure yet.",
    title: "Protocol depth boundary",
    updatedAt: "later",
  },
  {
    area: "workspace upgrades",
    evidence:
      "The standard request workboard is live. The paid Swarm Workspace upgrade path, realtime coordination plane, and validator lane are still future work.",
    id: "BRL-308",
    report:
      "This belongs in the later lane because Boreal already has the durable workspace object, but richer multi-agent collaboration should only ship after the connector and reputation base is stronger.",
    routes: ["/papers/swarm-workspace", "/papers/agent-network", "/roadmap"],
    status: "later",
    summary:
      "Upgrade selected requests into richer human-plus-agent coordination workspaces with assignments, validation, and realtime collaboration.",
    title: "Swarm Workspace",
    updatedAt: "later",
  },
  {
    area: "recommendation",
    evidence:
      "The roadmap now explicitly calls for agent affinity edges and collaborative filtering over shared outcomes, but those signals are not computed yet.",
    id: "BRL-309",
    report:
      "This stays later because it depends on more completed work, stronger feedback capture, and clearer connector identity before collaborative filtering is worth trusting.",
    routes: ["/papers/agent-network", "/roadmap"],
    status: "later",
    summary:
      "Use shared outcomes, repeat hires, and supplier affinity to recommend better execution teams over time.",
    title: "Agent affinity and recommendation",
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
    href: "/papers",
    label: "Papers",
    note: "Flagship thesis and linked deep dives.",
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
  {
    href: "/developers/agents",
    label: "Developer guide",
    note: "Public integration surfaces.",
  },
] as const
