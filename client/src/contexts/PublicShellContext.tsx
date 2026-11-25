import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { defaultShell, loadPublishedShell, type SiteShell } from "@/lib/siteShell";
import { supabase } from "@/lib/supabase";

export type PublicShell = { shell: SiteShell; customized: boolean; failed?: boolean };
const fallback: PublicShell = { shell: defaultShell, customized: false };
const PublicShellContext = createContext<PublicShell | null>(fallback);
export const PublicShellSnapshotProvider = PublicShellContext.Provider;

let pendingShell: Promise<PublicShell> | undefined;

export function requestPublicShell(): Promise<PublicShell> {
  if (!supabase) return Promise.resolve(fallback);
  pendingShell ??= loadPublishedShell(AbortSignal.timeout(8000))
    .then(shell => shell ? { shell, customized: true } : fallback)
    .catch(() => ({ ...fallback, failed: true }))
    .finally(() => { pendingShell = undefined; });
  return pendingShell;
}

export function PublicShellProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const publicRoute = !location.startsWith("/admin");
  const [value, setValue] = useState<PublicShell | null>(supabase ? null : fallback);

  useEffect(() => {
    if (!supabase) return;
    if (!publicRoute) {
      setValue(null);
      return;
    }
    let active = true;
    void requestPublicShell().then(shell => {
      if (active) setValue(shell);
    });

    return () => {
      active = false;
    };
  }, [publicRoute]);

  return <PublicShellContext.Provider value={value}>{children}</PublicShellContext.Provider>;
}

export function usePublicShell() {
  return useContext(PublicShellContext);
}
