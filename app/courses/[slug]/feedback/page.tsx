import {auth} from "@clerk/nextjs/server";
import {notFound, redirect} from "next/navigation";
import {Header} from "@/components/nav/header";
import {FeedbackForm} from "@/components/feedback/feedback-form";
import {
  hasCourseFeedback,
  isCourseComplete,
  redirectIfOnboardingIncomplete,
} from "@/lib/onboarding-server";
import {flattenCourseLessons} from "@/lib/progress";
import {getCurrentUserProgress} from "@/lib/progress-server";
import {sanityFetch} from "@/sanity/lib/fetch";
import {COURSE_BY_SLUG_QUERY} from "@/sanity/lib/queries";

type PageProps = {
  params: Promise<{slug: string}>;
};

export default async function CourseFeedbackPage({params}: PageProps) {
  const {slug} = await params;
  const [{isAuthenticated, userId}, course, progress] = await Promise.all([
    auth(),
    sanityFetch({
      query: COURSE_BY_SLUG_QUERY,
      params: {slug},
      tags: ["course", `course:${slug}`],
    }),
    getCurrentUserProgress(),
  ]);

  if (!course?.slug || !course._id) {
    notFound();
  }

  const courseHref = `/courses/${course.slug}`;

  if (!isAuthenticated || !userId) {
    redirect(courseHref);
  }

  await redirectIfOnboardingIncomplete(`/courses/${course.slug}/feedback`);

  if (course.feedbackEnabled !== true) {
    redirect(courseHref);
  }

  const lessonIds = flattenCourseLessons(course.modules).map((lesson) => lesson.id);
  if (!isCourseComplete(progress.completedLessonIds, lessonIds)) {
    redirect(courseHref);
  }

  if (await hasCourseFeedback(userId, course._id)) {
    redirect(courseHref);
  }

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

      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-6 pb-16 pt-10 sm:pt-12">
        <h1 className="font-display text-display-2 font-bold text-neutral-900 sm:text-display-1">
          How did we do
        </h1>
        <p className="mt-2 text-body-lg font-medium uppercase tracking-wide text-neutral-500">
          Rate the course
        </p>
        {course.title ? (
          <p className="mt-2 text-body text-neutral-500">{course.title}</p>
        ) : null}
        <p className="mt-4 text-body text-neutral-500">
          1 = Strongly Disagree&nbsp;&nbsp;5 = Strongly Agree
        </p>
        <div className="mt-10">
          <FeedbackForm courseId={course._id} courseHref={courseHref} />
        </div>
      </main>
    </div>
  );
}
