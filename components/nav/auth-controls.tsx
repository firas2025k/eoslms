"use client";

import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function AuthControls() {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="text" className="h-9 px-2 text-body font-medium">
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button variant="primary" size="md" className="h-9">
            Sign up
          </Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "size-9",
            },
          }}
        />
      </Show>
    </>
  );
}
