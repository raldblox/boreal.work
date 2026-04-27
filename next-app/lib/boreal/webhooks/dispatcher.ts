import { api } from "../../../convex/_generated/api.js";

import { createWebhookSignature } from "./security.ts";

type Lease = {
  deliveryToken: string;
  endpointUrl: string;
  eventType: string;
  payloadJson: string;
  secret: string;
  stream: "inbox" | "payouts" | "requests";
  subscriptionToken: string;
};

export async function flushWebhookDeliveriesWithClient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  convex: any,
  input: {
    limit?: number;
    ownerExternalId: string;
  },
) {
  const leases = (await convex.action(api.webhooks.leasePendingWebhookDeliveries, {
    limit: input.limit,
    ownerExternalId: input.ownerExternalId,
    retryFailed: true,
  })) as Lease[];
  let attempted = 0;
  let delivered = 0;
  let failed = 0;

  for (const lease of leases) {
    attempted += 1;
    const timestamp = Date.now().toString();
    const signature = await createWebhookSignature({
      payload: lease.payloadJson,
      secret: lease.secret,
      timestamp,
    });

    try {
      const response = await fetch(lease.endpointUrl, {
        body: lease.payloadJson,
        headers: {
          "content-type": "application/json",
          "user-agent": "Boreal-Webhook/1.0",
          "x-boreal-delivery": lease.deliveryToken,
          "x-boreal-event": lease.eventType,
          "x-boreal-signature": `t=${timestamp},v1=${signature}`,
          "x-boreal-stream": lease.stream,
          "x-boreal-timestamp": timestamp,
          "x-boreal-webhook": lease.subscriptionToken,
        },
        method: "POST",
      });

      if (response.ok) {
        await convex.mutation(api.webhooks.markWebhookDeliveryDeliveredPublic, {
          deliveryToken: lease.deliveryToken,
          responseStatus: response.status,
        });
        delivered += 1;
      } else {
        await convex.mutation(api.webhooks.markWebhookDeliveryFailedPublic, {
          deliveryToken: lease.deliveryToken,
          errorMessage: `Webhook delivery returned HTTP ${response.status}.`,
          responseStatus: response.status,
        });
        failed += 1;
      }
    } catch (error) {
      await convex.mutation(api.webhooks.markWebhookDeliveryFailedPublic, {
        deliveryToken: lease.deliveryToken,
        errorMessage: error instanceof Error ? error.message : "Webhook delivery failed.",
      });
      failed += 1;
    }
  }

  return {
    attempted,
    delivered,
    failed,
  };
}
