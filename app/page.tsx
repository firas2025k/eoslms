import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import {
  DockerMark,
  NextjsMark,
  TypescriptMark,
} from "@/components/home/course-marks";
import { HeroBars } from "@/components/home/hero-bars";
import { Header } from "@/components/nav/header";
import { CourseCard } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/input";

const courses = [
  {
    title: "Next.js for Production",
    description:
      "Build and ship production-ready Next.js apps with App Router, caching, and deployment patterns.",
    level: "Intermediate",
    duration: "18h 24m",
    moduleCount: "12 modules",
    thumbnail: <NextjsMark />,
  },
  {
    title: "Docker & Containers",
    description:
      "Containerize services, manage images, and ship reliable environments with Docker.",
    level: "Intermediate",
    duration: "12h 10m",
    moduleCount: "8 modules",
    thumbnail: <DockerMark />,
  },
  {
    title: "TypeScript Fundamentals",
    description:
      "Add types to JavaScript for safer APIs, clearer refactors, and confident tooling.",
    level: "Beginner",
    duration: "9h 45m",
    moduleCount: "10 modules",
    thumbnail: <TypescriptMark />,
  },
];

export default function Home() {
  return (
    <div
      className="relative flex min-h-full flex-1 flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--color-neutral-50)",
        backgroundImage:
          "linear-gradient(to right, rgba(226,232,240,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(226,232,240,0.45) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <Header showSearch={false} className="relative z-10 bg-white/90 backdrop-blur-sm" />

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-8 pt-16 sm:pt-20">
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
          <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-100 px-3 py-1 text-small font-semibold tracking-wide text-primary-500 uppercase">
            Intelligent Learning
          </span>

          <h1 className="mt-6 font-display text-display-1 font-bold text-neutral-900">
            Search your learning in plain English.
          </h1>

          <p className="mt-4 max-w-lg text-body-lg text-neutral-500">
            Vertex understands what you want to learn and finds the exact
            lessons across all your courses.
          </p>

          <Link
            href="/courses"
            className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary-500 px-4 text-body font-medium text-white transition-colors hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
          >
            Explore Courses
            <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
          </Link>

          <div className="mt-8 w-full max-w-xl rounded-md shadow-lg">
            <SearchInput placeholder="Ask anything about your learning..." />
          </div>
        </section>

        <section className="mt-20 sm:mt-24" aria-labelledby="all-courses-heading">
          <div className="flex items-end justify-between gap-4">
            <h2
              id="all-courses-heading"
              className="font-display text-display-2 font-bold text-neutral-900"
            >
              All Courses
            </h2>
            <Link
              href="/courses"
              className="inline-flex shrink-0 items-center gap-1 text-body font-medium text-primary-500 transition-colors hover:text-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xs"
            >
              View all courses
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.title} {...course} />
            ))}
          </div>
        </section>

        <div className="relative mt-16 flex items-center justify-center gap-3 sm:mt-20">
          <div className="h-px flex-1 bg-neutral-200" aria-hidden="true" />
          <p className="inline-flex items-center gap-2 text-small text-neutral-500">
            <Star
              className="size-4 text-primary-500"
              strokeWidth={2}
              aria-hidden="true"
            />
            New courses and lessons added every week.
          </p>
          <div className="h-px flex-1 bg-neutral-200" aria-hidden="true" />
        </div>
      </main>

      <HeroBars className="relative z-0 -mt-4" />
    </div>
  );
}
