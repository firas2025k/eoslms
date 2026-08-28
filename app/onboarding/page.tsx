import {auth, currentUser} from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import type {Metadata} from "next";
import {Header} from "@/components/nav/header";
import {OnboardingForm} from "@/components/onboarding/onboarding-form";
import {safeNextPath} from "@/lib/forms/paths";
import {hasCompletedOnboarding} from "@/lib/onboarding-server";

type PageProps = {
  searchParams: Promise<{next?: string | string[]}>;
};

export const metadata: Metadata = {
  title: "Before you start · Eos Academy",
};

export default async function OnboardingPage({searchParams}: PageProps) {
  const {isAuthenticated, userId} = await auth();
  if (!isAuthenticated || !userId) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  const nextPath = safeNextPath(params.next) ?? "/courses";

  if (await hasCompletedOnboarding(userId)) {
    redirect(`/api/onboarding?next=${encodeURIComponent(nextPath)}`);
  }

  const user = await currentUser();
  const defaultFullName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  const defaultEmail = user?.primaryEmailAddress?.emailAddress ?? "";

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
        showSearch={false}
        className="relative z-10 bg-white/90 backdrop-blur-sm"
      />

      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-6 pb-16 pt-10 sm:pt-12">
        <h1 className="font-display text-display-2 font-bold text-neutral-900 sm:text-display-1">
          Before you start
        </h1>
        <p className="mt-3 text-body-lg text-neutral-500">
          About a minute — then you can begin.
        </p>
        <div className="mt-10">
          <OnboardingForm
            nextPath={nextPath}
            defaultFullName={defaultFullName}
            defaultEmail={defaultEmail}
          />
        </div>
      </main>
    </div>
  );
}
