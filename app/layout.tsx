import type { Metadata, Viewport } from "next";
import { Geist_Mono, IBM_Plex_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const outfitHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "Relato — Architecture Review Atlas",
    template: "%s | Relato",
  },
  description:
    "Build architecture review sheets that connect responsibilities, dependencies, and source files into one readable map.",
  keywords: [
    "architecture diagram",
    "code atlas",
    "architecture review",
    "UML",
    "class diagram",
    "system design",
    "diagram builder",
    "software architecture",
    "visual documentation",
  ],
  authors: [{ name: "Relato team" }],
  creator: "Relato",
  publisher: "Relato",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Relato",
    title: "Relato — Architecture Review Atlas",
    description:
      "Build architecture review sheets that connect responsibilities, dependencies, and source files.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Relato — Architecture Review Atlas",
    description:
      "Build architecture review sheets that connect responsibilities, dependencies, and source files.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // TODO: Make lang dynamic when i18n is added
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistMono.variable,
        "font-sans",
        ibmPlexSans.variable,
        outfitHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        {/* Static SVG marker defs — present for all diagram edges, rendered once */}
        <svg
          aria-hidden
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <defs>
            {/* Open arrow — association / dependency */}
            <marker
              id="uml-open-arrow"
              markerWidth="12"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d="M1,1.5 L10,5 L1,8.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
            {/* Hollow triangle — inheritance */}
            <marker
              id="uml-inheritance"
              markerWidth="15"
              markerHeight="12"
              refX="14"
              refY="6"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d="M1,1 L14,6 L1,11 Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="var(--color-background)"
              />
            </marker>
            {/* Hollow diamond — aggregation */}
            <marker
              id="uml-aggregation"
              markerWidth="22"
              markerHeight="12"
              refX="11"
              refY="6"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d="M1,6 L11,1 L21,6 L11,11 Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="var(--color-background)"
              />
            </marker>
          </defs>
        </svg>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
