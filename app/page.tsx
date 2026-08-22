import Link from "next/link";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-24">
      <Logo href={undefined} />
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-display-1 font-bold text-neutral-900">
          Vertex
        </h1>
        <p className="max-w-xl text-body-lg text-neutral-500">
          Learning platform UI foundation. Open the design system gallery to
          review tokens and components against the reference sheet.
        </p>
      </div>
      <div>
        <Link
          href="/design-system"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary-500 px-4 text-body font-medium text-white transition-colors hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
        >
          View design system
        </Link>
      </div>
    </main>
  );
}
