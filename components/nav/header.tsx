import Link from "next/link";
import { Bell, Search, User } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";

type HeaderProps = {
  activeHref?: "/courses" | "/my-learning";
  className?: string;
};

const links = [
  { href: "/courses" as const, label: "Courses" },
  { href: "/my-learning" as const, label: "My Learning" },
];

export function Header({ activeHref = "/courses", className }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between gap-6 border-b border-neutral-200 bg-white px-6",
        className,
      )}
    >
      <div className="flex items-center gap-8">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-6 sm:flex">
          {links.map((link) => {
            const active = link.href === activeHref;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xs",
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
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Search"
          className="inline-flex size-9 items-center justify-center rounded-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
        >
          <Search className="size-5" strokeWidth={2} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="inline-flex size-9 items-center justify-center rounded-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
        >
          <Bell className="size-5" strokeWidth={2} aria-hidden="true" />
        </button>
        <span
          aria-hidden="true"
          className="inline-flex size-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700"
        >
          <User className="size-4" strokeWidth={2} />
        </span>
      </div>
    </header>
  );
}
