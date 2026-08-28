"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input, fieldClass} from "@/components/ui/input";
import {cn} from "@/lib/cn";
import {
  ONBOARDING_STAGES,
  type OnboardingStage,
} from "@/lib/forms/questions";

type OnboardingFormProps = {
  nextPath: string;
  defaultFullName: string;
  defaultEmail: string;
};

export function OnboardingForm({
  nextPath,
  defaultFullName,
  defaultEmail,
}: OnboardingFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultFullName);
  const [email, setEmail] = useState(defaultEmail);
  const [location, setLocation] = useState("");
  const [stage, setStage] = useState<OnboardingStage | "">("");
  const [motivation, setMotivation] = useState("");
  const [twelveMonthGoal, setTwelveMonthGoal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          fullName,
          email,
          location,
          stage,
          motivation,
          twelveMonthGoal,
        }),
      });

      if (!response.ok) {
        setError("Could not save your answers. Please try again.");
        setPending(false);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Could not save your answers. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <section className="flex flex-col gap-4" aria-labelledby="about-you-heading">
        <h2
          id="about-you-heading"
          className="font-display text-heading-2 font-bold text-neutral-900"
        >
          About You
        </h2>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-small font-medium text-neutral-900">
              Full name <span className="text-primary-500">*</span>
            </span>
            <Input
              name="fullName"
              autoComplete="name"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-small font-medium text-neutral-900">
              Email address <span className="text-primary-500">*</span>
            </span>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-small font-medium text-neutral-900">
              Where do you live? (City/Country){" "}
              <span className="text-primary-500">*</span>
            </span>
            <Input
              name="location"
              autoComplete="address-level2"
              required
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </label>
        </div>
      </section>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-display text-heading-2 font-bold text-neutral-900">
          Your Stage
        </legend>
        <p className="text-body text-neutral-900">
          Which best describes your current situation?{" "}
          <span className="text-primary-500">*</span>
        </p>
        <div className="flex flex-col gap-3">
          {ONBOARDING_STAGES.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-neutral-200 bg-white px-4 py-3 text-body text-neutral-900 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-100"
            >
              <input
                type="radio"
                name="stage"
                value={option.value}
                required
                checked={stage === option.value}
                onChange={() => setStage(option.value)}
                className="mt-1 size-4 accent-primary-500"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <section
        className="flex flex-col gap-4"
        aria-labelledby="motivation-heading"
      >
        <h2
          id="motivation-heading"
          className="font-display text-heading-2 font-bold text-neutral-900"
        >
          Your Motivation
        </h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-small font-medium text-neutral-900">
            What draws you to social entrepreneurship?{" "}
            <span className="text-primary-500">*</span>
          </span>
          <textarea
            name="motivation"
            required
            rows={4}
            value={motivation}
            onChange={(event) => setMotivation(event.target.value)}
            className={cn(fieldClass, "h-auto min-h-28 py-3")}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-small font-medium text-neutral-900">
            What is your main goal for the next 12 months?{" "}
            <span className="text-primary-500">*</span>
          </span>
          <textarea
            name="twelveMonthGoal"
            required
            rows={4}
            value={twelveMonthGoal}
            onChange={(event) => setTwelveMonthGoal(event.target.value)}
            className={cn(fieldClass, "h-auto min-h-28 py-3")}
          />
        </label>
      </section>

      {error ? (
        <p className="text-body text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
