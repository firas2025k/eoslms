import { BookOpen, Handshake, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/cn";

const pillars = [
  {
    title: "Education",
    description:
      "Practical learning for women with experience — what actually matters to launch a mission-led venture.",
    icon: BookOpen,
  },
  {
    title: "Opportunity",
    description:
      "Connect with women and organisations who open doors, share wisdom, and walk the path with you.",
    icon: Handshake,
  },
  {
    title: "Support",
    description:
      "Mentorship, feedback, and steady encouragement so you do not have to figure out the next chapter alone.",
    icon: HeartHandshake,
  },
] as const;

type EosPillarsProps = {
  className?: string;
};

export function EosPillars({ className }: EosPillarsProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-neutral-200 bg-white p-6 shadow-sm sm:p-8",
        className,
      )}
      aria-labelledby="why-eos-heading"
    >
      <p className="text-small font-semibold tracking-wide text-primary-500 uppercase">
        Why EOS
      </p>
      <h2
        id="why-eos-heading"
        className="mt-2 font-display text-heading-1 font-bold text-neutral-900 sm:text-display-2"
      >
        Education, Opportunity, and Support
      </h2>
      <p className="mt-3 max-w-2xl text-body text-neutral-500">
        EOS Academy is not just a learning programme. It is a space to grow into
        what is next.
      </p>
      <ul className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        {pillars.map((pillar) => (
          <li key={pillar.title} className="flex flex-col gap-2">
            <pillar.icon
              className="size-6 text-primary-500"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <h3 className="font-display text-heading-3 font-bold text-neutral-900">
              {pillar.title}
            </h3>
            <p className="text-body text-neutral-500">{pillar.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
