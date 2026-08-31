import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";

type LogoProps = {
  className?: string;
  href?: string;
  /** Load eagerly in the site header. */
  priority?: boolean;
};

export function Logo({ className, href = "/", priority = false }: LogoProps) {
  const mark = (
    <Image
      src="/logo.webp"
      alt="EOS Academy"
      width={300}
      height={89}
      priority={priority}
      className={cn(
        "h-8 w-auto max-w-[8.5rem] object-contain object-left sm:h-9 sm:max-w-[11rem]",
        className,
      )}
    />
  );

  if (!href) {
    return mark;
  }

  return (
    <Link
      href={href}
      className="inline-flex min-w-0 shrink rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
    >
      {mark}
    </Link>
  );
}
