"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      if (!data.session) {
        setError("Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      // Check if email confirmation is disabled (auto-confirm)
      if (data.session) {
        window.location.href = "/dashboard";
      } else {
        setError("✓ Account created! Check your email to confirm.");
        setIsLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md p-4 relative z-10">
        <div className="glass p-8 rounded-2xl border border-white/10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
              <img src="/Reelgen new logo.png" alt="Reelgen" className="h-10 w-10 shrink-0 rounded-lg object-contain align-middle group-hover:scale-110 transition-transform" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Reelgen
              </span>
            </Link>
            <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground text-sm">
              Sign in to continue creating viral videos
            </p>
          </div>

          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-black/20 border-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-black/20 border-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 text-white placeholder:text-gray-500"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-3">
              <Button
                type="submit"
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-10"
              >
                {isLoading ? "Loading..." : "Sign In"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleSignUp}
                disabled={isLoading}
                className="w-full text-muted-foreground hover:text-white hover:bg-white/5"
              >
                Create an account
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
