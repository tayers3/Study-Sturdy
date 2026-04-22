"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

export default function StartPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function continueAsGuest() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        if (!cancelled) {
          router.replace("/dashboard");
          router.refresh();
        }
        return;
      }

      const { error: signInError } = await supabase.auth.signInAnonymously();

      if (signInError) {
        if (!cancelled) {
          setError(signInError.message);
        }
        return;
      }

      if (!cancelled) {
        router.replace("/dashboard");
        router.refresh();
      }
    }

    continueAsGuest();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle>Starting Guest Mode</CardTitle>
          <CardDescription>Setting up your instant study workspace...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {error ? (
            <>
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
              <p className="text-sm text-muted-foreground">
                Guest sign-in is unavailable right now. You can still use email login.
              </p>
              <Link href="/auth/login">
                <Button className="w-full">Go to Login</Button>
              </Link>
            </>
          ) : (
            <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing your dashboard
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
