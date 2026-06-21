"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      className="relative w-9 h-9 rounded-lg border border-border hover:border-border-strong bg-bg-elevated flex items-center justify-center text-content-muted hover:text-content transition-all duration-300 group overflow-hidden"
      title={isDark ? "Passer en clair" : "Passer en sombre"}
      aria-label="Changer de thème"
    >
      <Sun
        size={16}
        className={`absolute transition-all duration-300 ${isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`}
      />
      <Moon
        size={16}
        className={`absolute transition-all duration-300 ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}`}
      />
    </button>
  );
}
