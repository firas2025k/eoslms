"use client";

import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function AuthControls() {
  return (
    <>
      <Show when="signed-out">
        <div className="flex items-center gap-1 sm:gap-2">
          <SignInButton mode="modal">
            <Button
              variant="text"
              className="h-8 px-1.5 text-small font-medium sm:h-9 sm:px-2 sm:text-body"
            >
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="primary" size="md" className="h-8 px-2.5 text-small sm:h-9 sm:px-3 sm:text-body">
              Sign up
            </Button>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "size-8 sm:size-9",
            },
          }}
        />
      </Show>
    </>
  );
}
