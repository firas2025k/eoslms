import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const audience = [
  "Mid-career and open to reinvention",
  "Frustrated by surface-level advice or performance culture",
  "Seeking clarity on your next chapter",
  "Driven by integrity, autonomy, and purpose",
  "Ready to build something that aligns with who you are now",
] as const;

type WhoItsForProps = {
  className?: string;
};

export function WhoItsFor({ className }: WhoItsForProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-neutral-200 bg-white p-6 shadow-sm sm:p-8",
        className,
      )}
      aria-labelledby="who-its-for-heading"
    >
      <h2
        id="who-its-for-heading"
        className="font-display text-heading-1 font-bold text-neutral-900 sm:text-display-2"
      >
        Who it is for
      </h2>
      <p className="mt-3 max-w-2xl text-body text-neutral-500">
        Built for mid-career women in Europe who are ready to launch a
        purpose-driven venture — with depth, not hype.
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {audience.map((item) => (
          <li key={item} className="flex items-start gap-3 text-body text-neutral-900">
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-500">
              <Check className="size-3" strokeWidth={3} aria-hidden="true" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
