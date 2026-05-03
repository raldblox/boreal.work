"use client"

import { useEffect, useRef, useState } from "react"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const startedRef = useRef(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    const callbackUrl =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("callbackUrl") ?? "/chat"
        : "/chat"

    setIsLoading(true)
    void signIn("twitter", { callbackUrl }).finally(() => {
      setIsLoading(false)
    })
  }, [])

  async function handleContinue() {
    const callbackUrl =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("callbackUrl") ?? "/chat"
        : "/chat"

    setIsLoading(true)
    try {
      await signIn("twitter", { callbackUrl })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-sm">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">
            Early access
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Continue with X
          </h1>
          <p className="text-sm text-muted-foreground">
            Boreal uses your X account for requests, offers, payouts, and
            reviews.
          </p>
        </div>
        <Button className="mt-6 w-full" disabled={isLoading} onClick={handleContinue} type="button">
          {isLoading ? "Opening X..." : "Sign in with X"}
        </Button>
      </div>
    </main>
  )
}
