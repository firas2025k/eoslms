import type { ComponentProps } from "react";
import { ClerkProvider } from "@clerk/nextjs";

type ClerkAppearance = NonNullable<
  ComponentProps<typeof ClerkProvider>["appearance"]
>;

/** Shared Clerk look: EOS orange + site logo. Applied on ClerkProvider so modals and hosted pages match. */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#f97316",
    colorPrimaryForeground: "#ffffff",
    colorForeground: "#0f172a",
    colorMutedForeground: "#64748b",
    colorBackground: "#ffffff",
    colorBorder: "#e2e8f0",
    colorInput: "#ffffff",
    colorInputForeground: "#0f172a",
    colorRing: "#fb923c",
    borderRadius: "0.375rem",
    fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
  },
  options: {
    logoImageUrl: "/logo.webp",
    logoLinkUrl: "/",
    socialButtonsVariant: "blockButton",
  },
} satisfies ClerkAppearance;
