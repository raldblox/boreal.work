import { generateAgentMarkdown } from "../shared/llm.ts";
import { buildDefaultAgentSettlement } from "../shared/runtime-config.ts";
import type { AutonomousAgentDefinition } from "../shared/types.ts";

const SOLANA_OPERATOR_SYSTEM =
  "You are Boreal's Solana Operator. Produce concise, non-custodial Solana execution plans. Never imply that Boreal secretly controls the user's wallet. Assume the user signs or explicitly approves every onchain action. Flag missing assumptions, risks, and irreversible steps clearly.";

export const solanaOperatorAgent: AutonomousAgentDefinition = {
  identity: {
    actorKind: "agent",
    displayName: "Solana Operator",
    externalId: "agent:solana-operator",
    handle: "solana-operator",
  },
  key: "solana-operator",
  profile: {
    availabilityStatus: "available",
    bio: "Prepares non-custodial Solana execution plans for swaps, staking, transfers, launches, vault deposits, and wallet-safety reviews.",
    capabilityTags: [
      "solana planning",
      "non-custodial execution",
      "wallet approval flow",
      "defi operations",
      "transaction review",
    ],
    headline: "Non-custodial Solana action planner",
    isPublic: true,
    productLabels: ["swap plan", "staking checklist", "wallet safety review"],
    skillTags: ["transaction planning", "risk review", "approval checklist"],
  },
  supplyEntry: {
    agentReady: true,
    capabilityTags: [
      "solana",
      "wallet operations",
      "defi guidance",
      "risk review",
    ],
    category: "solana",
    checkoutProtocol: "custom",
    deliveryType: "instant",
    description:
      "Direct Solana specialist that returns a non-custodial execution plan, approval checklist, and risk notes instead of taking custody of funds.",
    executorUrl: "/api/agents/solana-operator/execute",
    fulfillmentKind: "digital",
    isCartEnabled: false,
    outputTypes: ["text"],
    priceAmount: 0,
    priceType: "fixed",
    scenarioTypes: ["consultation"],
    sourceProviderKey: "manual",
    supplyType: "capability",
    supportsPrivyWallet: true,
    title: "Solana Operator",
  },
  settlement: buildDefaultAgentSettlement(),
  async buildDelivery({ detail, modelId }) {
    const deliverablesBody = await generateAgentMarkdown({
      modelId,
      prompt: [
        `Request title: ${detail.title}`,
        `Request summary: ${detail.summary}`,
        `Request body: ${detail.body}`,
        "Prepare a Solana execution plan in markdown.",
        "Include:",
        "1. Objective",
        "2. Recommended onchain path",
        "3. Required wallet and network",
        "4. Approval checklist",
        "5. Risks and irreversible steps",
        "6. Missing information still needed",
        "Rules:",
        "- keep it non-custodial",
        "- do not ask the user to share a seed phrase or private key",
        "- if the action is high-risk, recommend a small rehearsal or simulation first",
      ].join("\n"),
      system: SOLANA_OPERATOR_SYSTEM,
    });

    return {
      deliverablesBody,
      deliverablesType: "markdown",
    };
  },
  buildProposal({ detail }) {
    return {
      currency: "USD",
      deliverablesBody: `I will turn "${detail.title}" into a non-custodial Solana execution plan with wallet requirements, approvals, and explicit risk notes.`,
      etaAt: Date.now() + 30 * 60 * 1000,
      price: 0.01,
    };
  },
  match({ detail, request }) {
    const text = `${request.title} ${request.summary} ${detail?.body ?? ""}`.toLowerCase();
    let score = 0;

    for (const keyword of [
      "solana",
      "swap",
      "stake",
      "staking",
      "wallet",
      "token",
      "airdrop",
      "jupiter",
      "raydium",
      "orca",
      "drift",
      "meteora",
    ]) {
      if (text.includes(keyword)) {
        score += 12;
      }
    }

    if (request.category === "solana" || request.category === "advisory") {
      score += 18;
    }

    return Math.min(score, 100);
  },
  directExecution: {
    auth: "x-session",
    description:
      "Builds a non-custodial Solana execution plan with wallet, approval, and risk guidance.",
    exampleRequest: {
      request:
        "Swap 150 USDC into SOL on mainnet, then stake the resulting SOL with an approval-first flow.",
      walletMode: "privy",
    },
    fields: [
      {
        description: "What you want to do on Solana.",
        name: "request",
        required: true,
        type: "string",
      },
      {
        description:
          "Optional wallet mode such as privy, phantom, backpack, or server wallet.",
        name: "walletMode",
        required: false,
        type: "string",
      },
      {
        description:
          "Optional risk preference such as conservative, balanced, or aggressive.",
        name: "riskPreference",
        required: false,
        type: "string",
      },
      {
        description:
          "Optional network target such as solana:mainnet or solana:testnet.",
        name: "network",
        required: false,
        type: "string",
      },
    ],
    invoke: async ({ modelId, payload }) => {
      const request = String(payload.request ?? "").trim();
      const walletMode =
        typeof payload.walletMode === "string" ? payload.walletMode.trim() : "";
      const riskPreference =
        typeof payload.riskPreference === "string"
          ? payload.riskPreference.trim()
          : "";
      const network =
        typeof payload.network === "string" ? payload.network.trim() : "";

      if (!request) {
        throw new Error("request is required for solana-operator.");
      }

      const content = await generateAgentMarkdown({
        modelId,
        prompt: [
          `Solana request: ${request}`,
          walletMode ? `Wallet mode: ${walletMode}` : "Wallet mode: unspecified",
          riskPreference
            ? `Risk preference: ${riskPreference}`
            : "Risk preference: conservative by default",
          network ? `Requested network: ${network}` : "Requested network: unspecified",
          "Produce a non-custodial Solana execution plan.",
          "Output sections:",
          "1. Objective",
          "2. Suggested path",
          "3. Wallet and network requirements",
          "4. Approval steps",
          "5. Risks and irreversible actions",
          "6. What Boreal can automate later",
          "Rules:",
          "- do not imply hidden server-side custody",
          "- do not ask for seed phrases or private keys",
          "- if execution would be risky, recommend a small rehearsal or staged approval first",
          "- if key details are missing, list them explicitly before execution",
        ].join("\n"),
        system: SOLANA_OPERATOR_SYSTEM,
      });

      return {
        content,
        contentType: "text/markdown" as const,
        kind: "text" as const,
        title: "Solana execution plan",
      };
    },
    outputKinds: ["text"],
    routePath: "/api/agents/solana-operator/execute",
    version: "boreal-agent-registry/v1",
  },
};
