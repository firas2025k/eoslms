"use client";

import posthog from "posthog-js";
import {buttonClassName} from "@/components/ui/button";
import {certificatePdfPath} from "@/lib/certificate";

type DownloadCertificateButtonProps = {
  courseId: string;
  courseSlug: string;
};

export function DownloadCertificateButton({
  courseId,
  courseSlug,
}: DownloadCertificateButtonProps) {
  return (
    <a
      href={certificatePdfPath(courseId)}
      className={buttonClassName({className: "w-full sm:w-auto"})}
      onClick={() => {
        posthog.capture("certificate_downloaded", {
          course_id: courseId,
          course_slug: courseSlug,
        });
      }}
    >
      Download PDF
    </a>
  );
}
