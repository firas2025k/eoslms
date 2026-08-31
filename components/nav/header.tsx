import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { AuthControls } from "@/components/nav/auth-controls";
import { cn } from "@/lib/cn";

type HeaderProps = {
  activeHref?: "/courses" | "/my-learning";
  showSearch?: boolean;
  className?: string;
};

const links = [
  { href: "/courses" as const, label: "Courses" },
  { href: "/my-learning" as const, label: "My Learning" },
];

function NavLinks({
  activeHref,
  className,
}: {
  activeHref?: HeaderProps["activeHref"];
  className?: string;
}) {
  return (
    <nav aria-label="Main" className={className}>
      {links.map((link) => {
        const active = activeHref !== undefined && link.href === activeHref;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-xs text-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
              active
                ? "text-primary-500"
                : "text-neutral-500 hover:text-neutral-900",
            )}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Header({
  activeHref,
  showSearch = true,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "border-b border-neutral-200 bg-white",
        className,
      )}
    >
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:gap-6 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Logo priority />
          <NavLinks
            activeHref={activeHref}
            className="hidden items-center gap-6 md:flex"
          />
        </div>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          {showSearch ? (
            <Link
              href="/search"
              aria-label="Search"
              className="inline-flex size-9 items-center justify-center rounded-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              <Search className="size-5" strokeWidth={2} aria-hidden="true" />
            </Link>
          ) : null}
          <button
            type="button"
            aria-label="Notifications"
            className="hidden size-9 items-center justify-center rounded-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 sm:inline-flex"
          >
            <Bell className="size-5" strokeWidth={2} aria-hidden="true" />
          </button>
          <AuthControls />
        </div>
      </div>
      <NavLinks
        activeHref={activeHref}
        className="flex items-center gap-5 border-t border-neutral-100 px-4 py-2.5 md:hidden"
      />
    </header>
  );
}
