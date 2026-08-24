import {
  Code,
  Gauge,
  Layers,
  Puzzle,
  Rocket,
  Shield,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { COURSE_BY_SLUG_QUERY_RESULT } from "@/sanity.types";

type Outcome = NonNullable<
  NonNullable<COURSE_BY_SLUG_QUERY_RESULT>["learningOutcomes"]
>[number];

const outcomeIcons: Record<string, LucideIcon> = {
  layers: Layers,
  gauge: Gauge,
  rocket: Rocket,
  workflow: Workflow,
  sparkles: Sparkles,
  shield: Shield,
  code: Code,
  puzzle: Puzzle,
};

type LearningOutcomesProps = {
  outcomes: Outcome[] | null | undefined;
  className?: string;
};

export function LearningOutcomes({ outcomes, className }: LearningOutcomesProps) {
  if (!outcomes?.length) return null;

  return (
    <section
      className={cn(
        "rounded-lg border border-neutral-200 bg-white p-6 shadow-sm sm:p-8",
        className,
      )}
      aria-labelledby="what-youll-learn-heading"
    >
      <h2
        id="what-youll-learn-heading"
        className="font-display text-heading-1 font-bold text-neutral-900 sm:text-display-2"
      >
        What you&apos;ll learn
      </h2>

      <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
        {outcomes.map((outcome) => {
          const Icon = (outcome.icon && outcomeIcons[outcome.icon]) || Sparkles;
          return (
            <li key={outcome._key} className="flex flex-col gap-2">
              <Icon
                className="size-6 text-primary-500"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <h3 className="font-display text-heading-3 font-bold text-neutral-900">
                {outcome.title}
              </h3>
              {outcome.description ? (
                <p className="text-body text-neutral-500">{outcome.description}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
