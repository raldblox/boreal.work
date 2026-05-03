import "server-only";

import {
  FacilitatorResponseError,
  getFacilitatorResponseError,
  HTTPFacilitatorClient,
  type FacilitatorClient,
} from "@x402/core/server";
import type {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  SupportedResponse,
  VerifyResponse,
} from "@x402/core/types";

import {
  getBorealX402FallbackFacilitatorConfig,
  getBorealX402PrimaryFacilitatorConfig,
  getBorealX402TimeoutMs,
  type BorealX402FacilitatorKind,
} from "./config";

type FacilitatorEndpoint = {
  client: FacilitatorClient;
  kind: BorealX402FacilitatorKind;
  url: string;
};

export function createBorealX402FacilitatorClient(): FacilitatorClient {
  const endpoints = [
    createFacilitatorEndpoint(getBorealX402PrimaryFacilitatorConfig()),
    createFacilitatorEndpoint(getBorealX402FallbackFacilitatorConfig()),
  ].filter((endpoint): endpoint is FacilitatorEndpoint => endpoint !== null);

  if (endpoints.length === 0) {
    throw new Error(
      "Boreal x402 has no usable facilitators configured. Set CDP auth or a fallback facilitator URL.",
    );
  }

  return new BorealFallbackFacilitatorClient(endpoints);
}

class BorealFallbackFacilitatorClient implements FacilitatorClient {
  constructor(private readonly endpoints: FacilitatorEndpoint[]) {}

  async getSupported() {
    const successes: SupportedResponse[] = [];
    const failures: unknown[] = [];

    for (const endpoint of this.endpoints) {
      try {
        const supported = await endpoint.client.getSupported();

        if (supported.kinds.length === 0) {
          failures.push(
            new Error(
              `Facilitator ${endpoint.url} returned zero supported payment kinds.`,
            ),
          );
          continue;
        }

        successes.push(supported);
      } catch (error) {
        failures.push(error);
      }
    }

    if (successes.length === 0) {
      throw buildFacilitatorBootstrapError(failures);
    }

    return mergeSupportedResponses(successes);
  }

  async verify(
    paymentPayload: PaymentPayload,
    paymentRequirements: PaymentRequirements,
  ): Promise<VerifyResponse> {
    return this.trySequentially((client) =>
      client.verify(paymentPayload, paymentRequirements),
    );
  }

  async settle(
    paymentPayload: PaymentPayload,
    paymentRequirements: PaymentRequirements,
  ): Promise<SettleResponse> {
    return this.trySequentially((client) =>
      client.settle(paymentPayload, paymentRequirements),
    );
  }

