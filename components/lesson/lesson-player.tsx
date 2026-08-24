import { SanityImage } from "@/components/sanity-image";
import { getVideoEmbed } from "@/lib/video-embed";
import { cn } from "@/lib/cn";
import { urlFor } from "@/sanity/lib/image";

type Thumbnail = {
  asset?: {
    _id: string;
    metadata?: { lqip?: string | null } | null;
  } | null;
  hotspot?: unknown;
  crop?: unknown;
  alt?: string | null;
} | null;

type LessonPlayerProps = {
  videoUrl: string | null | undefined;
  title: string;
  startSeconds?: number | null;
  thumbnail?: Thumbnail;
  className?: string;
};

export function LessonPlayer({
  videoUrl,
  title,
  startSeconds,
  thumbnail,
  className,
}: LessonPlayerProps) {
  const embed = getVideoEmbed(videoUrl, startSeconds);

  if (embed) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg bg-neutral-900 shadow-md",
          className,
        )}
      >
        <div className="relative aspect-video w-full">
          <iframe
            src={embed.embedUrl}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    );
  }

  const assetId = thumbnail?.asset?._id;
  const thumbUrl = assetId
    ? urlFor({
        _type: "image",
        asset: { _ref: assetId },
        hotspot: (thumbnail?.hotspot as never) ?? undefined,
        crop: (thumbnail?.crop as never) ?? undefined,
      })
        .width(1280)
        .height(720)
        .fit("crop")
        .url()
    : null;
  const alt = thumbnail?.alt ?? title;
  const lqip = thumbnail?.asset?.metadata?.lqip ?? undefined;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg bg-neutral-900 shadow-md",
        className,
      )}
    >
      <div className="relative flex aspect-video w-full items-center justify-center">
        {thumbUrl ? (
          <SanityImage
            src={thumbUrl}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 720px"
            className="object-cover opacity-60"
            placeholder={lqip ? "blur" : "empty"}
            blurDataURL={lqip}
          />
        ) : null}
        <p className="relative z-10 px-4 text-center text-body text-white/90">
          Video unavailable
        </p>
      </div>
    </div>
  );
}
