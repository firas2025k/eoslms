import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseHero } from "@/components/course/course-hero";
import { CourseProgressBar } from "@/components/course/course-progress-bar";
import { LearningOutcomes } from "@/components/course/learning-outcomes";
import { ModuleList } from "@/components/course/module-list";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { Header } from "@/components/nav/header";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  COURSE_BY_SLUG_QUERY,
  COURSE_SLUGS_QUERY,
} from "@/sanity/lib/queries";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function firstLessonHref(
  courseSlug: string,
  modules: {
    lessons: Array<{ slug: string | null }> | null;
  }[] | null,
): string | null {
  for (const mod of modules ?? []) {
    for (const lesson of mod.lessons ?? []) {
      if (lesson.slug) {
        return `/courses/${courseSlug}/lessons/${lesson.slug}`;
      }
    }
  }
  return null;
}

export async function generateStaticParams() {
  const courses = await sanityFetch({
    query: COURSE_SLUGS_QUERY,
    tags: ["course"],
  });

  return (courses ?? [])
    .filter((course): course is { slug: string } => Boolean(course.slug))
    .map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await sanityFetch({
    query: COURSE_BY_SLUG_QUERY,
    params: { slug },
    tags: ["course", `course:${slug}`],
  });

  if (!course) {
    return { title: "Course not found" };
  }

  return {
    title: course.title ? `${course.title} · Vertex` : "Course · Vertex",
    description: course.summary ?? undefined,
  };
}

export default async function CoursePage({ params }: PageProps) {
  const { slug } = await params;
  const course = await sanityFetch({
    query: COURSE_BY_SLUG_QUERY,
    params: { slug },
    tags: ["course", `course:${slug}`],
  });

  if (!course?.slug) {
    notFound();
  }

  const continueHref = firstLessonHref(course.slug, course.modules);

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

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 pb-36 pt-6 sm:pt-8">
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: "All Courses", href: "/courses" },
            { label: course.title ?? "Course" },
          ]}
        />

        <CourseHero course={course} continueHref={continueHref} />

        <LearningOutcomes
          outcomes={course.learningOutcomes}
          className="mt-12 sm:mt-14"
        />

        <ModuleList
          courseSlug={course.slug}
          modules={course.modules}
          moduleCount={course.moduleCount}
          totalDuration={course.duration}
          className="mt-12 sm:mt-14"
        />
      </main>

      <CourseProgressBar continueHref={continueHref} />
    </div>
  );
}
