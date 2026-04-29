import { NextResponse } from "next/server"

import {
  getSignedRefreshEnvelopes,
  isStaticShellCacheKey,
  parsePublicMarketCacheKey,
} from "@/lib/boreal/shell-cache/server"
import type { CacheKey, ShellCacheRefreshRequest } from "@/lib/boreal/shell-cache/types"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ShellCacheRefreshRequest
    const keys = Array.isArray(body?.keys)
      ? body.keys.filter((key): key is CacheKey => {
          if (typeof key !== "string") {
            return false
          }

          return isStaticShellCacheKey(key) || Boolean(parsePublicMarketCacheKey(key))
        })
      : []

    if (keys.length === 0) {
      return NextResponse.json(
        { error: "keys must contain at least one supported cache key." },
        { status: 400 },
      )
    }

    const payload = await getSignedRefreshEnvelopes(keys)

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
            : "Could not refresh shell cache.",
      },
      { status: 500 },
    )
  }
}
