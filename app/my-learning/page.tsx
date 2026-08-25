import type { Metadata } from "next";
import { Header } from "@/components/nav/header";
import { CourseCard } from "@/components/ui/card";
import { toCourseCardProps } from "@/lib/course-card";
import { courseHasStarted, coursePercent } from "@/lib/progress";
import { getCurrentUserProgress } from "@/lib/progress-server";
import { sanityFetch } from "@/sanity/lib/fetch";
import { COURSES_LIST_QUERY } from "@/sanity/lib/queries";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "My Learning · Eos Academy",
  description: "Courses you have started on Eos Academy.",
};

export default async function MyLearningPage() {
  const [courses, progress] = await Promise.all([
    sanityFetch({
      query: COURSES_LIST_QUERY,
      tags: ["course"],
    }),
    getCurrentUserProgress(),
  ]);

  const started = courses.filter((course) =>
    courseHasStarted(course.lessonIds ?? [], progress),
  );

  return (
    <div
      className="relative flex min-h-full flex-1 flex-col"
      style={{
        backgroundColor: "var(--color-neutral-50)",
        backgroundImage:
          "linear-gradient(to right, rgba(226,232,240,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(226,232,240,0.45) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <Header
        activeHref="/my-learning"
        showSearch={false}
        className="relative z-10 bg-white/90 backdrop-blur-sm"
      />

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 pb-16 pt-10 sm:pt-12">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-display-2 font-bold text-neutral-900 sm:text-display-1">
            My Learning
          </h1>
          <p className="text-body-lg text-neutral-500">
            {started.length > 0
              ? `${started.length} course${started.length === 1 ? "" : "s"} in progress`
              : "Pick up where you left off."}
          </p>
        </header>

        {started.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {started.map((course) => (
              <CourseCard
                key={course._id}
                {...toCourseCardProps(course, {
                  progress: coursePercent(
                    progress.completedLessonIds,
                    course.lessonIds ?? [],
                  ),
                })}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-display-2 font-display font-bold text-neutral-900">
              No courses yet
            </p>
            <p className="max-w-sm text-body text-neutral-500">
              Browse the catalog and start a lesson. Your progress will show up
              here.
            </p>
            <Link
              href="/courses"
              className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2.5 text-body font-medium text-white transition-colors hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              Browse all courses
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
