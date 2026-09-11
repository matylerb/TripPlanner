"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import { useStore } from "@/lib/store";

interface ThemeCtx {
  dark: boolean;
  toggle: () => void;
}
const ThemeContext = createContext<ThemeCtx>({ dark: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

function subscribeTheme(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}
function getDark() {
  return document.documentElement.classList.contains("dark");
}

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useStore((s) => s.hydrate);
  const dark = useSyncExternalStore(subscribeTheme, getDark, () => false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("tripsync:theme", next ? "dark" : "light");
    } catch {}
  }, []);

  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>;
}
