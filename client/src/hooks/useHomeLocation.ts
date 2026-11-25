import { useBrowserLocation, type BrowserLocationHook } from "wouter/use-browser-location";
import { requestPublicShell, usePublicShell } from "@/contexts/PublicShellContext";
import { loadPublishedHome, readHomeSnapshot, setPreparedHome } from "@/lib/homeData";
import { getHomeLayoutFonts, type HomeIntent } from "@/lib/homeScroll";
import { supabase } from "@/lib/supabase";

const homePath = import.meta.env.BASE_URL.replace(/\/+$/, "");
let pendingReturn: AbortController | undefined;

export const useHomeLocation: BrowserLocationHook = options => {
  const [path, navigate] = useBrowserLocation(options);
  const shell = usePublicShell();

  return [path, (to, options) => {
    pendingReturn?.abort();
    pendingReturn = undefined;

    const destination = new URL(to, window.location.href);
    const fromHome = path.replace(/\/+$/, "") === homePath;
    const toHome = destination.pathname.replace(/\/+$/, "") === homePath;
    if (fromHome || !toHome || path.startsWith(homePath + "/admin")) {
      const state = options?.state as { hpcHomeIntent?: HomeIntent } | undefined;
      const intent = state?.hpcHomeIntent;
      const homeAnchor = fromHome && toHome && (intent === "top" || intent === "section");
      if (fromHome && (!toHome || homeAnchor)) window.dispatchEvent(new Event("hpc:save-home-position"));
      navigate(to, homeAnchor ? { ...options, state: { ...history.state, ...state } } : options);
      // Wouter observes pathname changes. Notify the mounted Home for explicit anchors on the same path.
      if (homeAnchor) window.dispatchEvent(new Event("hpc:home-navigation"));
      return;
    }

    const intent: HomeIntent = destination.hash && destination.hash !== "#hero" ? "section" : "top";
    const goHome = () => navigate(to, { ...options, state: { ...options?.state, hpcHomeIntent: intent } });
    const fonts = getHomeLayoutFonts();
    const needsContent = Boolean(supabase && !readHomeSnapshot());
    setPreparedHome();
    if (!needsContent && !fonts.length) {
      goHome();
      return;
    }

    // Keep the outgoing detail page mounted until the destination has real layout.
    const controller = new AbortController();
    pendingReturn = controller;
    const origin = window.location.href;
    const cancel = () => controller.abort();
    window.addEventListener("popstate", cancel, { signal: controller.signal });
    window.addEventListener("pagehide", cancel, { signal: controller.signal });

    const content = needsContent
      ? Promise.all([loadPublishedHome(controller.signal), shell ?? requestPublicShell()])
      : undefined;
    const layout = Promise.allSettled(fonts.map(font => font.load()));
    void Promise.all([content, layout]).then(([data]) => {
      if (pendingReturn !== controller) return;
      pendingReturn = undefined;
      if (controller.signal.aborted || window.location.href !== origin) {
        cancel();
        return;
      }
      cancel();
      if (data) {
        const [load, shell] = data;
        setPreparedHome({ load, shell });
      }
      goHome();
    });
  }];
};
