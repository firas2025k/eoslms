"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {fieldClass} from "@/components/ui/input";
import {cn} from "@/lib/cn";
import {
  FEEDBACK_LIKERT,
  FEEDBACK_QUESTIONS,
  type FeedbackLikertField,
} from "@/lib/forms/questions";

type LikertAnswers = Record<FeedbackLikertField, number | "">;

const emptyLikert = Object.fromEntries(
  FEEDBACK_QUESTIONS.map((question) => [question.field, ""]),
) as LikertAnswers;

type FeedbackFormProps = {
  courseId: string;
  nextHref: string;
};

export function FeedbackForm({courseId, nextHref}: FeedbackFormProps) {
  const router = useRouter();
  const [ratings, setRatings] = useState<LikertAnswers>(emptyLikert);
  const [whatWouldChange, setWhatWouldChange] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          courseId,
          organised: ratings.organised,
          knowledgeSkills: ratings.knowledgeSkills,
          navigation: ratings.navigation,
          workload: ratings.workload,
          peerConnection: ratings.peerConnection,
          whatWouldChange,
        }),
      });

      if (!response.ok) {
        setError("Could not save your feedback. Please try again.");
        setPending(false);
        return;
      }

      router.push(nextHref);
      router.refresh();
    } catch {
      setError("Could not save your feedback. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      {FEEDBACK_QUESTIONS.map((question, index) => (
        <fieldset key={question.field} className="flex flex-col gap-3">
          <legend className="text-body font-medium text-neutral-900">
            {index + 1}. {question.label}{" "}
            <span className="text-primary-500">*</span>
          </legend>
          <div className="flex flex-wrap gap-3">
            {FEEDBACK_LIKERT.map((value) => (
              <label
                key={value}
                className="inline-flex min-w-11 cursor-pointer flex-col items-center gap-1 rounded-md border border-neutral-200 bg-white px-3 py-2 text-body text-neutral-900 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-100"
              >
                <input
                  type="radio"
                  name={question.field}
                  value={value}
                  required
                  checked={ratings[question.field] === value}
                  onChange={() =>
                    setRatings((current) => ({...current, [question.field]: value}))
                  }
                  className="size-4 accent-primary-500"
                />
                <span>{value}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <label className="flex flex-col gap-1.5">
        <span className="text-body font-medium text-neutral-900">
          6. What worked well, what didn&apos;t, and what would you change?{" "}
          <span className="text-primary-500">*</span>
        </span>
        <textarea
          name="whatWouldChange"
          required
          rows={6}
          value={whatWouldChange}
          onChange={(event) => setWhatWouldChange(event.target.value)}
          className={cn(fieldClass, "h-auto min-h-36 py-3")}
        />
      </label>

      {error ? (
        <p className="text-body text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Saving…" : "Submit feedback"}
      </Button>
    </form>
  );
}
