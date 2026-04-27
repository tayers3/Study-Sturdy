"use client";

import { useEffect, useState } from "react";

export function WelcomeSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, 7000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="mx-4 w-full max-w-2xl rounded-3xl border border-primary/20 bg-card/95 p-10 text-center shadow-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
          Study Sturdy
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Welcome to Study Sturdy
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Never lose your notes again.
        </p>
      </div>
    </div>
  );
}
