"use client";

import { useState } from "react";
import {
  Check,
  Code2,
  ExternalLink,
  FileText,
  FolderGit2,
  Lightbulb,
  Presentation,
} from "lucide-react";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { cn } from "@/lib/cn";
import type { LESSON_BY_SLUG_QUERY_RESULT } from "@/sanity.types";

type Lesson = NonNullable<LESSON_BY_SLUG_QUERY_RESULT>;
type Resource = NonNullable<Lesson["resources"]>[number];

type LessonTabsProps = {
  overview: string | null;
  keyPoints: string[] | null | undefined;
  proTip: string | null | undefined;
  resources: Resource[] | null | undefined;
  notes: Lesson["notes"];
  className?: string;
};

type TabId = "content" | "notes";

const notesComponents: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h3 className="mt-6 font-display text-heading-2 font-bold text-neutral-900 first:mt-0">
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="mt-4 text-heading-3 font-semibold text-neutral-900 first:mt-0">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="mt-3 text-body-lg leading-relaxed text-neutral-700 first:mt-0">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-4 border-l-2 border-primary-300 pl-4 text-body-lg text-neutral-600 italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-body-lg text-neutral-700">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-body-lg text-neutral-700">
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-neutral-900">{children}</strong>
    ),
    em: ({ children }) => <em>{children}</em>,
    code: ({ children }) => (
      <code className="rounded-xs bg-neutral-100 px-1 py-0.5 text-body font-medium text-neutral-800">
        {children}
      </code>
    ),
    link: ({ children, value }) => {
      const href = typeof value?.href === "string" ? value.href : undefined;
      if (!href) return <>{children}</>;
      const external = /^https?:\/\//i.test(href);
      return (
        <a
          href={href}
          className="font-medium text-primary-500 underline-offset-2 hover:underline"
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {children}
        </a>
      );
    },
  },
};

function resourceIcon(type: Resource["type"]) {
  switch (type) {
    case "repo":
      return FolderGit2;
    case "code":
      return Code2;
    case "slides":
      return Presentation;
    case "pdf":
    case "link":
    default:
      return FileText;
  }
}

export function LessonTabs({
  overview,
  keyPoints,
  proTip,
  resources,
  notes,
  className,
}: LessonTabsProps) {
  const [tab, setTab] = useState<TabId>("content");
  const points = (keyPoints ?? []).filter(Boolean);
  const resourceList = (resources ?? []).filter((r) => r.url && r.title);

  return (
    <div className={cn(className)}>
      <div
        role="tablist"
        aria-label="Lesson sections"
        className="flex gap-6 border-b border-neutral-200"
      >
        {(
          [
            { id: "content", label: "Lesson Content" },
            { id: "notes", label: "Notes" },
          ] as const
        ).map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`lesson-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`lesson-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(item.id)}
              className={cn(
                "relative -mb-px pb-3 text-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xs",
                selected
                  ? "text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-900",
              )}
            >
              {item.label}
              {selected ? (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary-500"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="lesson-panel-content"
        aria-labelledby="lesson-tab-content"
        hidden={tab !== "content"}
        className="pt-8"
      >
        <section aria-labelledby="lesson-overview-heading">
          <h2
            id="lesson-overview-heading"
            className="font-display text-heading-1 font-bold text-neutral-900"
          >
            Overview
          </h2>
          {overview ? (
            <p className="mt-3 max-w-3xl text-body-lg leading-relaxed text-neutral-700">
              {overview}
            </p>
          ) : (
            <p className="mt-3 text-body text-neutral-500">No overview yet.</p>
          )}
        </section>

        {points.length > 0 ? (
          <section aria-labelledby="lesson-keypoints-heading" className="mt-10">
            <h2
              id="lesson-keypoints-heading"
              className="font-display text-heading-1 font-bold text-neutral-900"
            >
              In this lesson you will
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span className="text-body-lg text-neutral-700">{point}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {proTip ? (
          <aside
            className="mt-10 flex gap-3 rounded-md border border-primary-200 bg-primary-100/70 p-4 sm:p-5"
            aria-labelledby="lesson-protip-heading"
          >
            <Lightbulb
              className="mt-0.5 size-5 shrink-0 text-primary-500"
              strokeWidth={2}
              aria-hidden="true"
            />
            <div>
              <h2
                id="lesson-protip-heading"
                className="text-heading-3 font-semibold text-neutral-900"
              >
                Pro Tip
              </h2>
              <p className="mt-1 text-body-lg leading-relaxed text-neutral-700">
                {proTip}
              </p>
            </div>
          </aside>
        ) : null}

        {resourceList.length > 0 ? (
          <section aria-labelledby="lesson-resources-heading" className="mt-10">
            <h2
              id="lesson-resources-heading"
              className="font-display text-heading-1 font-bold text-neutral-900"
            >
              Resources
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resourceList.map((resource) => {
                const Icon = resourceIcon(resource.type);
                return (
                  <li key={resource._key}>
                    <a
                      href={resource.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-full flex-col gap-3 rounded-md border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                    >
                      <div className="flex size-10 items-center justify-center rounded-sm bg-neutral-100 text-neutral-700">
                        <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-heading-3 font-medium text-neutral-900">
                          {resource.title}
                        </p>
                        {resource.description ? (
                          <p className="mt-1 text-body text-neutral-500">
                            {resource.description}
                          </p>
                        ) : null}
                      </div>
                      <ExternalLink
                        className="ml-auto size-4 text-neutral-400"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>

      <div
        role="tabpanel"
        id="lesson-panel-notes"
        aria-labelledby="lesson-tab-notes"
        hidden={tab !== "notes"}
        className="pt-8"
      >
        {notes && notes.length > 0 ? (
          <div className="max-w-3xl">
            <PortableText value={notes} components={notesComponents} />
          </div>
        ) : (
          <p className="text-body text-neutral-500">No notes for this lesson yet.</p>
        )}
      </div>
    </div>
  );
}
