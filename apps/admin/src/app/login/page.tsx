"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
    return (
        <div className="min-h-screen grid place-items-center p-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Admin panel</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">Google orqali kiring.</p>

                    <Button
                        className="w-full"
                        onClick={async () => {
                            await authClient.signIn.social({
                                provider: "google",
                                callbackURL: "/dashboard",
                            });
                        }}
                    >
                        Google bilan kirish
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}