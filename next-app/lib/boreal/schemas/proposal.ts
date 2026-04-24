export type ProposalDraft = {
  currency: string;
  deliverablesBody: string;
  deliverablesType: "file" | "link" | "markdown";
  etaDays: number;
  price: number;
  summary: string;
};

export function normalizeProposalDraft(
  raw: Record<string, unknown>,
  message: string,
): ProposalDraft {
  const etaDays = toPositiveNumber(raw.etaDays, 7);
  const price = toPositiveNumber(raw.price, 100);
  const deliverablesBody =
    typeof raw.deliverablesBody === "string" && raw.deliverablesBody.trim().length > 0
      ? raw.deliverablesBody.trim()
      : message.trim();
  const summary =
    typeof raw.summary === "string" && raw.summary.trim().length > 0
      ? raw.summary.trim()
      : deliverablesBody.slice(0, 140);
  const currency =
    typeof raw.currency === "string" && raw.currency.trim().length > 0
      ? raw.currency.trim().toUpperCase()
      : "USD";
  const deliverablesType =
    raw.deliverablesType === "file" || raw.deliverablesType === "link"
      ? raw.deliverablesType
      : "markdown";

  return {
    currency,
    deliverablesBody,
    deliverablesType,
    etaDays,
    price,
    summary,
  };
}

function toPositiveNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number.parseFloat(value.replace(/[^\d.]/g, ""));

    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }

  return fallback;
}
