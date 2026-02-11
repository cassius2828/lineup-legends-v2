import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Stick_No_Bills } from "next/font/google";
import { Toaster } from "sonner";

import { TRPCReactProvider } from "~/trpc/react";
import Nav from "./_components/Nav";
import { Footer } from "./_components/landing";
import { SessionProvider } from "next-auth/react";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Lineup Legends",
  description: "Build your dream fantasy basketball lineup with a $15 budget",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
    <html lang="en" className={`${geist.variable} ${stickNoBills.variable}`}>
      <body>
        <TRPCReactProvider>
          <SessionProvider>
            <Nav />
            <div className="mb-24 md:mb-16"></div>
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
            <Footer />
            <Toaster richColors position="top-center" />
          </SessionProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
