import type { Metadata } from "next";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { Navbar } from "@/components/Navbar";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oasis Social Store",
  description: "A social ecommerce demo powered by Reusable KYC by Oathstone.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body>
          <ConvexClientProvider>
            <Navbar />
            <main className="main-content">{children}</main>
          </ConvexClientProvider>
          {/*
            The Oathstone WebMCP script — registers 13 browser-native tools.
            This single tag is all a third-party site needs to add RKYC support.
          */}
          <Script
            src="https://business.oathstone.cloud/oathstone-webmcp.js"
            strategy="afterInteractive"
          />
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
