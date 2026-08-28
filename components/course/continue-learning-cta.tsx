"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";

type ContinueLearningCtaProps = {
  href: string;
  isSignedIn: boolean;
  className?: string;
};

export function ContinueLearningCta({
  href,
  isSignedIn,
  className,
}: ContinueLearningCtaProps) {
  const classes = buttonClassName({className});
  const label = (
    <>
      Continue Learning
      <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
    </>
  );

  if (isSignedIn) {
    return (
      <Link href={href} className={classes}>
        {label}
      </Link>
    );
  }

  return (
    <SignInButton
      mode="modal"
      forceRedirectUrl={href}
      signUpForceRedirectUrl={href}
    >
      <button type="button" className={classes}>
        {label}
      </button>
    </SignInButton>
  );
}
