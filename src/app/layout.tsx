import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Stick_No_Bills } from "next/font/google";
import { Toaster } from "sonner";

import { TooltipProvider } from "~/components/ui/tooltip";
import { TRPCReactProvider } from "~/trpc/react";
import Nav from "./_components/Nav";
import { Footer } from "./_components/landing";
import GlobalCommentModal from "./_components/Comment/GlobalCommentModal";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: {
    default: "Lineup Legends",
    template: "%s | Lineup Legends",
  },
  description:
    "Build your dream fantasy basketball lineup with a $15 budget. Create, rate, gamble, and compete with friends.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://lineuplegends.com",
  ),
  openGraph: {
    type: "website",
    siteName: "Lineup Legends",
    title: "Lineup Legends",
    description:
      "Build your dream fantasy basketball lineup with a $15 budget. Create, rate, gamble, and compete with friends.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lineup Legends",
    description:
      "Build your dream fantasy basketball lineup with a $15 budget.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const stickNoBills = Stick_No_Bills({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-stencil",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${stickNoBills.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TRPCReactProvider>
          <SessionProvider>
            <TooltipProvider>
              <div id="global-nav">
                <Nav />
              </div>
              <div id="global-nav-spacer" className="mb-24 md:mb-16"></div>
              <div className="flex-1">
                <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
              </div>
              <div id="global-footer">
                <Footer />
              </div>
              <GlobalCommentModal />
              <Toaster richColors position="top-center" />
            </TooltipProvider>
          </SessionProvider>
        </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
