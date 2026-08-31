import type { NextConfig } from "next";

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
const POSTHOG_ASSETS_HOST = POSTHOG_HOST.replace("eu.i.posthog.com", "eu-assets.i.posthog.com");

// Tag every build with the deployment it came from. Next.js adds this id to the
// `x-deployment-id` header on Server Action requests and to `?dpl=` on assets, so
// Vercel Skew Protection can route a tab that loaded an older build back to that
// build instead of failing the action against a newer one. Vercel injects both
// values; the config is inert (undefined) during local development.
const deploymentId =
  process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA;

const nextConfig: NextConfig = {
  deploymentId,
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSETS_HOST}/static/:path*`,
      },
      {
        source: "/ingest/array/:path*",
        destination: `${POSTHOG_ASSETS_HOST}/array/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${POSTHOG_HOST}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
