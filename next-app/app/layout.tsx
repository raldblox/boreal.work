import type { Metadata } from "next"
import { Fraunces, Geist_Mono, Manrope, Syne } from "next/font/google"

import "./globals.css"
import { ConvexClientProvider } from "@/app/convex-client-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { PrivyProvider } from "@/components/privy-provider"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans-base" })

const syne = Syne({ subsets: ["latin"], variable: "--font-heading-display" })

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-editorial-serif",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Boreal",
  },
  applicationName: "Boreal",
  description: "Chat-native market for request-native commerce.",
  manifest: "/manifest.webmanifest",
  title: "Boreal",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        "font-sans",
        fontMono.variable,
        fraunces.variable,
        manrope.variable,
        syne.variable
      )}
    >
      <body className="min-h-screen bg-background text-foreground">
        <a
          className="absolute top-4 left-4 z-[1000] -translate-y-24 rounded-full border border-primary/30 bg-background px-4 py-2 text-sm text-foreground shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="#main-content"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <PrivyProvider>
            <AuthProvider>
              <ConvexClientProvider>
                <TooltipProvider>
                  {children}
                  <ServiceWorkerRegistration />
                </TooltipProvider>
              </ConvexClientProvider>
            </AuthProvider>
          </PrivyProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
