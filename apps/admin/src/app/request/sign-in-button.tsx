"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function RequestSignInButton() {
    return (
        <Button
            className="w-full"
            onClick={async () => {
                await authClient.signIn.social({
                    provider: "google",
                    callbackURL: "/request",
                });
            }}
        >
            Google bilan kirish
        </Button>
    );
}
