"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LayoutGrid, UserCircle, LogOut, CreditCard, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "dashboard" | "avatars";

interface DashboardNavProps {
  userEmail: string | undefined;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  variant?: "dashboard" | "billing";
}

export function DashboardNav({
  userEmail,
  currentView,
  onViewChange,
  variant = "dashboard",
}: DashboardNavProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      const { data } = await supabase
        .from("users")
        .select("credits_balance")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled) setCredits(data?.credits_balance ?? 0);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-14 relative flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0 z-10">
          <img src="/Reelgen new logo.png" alt="Reelgen" className="h-9 w-9 shrink-0 rounded-lg object-contain align-middle" />
          <span className="text-lg font-semibold text-white leading-none">Reelgen</span>
        </Link>

        {variant === "dashboard" ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-lg bg-white/5 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => onViewChange("dashboard")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                currentView === "dashboard"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onViewChange("avatars")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                currentView === "avatars"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <UserCircle className="h-4 w-4" />
              Avatars
            </button>
          </div>
        ) : (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0 z-10">
          <Link
            href="/billing"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/10 transition-colors tabular-nums"
          >
            Credits: {credits !== null ? credits : "—"}
          </Link>
          <div className="relative flex items-center" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="Account menu"
            className={cn(
              "flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-white hover:bg-white/5 transition-colors",
              dropdownOpen && "bg-white/5 text-white"
            )}
          >
            <UserCircle className="h-5 w-5" />
          </button>
          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 z-50 min-w-[220px] rounded-xl border border-white/10 bg-popover shadow-lg shadow-black/20 py-1.5"
              role="menu"
              aria-orientation="vertical"
            >
              <div className="px-3 py-2.5 border-b border-white/10">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Signed in as</p>
                <p className="text-sm text-white truncate mt-0.5">{userEmail ?? "Account"}</p>
              </div>
              <Link
                href="/billing"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-white hover:bg-white/10 transition-colors outline-none focus:bg-white/10 focus:text-white rounded-lg mx-1.5"
              >
                <CreditCard className="h-4 w-4 shrink-0" />
                Billing
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  handleSignOut();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-white hover:bg-white/10 transition-colors outline-none focus:bg-white/10 focus:text-white rounded-lg mx-1.5"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </nav>
  );
}
