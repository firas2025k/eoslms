import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/nav/site-footer";
import { PostHogIdentity } from "@/components/posthog-identity";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { DeploySkewReload } from "@/components/deploy-skew-reload";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Eos Academy",
  description:
    "A guided course for mid-career women ready to launch a purpose-driven venture — with education, opportunity, and support.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ClerkProvider appearance={clerkAppearance}>
          <DeploySkewReload />
          <PostHogIdentity />
          <div className="flex min-h-full flex-1 flex-col">
            {children}
            <SiteFooter />
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}