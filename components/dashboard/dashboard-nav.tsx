"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLockup } from "@/components/brand-lockup";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Plus } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface DashboardNavProps {
  user: SupabaseUser | null;
}

export function DashboardNav({ user }: DashboardNavProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isGuest = Boolean(user?.is_anonymous);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSignOut() {
    if (!user || isSigningOut) return;

    setIsSigningOut(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      setIsSigningOut(false);
      return;
    }

    router.refresh();
    window.location.href = isGuest ? "/" : "/auth/login";
  }

  const displayName = user?.is_anonymous
    ? "Guest"
    : user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";

  return (
    <header className="border-b border-border/50 bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BrandLockup />
          </Link>
        </div>

        <div className="flex items-center gap-4">


          <Link href="/dashboard/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Study Session
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <User className="w-4 h-4" />
                {mounted ? displayName : "Account"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled className="text-muted-foreground">
                {mounted ? user?.email || "Anonymous session" : "Loading account..."}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  void handleSignOut();
                }}
                className="text-destructive"
                disabled={!user || isSigningOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
