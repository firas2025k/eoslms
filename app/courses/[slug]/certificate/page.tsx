import type {Metadata} from "next";
import {auth} from "@clerk/nextjs/server";
import Link from "next/link";
import {notFound, redirect} from "next/navigation";
import {DownloadCertificateButton} from "@/components/certificate/download-certificate-button";
import {Header} from "@/components/nav/header";
import {
  certificatePagePath,
  isCertificateUnlocked,
} from "@/lib/certificate";
import {getLearnerDisplayName} from "@/lib/certificate-server";
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

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {slug} = await params;
  const course = await sanityFetch({
    query: COURSE_BY_SLUG_QUERY,
    params: {slug},
    tags: ["course", `course:${slug}`],
  });

  return {
    title: course?.title
      ? `Certificate · ${course.title} · Eos Academy`
      : "Certificate · Eos Academy",
  };
}

export default async function CourseCertificatePage({params}: PageProps) {
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
  const feedbackHref = `/courses/${course.slug}/feedback`;

  if (!isAuthenticated || !userId) {
    redirect(courseHref);
  }

  await redirectIfOnboardingIncomplete(certificatePagePath(course.slug));

  const lessonIds = flattenCourseLessons(course.modules).map((lesson) => lesson.id);
  const courseComplete = isCourseComplete(progress.completedLessonIds, lessonIds);
  const hasFeedback =
    course.feedbackEnabled === true ? await hasCourseFeedback(userId, course._id) : false;
  const unlocked = isCertificateUnlocked({
    courseComplete,
    feedbackEnabled: course.feedbackEnabled === true,
    hasFeedback,
  });

  if (!courseComplete) {
    redirect(courseHref);
  }
  if (course.feedbackEnabled === true && !hasFeedback) {
    redirect(feedbackHref);
  }
  if (!unlocked) {
    redirect(courseHref);
  }

  const learnerName = await getLearnerDisplayName(userId);
  const courseTitle = course.title?.trim() ?? "Course";

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
          Certificate of completion
        </h1>
        <p className="mt-4 text-body-lg text-neutral-700">
          You have completed {courseTitle}.
        </p>
        {learnerName ? (
          <p className="mt-2 text-body text-neutral-500">
            This certificate is issued to {learnerName}.
          </p>
        ) : null}
        <p className="mt-2 text-body text-neutral-500">
          Download a PDF to save or share it.
        </p>
        <div className="mt-10 flex flex-col items-start gap-4">
          <DownloadCertificateButton courseId={course._id} courseSlug={course.slug} />
          <Link
            href={courseHref}
            className="text-body font-medium text-primary-500 hover:text-[#ea580c]"
          >
            Back to course
          </Link>
        </div>
      </main>
    </div>
  );
}
