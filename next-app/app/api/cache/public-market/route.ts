import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import {
  getSignedPublicMarketEnvelope,
  normalizePublicMarketQuery,
} from "@/lib/boreal/shell-cache/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tab = searchParams.get("tab")
  const limit = Number(searchParams.get("limit") ?? "36")
  const query = normalizePublicMarketQuery(searchParams.get("query"))

  if (tab !== "requests" && tab !== "workers") {
    return NextResponse.json(
      { error: "tab must be requests or workers." },
      { status: 400 },
    )
  }

  if (!Number.isFinite(limit) || limit <= 0) {
    return NextResponse.json(
      { error: "limit must be a positive number." },
      { status: 400 },
    )
  }

  try {
    const session = await auth()
    const payload = await getSignedPublicMarketEnvelope({
      limit,
      ownerExternalId: session?.user?.id ?? null,
      query,
      tab,
    })

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load market cache.",
      },
      { status: 500 },
    )
  }
}
