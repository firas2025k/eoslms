import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonHeader } from "@/components/lesson/lesson-header";
import { LessonNav, type LessonNavItem } from "@/components/lesson/lesson-nav";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { LessonSidebar } from "@/components/lesson/lesson-sidebar";
import { LessonTabs } from "@/components/lesson/lesson-tabs";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { Header } from "@/components/nav/header";
import { firstNotesParagraph } from "@/lib/format";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  LESSON_BY_SLUG_QUERY,
  LESSON_STATIC_PARAMS_QUERY,
} from "@/sanity/lib/queries";
import type { LESSON_BY_SLUG_QUERY_RESULT } from "@/sanity.types";

type PageProps = {
  params: Promise<{ slug: string; lessonSlug: string }>;
  searchParams: Promise<{ t?: string | string[] }>;
};

type Course = NonNullable<NonNullable<LESSON_BY_SLUG_QUERY_RESULT>["course"]>;

type FlatLesson = {
  slug: string;
  title: string;
  duration: number | null;
  moduleKey: string;
  moduleTitle: string;
  moduleIndex: number;
  lessonIndex: number;
};

function flattenLessons(course: Course): FlatLesson[] {
  const out: FlatLesson[] = [];
  (course.modules ?? []).forEach((mod, moduleIndex) => {
    (mod.lessons ?? []).forEach((lesson, lessonIndex) => {
      if (!lesson.slug) return;
      out.push({
        slug: lesson.slug,
        title: lesson.title ?? "Lesson",
        duration: lesson.duration,
        moduleKey: mod._key,
        moduleTitle: mod.title ?? `Module ${moduleIndex + 1}`,
        moduleIndex: moduleIndex + 1,
        lessonIndex: lessonIndex + 1,
      });
    });
  });
  return out;
}

function toNavItem(
  lesson: FlatLesson | undefined,
  courseSlug: string,
): LessonNavItem | null {
  if (!lesson) return null;
  return {
    slug: lesson.slug,
    title: lesson.title,
    duration: lesson.duration,
    href: `/courses/${courseSlug}/lessons/${lesson.slug}`,
  };
}

function parseStartSeconds(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

export async function generateStaticParams() {
  const courses = await sanityFetch({
    query: LESSON_STATIC_PARAMS_QUERY,
    tags: ["course", "lesson"],
  });

  const params: Array<{ slug: string; lessonSlug: string }> = [];
  for (const course of courses ?? []) {
    if (!course.slug) continue;
    for (const lessonSlug of course.lessonSlugs ?? []) {
      if (lessonSlug) {
        params.push({ slug: course.slug, lessonSlug });
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lessonSlug } = await params;
  const lesson = await sanityFetch({
    query: LESSON_BY_SLUG_QUERY,
    params: { slug: lessonSlug },
    tags: ["lesson", `lesson:${lessonSlug}`],
  });

  if (!lesson) {
    return { title: "Lesson not found" };
  }

  const overview = firstNotesParagraph(lesson.notes);
  return {
    title: lesson.title
      ? `${lesson.title} · ${lesson.course?.title ?? "Eos Academy"}`
      : "Lesson · Eos Academy",
    description: overview ?? undefined,
  };
}

export default async function LessonPage({ params, searchParams }: PageProps) {
  const { slug: courseSlug, lessonSlug } = await params;
  const { t } = await searchParams;
  const startSeconds = parseStartSeconds(t);

  const lesson = await sanityFetch({
    query: LESSON_BY_SLUG_QUERY,
    params: { slug: lessonSlug },
    tags: ["lesson", `lesson:${lessonSlug}`, "course", `course:${courseSlug}`],
  });

  if (!lesson?.slug || !lesson.course?.slug || lesson.course.slug !== courseSlug) {
    notFound();
  }

  const course = lesson.course;
  const flat = flattenLessons(course);
  const currentIndex = flat.findIndex((item) => item.slug === lesson.slug);
  if (currentIndex < 0) {
    notFound();
  }

  const current = flat[currentIndex]!;
  const previous = toNavItem(flat[currentIndex - 1], courseSlug);
  const next = toNavItem(flat[currentIndex + 1], courseSlug);
  const overview = firstNotesParagraph(lesson.notes);
  const title = lesson.title ?? "Lesson";

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

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 gap-8 px-6 pb-32 pt-6 lg:gap-10 lg:pt-8">
        <div className="hidden w-72 shrink-0 lg:block xl:w-80">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-1">
            <LessonSidebar
              course={course}
              courseSlug={courseSlug}
              currentLessonSlug={lesson.slug}
              currentModuleKey={current.moduleKey}
            />
          </div>
        </div>

        <main className="min-w-0 flex-1">
          <details className="mb-6 rounded-md border border-neutral-200 bg-white shadow-sm lg:hidden">
            <summary className="cursor-pointer list-none px-4 py-3 text-body font-medium text-neutral-900 marker:content-none [&::-webkit-details-marker]:hidden">
              Course content
            </summary>
            <div className="border-t border-neutral-100 px-4 py-4">
              <LessonSidebar
                course={course}
                courseSlug={courseSlug}
                currentLessonSlug={lesson.slug}
                currentModuleKey={current.moduleKey}
              />
            </div>
          </details>

          <Breadcrumbs
            className="mb-6"
            items={[
              { label: "All Courses", href: "/courses" },
              { label: course.title ?? "Course", href: `/courses/${courseSlug}` },
              { label: current.moduleTitle },
              { label: title },
            ]}
          />

          <LessonHeader
            title={title}
            overview={overview}
            moduleIndex={current.moduleIndex}
            lessonIndex={current.lessonIndex}
            duration={lesson.duration}
            level={course.level}
            studentCount={lesson.studentCount}
          />

          <LessonPlayer
            className="mt-8"
            videoUrl={lesson.videoUrl}
            title={title}
            startSeconds={startSeconds}
            thumbnail={lesson.thumbnail}
          />

          <LessonTabs
            className="mt-10"
            overview={overview}
            keyPoints={lesson.keyPoints}
            proTip={lesson.proTip}
            resources={lesson.resources}
            notes={lesson.notes}
          />
        </main>
      </div>

      <LessonNav previous={previous} next={next} />
    </div>
  );
}
