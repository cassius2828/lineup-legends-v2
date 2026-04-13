"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function DisplaySection() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = mounted ? resolvedTheme : undefined;

  return (
    <section className="border-foreground/10 bg-surface-800 rounded-2xl border p-6">
      <h2 className="text-foreground mb-1 text-lg font-semibold">Display</h2>
      <p className="text-foreground/50 mb-6 text-sm">
        Choose your preferred appearance
      </p>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground font-medium">Theme</p>
          <p className="text-foreground/50 text-sm">
            Select light or dark mode
          </p>
        </div>

        <div className="border-foreground/10 bg-surface-700 flex items-center gap-1 rounded-full border p-1">
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              active === "dark"
                ? "bg-foreground/10 text-foreground shadow-sm"
                : "text-foreground/50 hover:text-foreground/70"
            }`}
          >
            <Moon className="h-4 w-4" />
            Dark
          </button>
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              active === "light"
                ? "bg-foreground/10 text-foreground shadow-sm"
                : "text-foreground/50 hover:text-foreground/70"
            }`}
          >
            <Sun className="h-4 w-4" />
            Light
          </button>
        </div>
      </div>
    </section>
  );
}
