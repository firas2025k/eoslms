import { SanityImage } from "@/components/sanity-image";
import { urlFor } from "@/sanity/lib/image";

type CoverImage = {
  asset?: {
    _id: string;
    metadata?: { lqip?: string | null } | null;
  } | null;
  hotspot?: unknown;
  crop?: unknown;
  alt?: string | null;
} | null;

type CourseCoverProps = {
  coverImage: CoverImage;
  title: string | null;
  className?: string;
  size?: number;
};

export function CourseCoverThumb({
  coverImage,
  title,
  className = "relative size-12 shrink-0 overflow-hidden rounded-sm bg-neutral-900",
  size = 96,
}: CourseCoverProps) {
  const assetId = coverImage?.asset?._id;
  const coverUrl = assetId
    ? urlFor({
        _type: "image",
        asset: { _ref: assetId },
        hotspot: (coverImage?.hotspot as never) ?? undefined,
        crop: (coverImage?.crop as never) ?? undefined,
      })
        .width(size)
        .height(size)
        .fit("crop")
        .url()
    : null;
  const alt = coverImage?.alt ?? title ?? "Course cover";
  const lqip = coverImage?.asset?.metadata?.lqip ?? undefined;
  const initial = (title ?? "C").trim().charAt(0).toUpperCase() || "C";

  return (
    <div className={className}>
      {coverUrl ? (
        <SanityImage
          src={coverUrl}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-cover"
          placeholder={lqip ? "blur" : "empty"}
          blurDataURL={lqip}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-heading-3 font-semibold text-white">
          {initial}
        </div>
      )}
    </div>
  );
}
