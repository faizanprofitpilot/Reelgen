"use client";

import { useRef, useEffect, useState } from "react";

interface LandingAnimateProps {
  children: React.ReactNode;
  className?: string;
  /** Root margin for when to trigger (e.g. "0px 0px -80px 0px" = trigger when 80px from bottom of viewport) */
  rootMargin?: string;
}

export function LandingAnimate({ children, className = "", rootMargin = "0px 0px -60px 0px" }: LandingAnimateProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.1, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={`${className} ${inView ? "landing-animate-in-view" : ""}`}
    >
      {children}
    </div>
  );
}
