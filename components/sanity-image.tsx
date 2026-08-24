import Image, { type ImageProps } from "next/image";

type SanityImageProps = Omit<ImageProps, "loader" | "unoptimized">;

/**
 * Renders a Sanity CDN image without Next's optimizer.
 *
 * Next's optimizer fetches the upstream URL server-side and rejects hosts that
 * resolve to "private" IPs. On some local networks (DNS64/NAT64), cdn.sanity.io
 * resolves to 64:ff9b::/96 and gets blocked. The browser can still load the CDN
 * URL directly, and Sanity already handles sizing via urlFor().
 */
export function SanityImage(props: SanityImageProps) {
  return <Image {...props} unoptimized />;
}
