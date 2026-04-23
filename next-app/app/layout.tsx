import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ConvexClientProvider } from "@/app/convex-client-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { PrivyProvider } from "@/components/privy-provider"
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
<body>
        <ThemeProvider>
          <PrivyProvider>
            <AuthProvider>
              <ConvexClientProvider>
                <TooltipProvider>
                  {children}
                </TooltipProvider>
              </ConvexClientProvider>
            </AuthProvider>
          </PrivyProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
