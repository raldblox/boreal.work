import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { auth } from "@/lib/auth";
import {
  getDesktopNodeByOwnerExternalId,
  queueDesktopAssignmentForOwner,
} from "@/lib/boreal/desktop-nodes/service";
import type {
  DesktopNodeAssignment,
  DesktopNodeEnvelope,
  DesktopNodeRuntimeFamily,
} from "@/lib/boreal/desktop-nodes/contracts";
import { createConvexServerClient } from "@/lib/boreal/integrations/convex/server-client";
import {
  convexFunctionRefs,
  type RequestDetail,
} from "@/lib/boreal/integrations/convex/function-refs";
import { isPublicRequestToken } from "@/lib/boreal/one-inbox/tokens";

type RouteContext = {
  params: Promise<{
    intentId: string;
  }>;
};

type RequestDesktopEnvelope = {
  assignment: DesktopNodeAssignment | null;
  node: DesktopNodeEnvelope["node"] | null;
  requestToken: string | null;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requestDetail = await loadOwnerRequestDetail({
      intentId: (await context.params).intentId,
      ownerExternalId: session.user.id,
    });

    if (!requestDetail.intent || !requestDetail.access?.isOwner) {
      return NextResponse.json(
        { error: "Request not found for this Boreal owner." },
        { status: 404 },
      );
    }

    const node = await getDesktopNodeByOwnerExternalId(session.user.id);

    return NextResponse.json(
      buildRequestDesktopEnvelope({
        node,
        requestToken: requestDetail.intent.requestToken,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Boreal Desktop routing.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requestDetail = await loadOwnerRequestDetail({
      intentId: (await context.params).intentId,
      ownerExternalId: session.user.id,
    });

    if (!requestDetail.intent || !requestDetail.access?.isOwner) {
      return NextResponse.json(
        { error: "Request not found for this Boreal owner." },
        { status: 404 },
      );
    }

    if (
      requestDetail.intent.status === "closed" ||
      requestDetail.intent.status === "fulfilled"
    ) {
      return NextResponse.json(
        { error: "Only active requests can be assigned into Boreal Desktop." },
        { status: 409 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      runtimeFamily?: DesktopNodeRuntimeFamily;
    };
    const node = await getDesktopNodeByOwnerExternalId(session.user.id);

    if (!node) {
      return NextResponse.json(
        {
          error:
            "Register Boreal Desktop first. Use the same wallet linked to this Boreal account.",
        },
        { status: 404 },
      );
    }

    if (node.node.availabilityStatus !== "available") {
      return NextResponse.json(
        {
          error:
            "Boreal Desktop is not available right now. Set the node back to available, then try again.",
        },
        { status: 409 },
      );
    }

    const runtimeFamily = selectRuntimeFamily(node, body.runtimeFamily);

    if (!runtimeFamily) {
      return NextResponse.json(
        { error: "No supported desktop runtime is registered on this node yet." },
        { status: 409 },
      );
    }

    const queued = await queueDesktopAssignmentForOwner({
      assignment: {
        outputKinds: requestDetail.intent.requestedOutputTypes,
        requestCallbacksEnabled: !isPublicRequestToken(
          requestDetail.intent.requestToken,
        ),
        requestToken: requestDetail.intent.requestToken,
        runtimeFamily,
        summary: buildDesktopAssignmentSummary(requestDetail),
        title: requestDetail.intent.title || "Boreal desktop request",
        workspaceHint: requestDetail.intent.category || null,
      },
      ownerExternalId: session.user.id,
    });

    const convex = createConvexServerClient();
    await convex.mutation(api.intents.assignDesktopNodeToRequest, {
      intentId: requestDetail.intent._id as Id<"intents">,
      ownerExternalId: session.user.id,
      supplyId: node.node.supplyId as Id<"supplies">,
    });

    return NextResponse.json({
      ...buildRequestDesktopEnvelope({
        node: queued.envelope,
        requestToken: requestDetail.intent.requestToken,
      }),
      created: queued.created,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to assign this request into Boreal Desktop.",
      },
      { status: 400 },
    );
  }
}

function buildRequestDesktopEnvelope(input: {
  node: DesktopNodeEnvelope | null;
  requestToken: string;
}): RequestDesktopEnvelope {
  return {
    assignment:
      input.node?.assignments.find(
        (assignment) => assignment.requestToken === input.requestToken,
      ) ?? null,
    node: input.node?.node ?? null,
    requestToken: input.requestToken,
  };
}

function buildDesktopAssignmentSummary(requestDetail: RequestDetail) {
  const summary = requestDetail.intent?.summary?.trim();

  if (summary) {
    return summary;
  }

  const body = requestDetail.intent?.body?.trim();

  if (body) {
    return body;
  }

  return requestDetail.intent?.title?.trim() || "Boreal desktop request";
}

async function loadOwnerRequestDetail(input: {
  intentId: string;
  ownerExternalId: string;
}) {
  const convex = createConvexServerClient();

  return (await convex.query(convexFunctionRefs.getRequestDetail, {
    intentId: input.intentId,
    ownerExternalId: input.ownerExternalId,
  })) as RequestDetail;
}

function selectRuntimeFamily(
  node: DesktopNodeEnvelope,
  requestedRuntimeFamily?: DesktopNodeRuntimeFamily,
) {
  if (
    requestedRuntimeFamily &&
    node.node.runtimeFamilies.includes(requestedRuntimeFamily)
  ) {
    return requestedRuntimeFamily;
  }

  if (node.node.runtimeFamilies.includes("codex")) {
    return "codex";
  }

  return node.node.runtimeFamilies[0] ?? null;
}
