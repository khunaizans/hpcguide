export type HomeScrollPosition = {
  entry: string;
  sectionId?: string;
  offset: number;
  y: number;
  hash?: string;
};

export type HomeIntent = "top" | "section";
export type HomeNavigation = { hash: string; scroll?: HomeScrollPosition; intent?: HomeIntent; headerEntrance?: boolean };
export const homeScrollStorageKey = "hpc-guide-home-scroll";
export const homeSnapshotKey = "hpc-guide-published-home-v1";

export function readHomeNavigation(): HomeNavigation {
  const hash = window.location.hash || history.state?.hpcPendingHomeHash || "";
  const intent = history.state?.hpcHomeIntent;
  const isSectionReload =
  ["#about", "#resources"].includes(hash) &&
  (
    performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined
  )?.type === "reload";

if (isSectionReload) {
  return {
    hash,
    intent: "section",
    headerEntrance: false,
  };
}
  if (intent === "top" || intent === "section") {
    return { hash, intent, headerEntrance: history.state?.hpcHeaderEntrance === true };
  }
  try {
    const entry = history.state?.hpcHomeEntry;
    if (typeof entry === "string" && entry) {
      const saved = JSON.parse(sessionStorage.getItem(`${homeScrollStorageKey}:${entry}`) ?? "null");
      if (saved?.entry === entry && (saved.hash ?? "") === hash && Number.isFinite(saved.y) && saved.y >= 0) {
        return { hash, scroll: saved };
      }
    }
  } catch {
    // Storage may be unavailable.
  }
  return { hash };
}

export function getHomeLayoutFonts(): FontFace[] {
  return document.fonts ? Array.from(document.fonts).filter(font =>
    font.family.replace(/["']/g, "") === "Thmanyah Sans" && font.status !== "loaded"
  ) : [];
}
