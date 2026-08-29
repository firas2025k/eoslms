import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { EosPillars } from "@/components/home/eos-pillars";
import { HeroBars } from "@/components/home/hero-bars";
import { WhoItsFor } from "@/components/home/who-its-for";
import { Header } from "@/components/nav/header";
import { CourseCard } from "@/components/ui/card";
import { SearchForm } from "@/components/search/search-form";
import { toCourseCardProps } from "@/lib/course-card";
import { sanityFetch } from "@/sanity/lib/fetch";
import { COURSES_LIST_QUERY } from "@/sanity/lib/queries";
import type { COURSES_LIST_QUERY_RESULT } from "@/sanity.types";

const HOME_COURSE_LIMIT = 3;

function pickHomeCourses(courses: COURSES_LIST_QUERY_RESULT) {
  return [...courses]
    .sort((a, b) => Number(Boolean(b.popular)) - Number(Boolean(a.popular)))
    .slice(0, HOME_COURSE_LIMIT);
}

export default async function Home() {
  const allCourses = await sanityFetch({
    query: COURSES_LIST_QUERY,
    tags: ["course"],
  });
  const courses = pickHomeCourses(allCourses ?? []);

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
            Education · Opportunity · Support
          </span>

          <h1 className="mt-6 font-display text-display-1 font-bold text-neutral-900">
            Begin again with purpose.
          </h1>

          <p className="mt-4 max-w-lg text-body-lg text-neutral-500">
            A guided course for mid-career women ready to launch a venture that
            actually matters — with clarity, not noise.
          </p>

          <Link
            href="/courses"
            className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary-500 px-4 text-body font-medium text-white transition-colors hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
          >
            Explore the course
            <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
          </Link>

          <div className="mt-8 w-full max-w-xl rounded-md shadow-lg">
            <SearchForm placeholder="Ask anything about your journey…" />
          </div>
        </section>

        <EosPillars className="mt-20 sm:mt-24" />

        <WhoItsFor className="mt-10 sm:mt-12" />

        <section className="mt-20 sm:mt-24" aria-labelledby="start-here-heading">
          <div className="flex items-end justify-between gap-4">
            <h2
              id="start-here-heading"
              className="font-display text-display-2 font-bold text-neutral-900"
            >
              Start here
            </h2>
            <Link
              href="/courses"
              className="inline-flex shrink-0 items-center gap-1 text-body font-medium text-primary-500 transition-colors hover:text-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xs"
            >
              View all courses
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>

          {courses.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course._id} {...toCourseCardProps(course)} />
              ))}
            </div>
          ) : (
            <p className="mt-8 text-body text-neutral-500">No courses yet.</p>
          )}
        </section>

        <div className="relative mt-16 flex items-center justify-center gap-3 sm:mt-20">
          <div className="h-px flex-1 bg-neutral-200" aria-hidden="true" />
          <p className="inline-flex items-center gap-2 text-small text-neutral-500">
            <Star
              className="size-4 text-primary-500"
              strokeWidth={2}
              aria-hidden="true"
            />
            Depth, not hype. Learn at your own pace.
          </p>
          <div className="h-px flex-1 bg-neutral-200" aria-hidden="true" />
        </div>
      </main>

      <HeroBars className="relative z-0 -mt-4" />
    </div>
  );
}
