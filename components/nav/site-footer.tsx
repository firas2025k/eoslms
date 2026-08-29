import Link from "next/link";
import { Logo } from "@/components/logo";

const learnLinks = [
  { href: "/courses", label: "Courses" },
  { href: "/search", label: "Search" },
  { href: "/my-learning", label: "My Learning" },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-auto border-t border-neutral-200 bg-white">
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-body text-neutral-500">
            Education, Opportunity, and Support for mid-career women building
            purpose-driven ventures.
          </p>
        </div>

        <div>
          <h2 className="text-small font-semibold tracking-wide text-neutral-900 uppercase">
            Learn
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {learnLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-body text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xs"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-small font-semibold tracking-wide text-neutral-900 uppercase">
            EOS
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <a
                href="https://eosacademy.global/"
                target="_blank"
                rel="noreferrer"
                className="text-body text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xs"
              >
                Our story
              </a>
            </li>
            <li>
              <a
                href="mailto:info@eosacademy.global"
                className="text-body text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xs"
              >
                info@eosacademy.global
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-small font-semibold tracking-wide text-neutral-900 uppercase">
            Contact
          </h2>
          <p className="mt-3 text-body text-neutral-500">
            Ahtri 12
            <br />
            10151 Tallinn, Estonia
          </p>
        </div>
      </div>

      <div className="border-t border-neutral-200">
        <p className="mx-auto max-w-5xl px-6 py-4 text-small text-neutral-500">
          © {new Date().getFullYear()} EOS Academy OÜ. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
