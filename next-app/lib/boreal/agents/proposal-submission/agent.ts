import "server-only";

import { getBorealRuntimeConfig } from "@/lib/boreal/config";
import { resolveProviderAdapter } from "@/lib/boreal/integrations/providers/registry";
import type { ProposalDraft } from "@/lib/boreal/schemas/proposal";
import { parseProposalSubmission } from "@/lib/boreal/tools/llm/parse-proposal-submission";

export const proposalSubmissionAgent = {
  async run(input: {
    intentSummary: string;
    intentTitle: string;
    message: string;
  }): Promise<ProposalDraft> {
    const provider = resolveProviderAdapter();
    const config = getBorealRuntimeConfig();

    return parseProposalSubmission({
      intentSummary: input.intentSummary,
      intentTitle: input.intentTitle,
      message: input.message,
      modelId: config.assistantModel,
      provider,
    });
  },
};
