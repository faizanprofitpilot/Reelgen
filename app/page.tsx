import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, Users, ArrowRight, PlayCircle, Video, Check, Package, Upload, Palette, Play } from "lucide-react";
import { SUBSCRIPTION_PLANS, CREDIT_PACKS } from "@/lib/billing/plans";
import { LandingAnimate } from "@/components/LandingAnimate";
import { createClient } from "@/lib/supabase/server";

const PLAN_FEATURES: Record<string, string[]> = {
  Starter: [
    "100 credits per month",
    "All 3 viral templates",
    "10 AI avatars",
    "3–15s per video",
    "Export 9:16 for Reels & TikTok",
    "Cancel anytime",
  ],
  Growth: [
    "250 credits per month",
    "All 3 viral templates",
    "10 AI avatars",
    "3–15s per video",
    "Export 9:16 for Reels & TikTok",
    "Priority support",
    "Cancel anytime",
  ],
  Pro: [
    "600 credits per month",
    "All 3 viral templates",
    "10 AI avatars",
    "3–15s per video",
    "Export 9:16 for Reels & TikTok",
    "Priority support",
    "Cancel anytime",
  ],
};

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-background/50 backdrop-blur-xl animate-fade-in">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-2 shrink-0 z-10">
            <img src="/Reelgen new logo.png" alt="Reelgen" className="h-10 w-10 shrink-0 rounded-lg object-contain align-middle" />
            <span className="text-xl font-bold leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Reelgen
            </span>
          </Link>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6">
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors hidden sm:inline">
              Pricing
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors hidden sm:inline">
              How it works
            </a>
          </div>
          <div className="flex items-center gap-4 shrink-0 z-10">
            {user ? (
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-500/20">
                  Go to dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/login">
                  <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-500/20">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Create Viral Product Videos<br />
            <span className="text-glow text-blue-400">In Seconds</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Generate realistic UGC-style ads using AI avatars and proven templates. 
            No cameras, no actors, just results.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Link href={user ? "/dashboard" : "/login"}>
              <Button size="lg" className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-500/25 rounded-full">
                {user ? "Go to dashboard" : "Start Creating Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base glass border-white/10 hover:bg-white/10 hover:text-white rounded-full">
                <PlayCircle className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Reel strip: N in order, then same N again — seamless loop, no gap */}
      <section id="demo" className="relative w-full overflow-hidden pt-6 pb-6 md:pt-10 md:pb-10 scroll-mt-20">
        <div className="flex animate-reel-scroll w-max gap-4 md:gap-6">
          {[
            "/landing%20illustrations/f32887b0-ef0e-43d8-a66a-86b2829aa6b3.mp4",
            "/landing%20illustrations/final%20(1).mp4",
            "/landing%20illustrations/final%20(2).mp4",
            "/landing%20illustrations/final.mp4",
            "/landing%20illustrations/final%20(3).mp4",
            "/landing%20illustrations/final%20(4).mp4",
            "/landing%20illustrations/final%20(5).mp4",
            "/landing%20illustrations/final%20(6).mp4"
          ]
            .reduce<string[]>((acc, _, __, arr) => acc.length ? acc : [...arr, ...arr], [])
            .map((src, i) => (
            <div key={i} className="h-80 md:h-[36rem] flex-shrink-0 aspect-[9/16] overflow-hidden rounded-2xl">
              <video
                src={src}
                className="h-full w-full object-cover rounded-2xl"
                muted
                loop
                playsInline
                autoPlay
                aria-hidden
              />
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <LandingAnimate>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Video,
                  title: "Viral Templates",
                  desc: "Proven hooks and structures optimized for TikTok & Reels retention.",
                  color: "text-blue-400"
                },
                {
                  icon: Users,
                  title: "AI Avatars",
                  desc: "10 realistic avatars that look and sound like real creators.",
                  color: "text-cyan-400"
                },
                {
                  icon: Zap,
                  title: "Instant Generation",
                  desc: "From product image to finished video in minutes.",
                  color: "text-indigo-400"
                }
              ].map((feature, i) => (
                <div
                  key={i}
                  className="landing-animate-initial glass p-8 rounded-2xl hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 group"
                  data-stagger={i}
                >
                  <div className={`h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </LandingAnimate>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-32 relative scroll-mt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <LandingAnimate>
            <div className="text-center max-w-2xl mx-auto mb-14 landing-animate-initial" data-stagger="0">
              <p className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-3">Pricing</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
                Plans that scale with your creatives
              </h2>
              <p className="text-lg text-muted-foreground">
                One credit = one second of video. Subscribe for monthly credits or top up with a pack. No lock-in.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
              {Object.entries(SUBSCRIPTION_PLANS).map(([name, plan], idx) => {
              const isPopular = name === "Growth";
              const features = PLAN_FEATURES[name] ?? [];
              return (
                <div
                  key={name}
                  data-stagger={idx + 1}
                  className={`
                    landing-animate-initial relative flex flex-col rounded-2xl border transition-all duration-300
                    ${isPopular
                      ? "md:-mt-2 md:mb-2 bg-white/[0.06] border-blue-500/40 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20"
                      : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-0.5"
                    }
                  `}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-semibold text-blue-200">
                        Most popular
                      </span>
                    </div>
                  )}
                  <div className="p-6 md:p-8 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
                    <div className="mt-4 mb-6 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tabular-nums text-white">${plan.priceMonthlyUsd}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      <span className="font-medium text-white">{plan.creditsPerMonth} credits</span> included monthly
                    </p>
                    <ul className="space-y-3 flex-1">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 shrink-0 text-emerald-400/90 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={user ? "/dashboard" : "/login"} className="mt-8 block">
                      <Button
                        className={`w-full rounded-xl h-11 ${isPopular ? "bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-500/20" : "border-white/20 bg-white/5 hover:bg-white/10 text-white"}`}
                      >
                        {user ? "Go to dashboard" : `Get ${name}`}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

            {/* Add-on credit pack */}
            <div className="max-w-2xl mx-auto mt-12 landing-animate-initial" data-stagger="4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Package className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Need more credits?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    One-time pack: {CREDIT_PACKS["100"].credits} credits for ${CREDIT_PACKS["100"].priceUsd}. Use anytime—no expiry.
                  </p>
                </div>
              </div>
              <Link href={user ? "/dashboard" : "/login"} className="shrink-0">
                <Button variant="outline" className="border-white/20 hover:bg-white/10 hover:text-white rounded-xl px-6">
                  {user ? "Go to dashboard" : "Buy 100 credits"}
                </Button>
              </Link>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-10 max-w-xl mx-auto landing-animate-initial" data-stagger="5">
              All plans billed monthly. Cancel anytime. Credits are consumed at 1 per second of generated video.
            </p>
          </LandingAnimate>
        </div>
      </section>

      {/* Steps Section */}
      <section id="how-it-works" className="py-24 relative overflow-hidden scroll-mt-20">
        <div className="container mx-auto px-4">
          <LandingAnimate>
            <div className="text-center mb-16 landing-animate-initial" data-stagger="0">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to generate high-converting video ads.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>

              {[
                { icon: Upload, title: "Upload Product", desc: "Upload your product images." },
                { icon: Palette, title: "Choose Style", desc: "Select a template & avatar." },
                { icon: Play, title: "Generate", desc: "Get your video in seconds." }
              ].map((item, i) => (
                <div key={i} className="landing-animate-initial relative text-center" data-stagger={i + 1}>
                  <div className="w-24 h-24 mx-auto bg-background border border-blue-500/30 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                    <item.icon className="h-10 w-10 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </LandingAnimate>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <LandingAnimate>
            <div className="landing-animate-initial glass rounded-3xl p-12 md:p-20 text-center relative overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 to-cyan-600/10 pointer-events-none"></div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">
                Ready to Scale Your Ads?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 relative z-10">
                Join thousands of marketers creating high-performing UGC creatives with AI.
              </p>
              <Link href={user ? "/dashboard" : "/login"}>
                <Button size="lg" className="h-14 px-10 text-lg bg-white text-black hover:bg-white/90 rounded-full relative z-10">
                  {user ? "Go to dashboard" : "Start Creating Now"}
                </Button>
              </Link>
            </div>
          </LandingAnimate>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-black/20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 Reelgen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
