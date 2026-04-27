import { ConvexHttpClient } from "convex/browser";

function getConvexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_CONVEX_URL. Run `npx convex dev` or add the deployment URL to .env.local.",
    );
  }

  return url;
}

export function createConvexServerClient() {
  return new ConvexHttpClient(getConvexUrl());
}
