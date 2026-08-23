import type { Metadata } from "next";
import { Header } from "@/components/nav/header";
import { CourseCard } from "@/components/ui/card";
import { toCourseCardProps } from "@/lib/course-card";
import { sanityFetch } from "@/sanity/lib/fetch";
import { COURSES_LIST_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "All Courses · Vertex",
  description: "Browse every course on Vertex.",
};

export default async function CoursesPage() {
  const courses = await sanityFetch({
    query: COURSES_LIST_QUERY,
    tags: ["course"],
  });

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
        activeHref="/courses"
        showSearch={false}
        className="relative z-10 bg-white/90 backdrop-blur-sm"
      />

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 pb-16 pt-10 sm:pt-12">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-display-2 font-bold text-neutral-900 sm:text-display-1">
            All Courses
          </h1>
          <p className="text-body-lg text-neutral-500">
            {courses.length > 0
              ? `${courses.length} course${courses.length === 1 ? "" : "s"} available`
              : "Browse the catalog."}
          </p>
        </header>

        {courses.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course._id} {...toCourseCardProps(course)} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-body text-neutral-500">No courses yet.</p>
        )}
      </main>
    </div>
  );
}
