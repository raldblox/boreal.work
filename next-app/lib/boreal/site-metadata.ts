import type { Metadata } from "next"

const DEFAULT_SITE_URL = "https://boreal.work"

export const SITE_NAME = "Boreal"
export const SITE_DESCRIPTION =
  "Boreal turns a plain-language request into the best matched route, tracked delivery, and attached payout across agents, people, and direct offers."

const DEFAULT_KEYWORDS = [
  "Boreal",
  "request-native commerce",
  "agent marketplace",
  "agent work network",
  "agent onboarding",
  "specialist routing",
  "Solana mainnet",
] as const

type PageMetadataOptions = {
  canonicalPath?: string
  description: string
  keywords?: readonly string[]
  noIndex?: boolean
  path: string
  title: string
  type?: "article" | "website"
}

function normalizeSiteUrl(input?: string | null) {
  const value = input?.trim()

  if (!value) {
    return null
  }

  try {
    const parsed = new URL(
      value.startsWith("http://") || value.startsWith("https://")
        ? value
        : `https://${value}`
    )

    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, "")
  } catch {
    return null
  }
}

export function getSiteUrl() {
  return (
    normalizeSiteUrl(process.env.BOREAL_PUBLIC_ORIGIN) ??
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    DEFAULT_SITE_URL
  )
}

export function toAbsoluteUrl(path = "/") {
  return new URL(path, `${getSiteUrl()}/`)
}

function getRobots(noIndex = false): Metadata["robots"] {
  if (noIndex) {
    return {
      follow: false,
      googleBot: {
        follow: false,
        index: false,
        "max-image-preview": "none",
        "max-snippet": 0,
        "max-video-preview": 0,
      },
      index: false,
    }
  }

  return {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    index: true,
  }
}

export const rootMetadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  applicationName: SITE_NAME,
  authors: [
    {
      name: SITE_NAME,
      url: getSiteUrl(),
    },
  ],
  category: "technology",
  classification: "Request-native commerce",
  creator: SITE_NAME,
  description: SITE_DESCRIPTION,
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  icons: {
    apple: "/favicon.ico",
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  keywords: [...DEFAULT_KEYWORDS],
  manifest: "/manifest.webmanifest",
  metadataBase: toAbsoluteUrl("/"),
  openGraph: {
    description: SITE_DESCRIPTION,
    locale: "en_US",
    siteName: SITE_NAME,
    title: SITE_NAME,
    type: "website",
    url: "/",
  },
  publisher: SITE_NAME,
  referrer: "origin-when-cross-origin",
  robots: getRobots(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  twitter: {
    card: "summary_large_image",
    description: SITE_DESCRIPTION,
    title: SITE_NAME,
  },
}

export function buildPageMetadata({
  canonicalPath,
  description,
  keywords = [],
  noIndex = false,
  path,
  title,
  type = "website",
}: PageMetadataOptions): Metadata {
  return {
    alternates: {
      canonical: canonicalPath ?? path,
    },
    description,
    keywords: [...new Set([...DEFAULT_KEYWORDS, ...keywords])],
    openGraph: {
      description,
      locale: "en_US",
      siteName: SITE_NAME,
      title,
      type,
      url: canonicalPath ?? path,
    },
    robots: getRobots(noIndex),
    title,
    twitter: {
      card: "summary_large_image",
      description,
      title,
    },
  }
}
