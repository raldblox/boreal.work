import { NextResponse } from "next/server"

import { getSignedBootstrapEnvelopes } from "@/lib/boreal/shell-cache/server"

export async function GET() {
  try {
    const payload = await getSignedBootstrapEnvelopes()

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load shell cache bootstrap.",
      },
      { status: 500 },
    )
  }
}