  private async trySequentially<T>(
    run: (client: FacilitatorClient) => Promise<T>,
  ): Promise<T> {
    let lastError: unknown = null;

    for (let index = 0; index < this.endpoints.length; index += 1) {
      try {
        return await run(this.endpoints[index].client);
      } catch (error) {
        lastError = error;

        if (
          index >= this.endpoints.length - 1 ||
          !shouldFallbackToSecondary(error)
        ) {
          throw error;
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Boreal x402 facilitator request failed.");
  }
}

function createFacilitatorEndpoint(input: {
  kind: BorealX402FacilitatorKind;
  url: string;
}): FacilitatorEndpoint | null {
  if (!isFacilitatorEnabled(input.kind)) {
    return null;
  }

  return {
    client: new HTTPFacilitatorClient({
      createAuthHeaders: async () =>
        createAuthHeadersForFacilitator(input.kind, input.url),
      url: input.url,
    }),
    kind: input.kind,
    url: input.url,
  };
}

function isFacilitatorEnabled(kind: BorealX402FacilitatorKind) {
  if (kind !== "cdp") {
    return true;
  }

  return Boolean(
    process.env.BOREAL_X402_CDP_BEARER_TOKEN?.trim() ||
      (process.env.BOREAL_X402_CDP_API_KEY_ID?.trim() &&
        process.env.BOREAL_X402_CDP_API_KEY_SECRET?.trim()),
  );
}

async function createAuthHeadersForFacilitator(
  kind: BorealX402FacilitatorKind,
  url: string,
) {
  if (kind !== "cdp") {
    return {
      settle: {},
      supported: {},
      verify: {},
    };
  }

  const directBearer = process.env.BOREAL_X402_CDP_BEARER_TOKEN?.trim();

  if (directBearer) {
    const headers = {
      Authorization: `Bearer ${directBearer}`,
    };

    return {
      settle: headers,
      supported: headers,
      verify: headers,
    };
  }

  const apiKeyId = process.env.BOREAL_X402_CDP_API_KEY_ID?.trim();
  const apiKeySecret = process.env.BOREAL_X402_CDP_API_KEY_SECRET?.trim();

  if (!apiKeyId || !apiKeySecret) {
    return {
      settle: {},
      supported: {},
      verify: {},
    };
  }

  const authModuleSpecifier = "@coinbase/cdp-sdk/auth";
  const authModule = (await import(authModuleSpecifier as string)) as {
    generateJwt?: (input: {
      apiKeyId: string;
      apiKeySecret: string;
      expiresIn?: number;
      requestHost: string;
      requestMethod: string;
      requestPath: string;
    }) => Promise<string>;
  };

  if (typeof authModule.generateJwt !== "function") {
    throw new Error(
      "CDP x402 auth is configured, but @coinbase/cdp-sdk/auth is unavailable.",
    );
  }

  const facilitatorUrl = new URL(url);
  const buildHeaders = async (path: "settle" | "supported" | "verify") => {
    const requestPath = `${facilitatorUrl.pathname.replace(/\/$/, "")}/${path}`;
    const token = await authModule.generateJwt!({
      apiKeyId,
      apiKeySecret,
      expiresIn: 120,
      requestHost: facilitatorUrl.host,
      requestMethod: path === "supported" ? "GET" : "POST",
      requestPath,
    });

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  return {
    settle: await buildHeaders("settle"),
    supported: await buildHeaders("supported"),
    verify: await buildHeaders("verify"),
  };
}

function shouldFallbackToSecondary(error: unknown) {
  const responseStatusCode =
    readFacilitatorStatusCode(error) ??
    readFacilitatorStatusCode(getFacilitatorResponseError(error));

  if (responseStatusCode !== null) {
    return (
      responseStatusCode === 401 ||
      responseStatusCode === 403 ||
      responseStatusCode === 408 ||
      responseStatusCode >= 500
    );
  }

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("unsupported payment kinds") ||
    message.includes("getsupported failed") ||
    message.includes("econnrefused") ||
    message.includes("enotfound")
  );
}

function mergeSupportedResponses(responses: SupportedResponse[]): SupportedResponse {
  const kinds = new Map<string, SupportedResponse["kinds"][number]>();
  const extensions = new Set<string>();
  const signers = new Map<string, Set<string>>();

  for (const response of responses) {
    for (const kind of response.kinds) {
      const key = `${kind.x402Version}:${kind.scheme}:${kind.network}`;

      if (!kinds.has(key)) {
        kinds.set(key, kind);
      }
    }

    for (const extension of response.extensions ?? []) {
      extensions.add(extension);
    }

    for (const [network, signerList] of Object.entries(response.signers ?? {})) {
      if (!signers.has(network)) {
        signers.set(network, new Set<string>());
      }

      const networkSigners = signers.get(network)!;

      for (const signer of signerList) {
        networkSigners.add(signer);
      }
    }
  }

  return {
    extensions: Array.from(extensions),
    kinds: Array.from(kinds.values()),
    signers: Object.fromEntries(
      Array.from(signers.entries()).map(([network, signerList]) => [
        network,
        Array.from(signerList),
      ]),
    ),
  };
}

function buildFacilitatorBootstrapError(failures: unknown[]) {
  const details = failures
    .map((error) => (error instanceof Error ? error.message : String(error)).trim())
    .filter(Boolean);

  if (details.length === 0) {
    return new Error(
      "Boreal x402 could not load supported payment kinds from any facilitator.",
    );
  }

  return new Error(
    `Boreal x402 could not load supported payment kinds from any facilitator. ${details.join(" | ")}`,
  );
}

function readFacilitatorStatusCode(error: unknown) {
  if (!(error instanceof FacilitatorResponseError)) {
    return null;
  }

  const statusCode =
    typeof (error as unknown as { statusCode?: unknown }).statusCode === "number"
      ? (error as unknown as { statusCode: number }).statusCode
      : null;

  return statusCode;
}
