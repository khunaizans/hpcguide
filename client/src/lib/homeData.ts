import type { PublicShell } from "@/contexts/PublicShellContext";
import { fallbackHomeContent, mapHomeContent, type HomeContent } from "@/lib/homeCms";
import { homeSnapshotKey } from "@/lib/homeScroll";
import { loadPublishedRouteRecords, routeToPathway } from "@/lib/routesCms";
import { supabase } from "@/lib/supabase";

export type PublishedHomeLoad =
  | { status: "empty" | "error" }
  | { status: "success"; content: HomeContent };
type HomeSnapshot = { content: HomeContent; shell: PublicShell };
type PreparedHome = { load: PublishedHomeLoad; shell: PublicShell };

let lastSnapshot: HomeSnapshot | undefined;
let preparedHome: PreparedHome | undefined;

export function readHomeSnapshot(): HomeSnapshot | undefined {
  if (lastSnapshot) return lastSnapshot;
  try {
    const snapshot = JSON.parse(sessionStorage.getItem(homeSnapshotKey) ?? "null");
    if (snapshot?.content?.visibility && snapshot.shell?.shell?.header && snapshot.shell.shell.footer) {
      return snapshot;
    }
  } catch {
    // A missing snapshot leaves the normal CMS load path available.
  }
}

export function saveHomeSnapshot(snapshot?: HomeSnapshot) {
  lastSnapshot = snapshot;
  try {
    if (snapshot) sessionStorage.setItem(homeSnapshotKey, JSON.stringify(snapshot));
    else sessionStorage.removeItem(homeSnapshotKey);
  } catch {
    // The published snapshot remains available for returns in this document.
  }
}

export function setPreparedHome(prepared?: PreparedHome) {
  preparedHome = prepared;
}

export function readPreparedHome() {
  return preparedHome;
}

async function loadHomeSections(signal: AbortSignal): Promise<HomeContent | null> {
  if (!supabase) return fallbackHomeContent;
  const { data: page, error } = await supabase.from("pages").select("id")
    .eq("slug", "home").eq("is_visible", true).abortSignal(signal).maybeSingle();
  if (error) throw error;
  if (!page) return null;

  const sections = await supabase.from("sections").select("*").eq("page_id", page.id)
    .order("sort_order", { ascending: true }).abortSignal(signal);
  if (sections.error) throw sections.error;
  if (!sections.data?.length) return null;

  const items = await supabase.from("items").select("*")
    .in("section_id", sections.data.map(section => section.id))
    .order("sort_order", { ascending: true }).abortSignal(signal);
  if (items.error) throw items.error;
  return mapHomeContent(sections.data, items.data ?? []);
}

export async function loadPublishedHome(signal: AbortSignal): Promise<PublishedHomeLoad> {
  if (!supabase) return { status: "success", content: fallbackHomeContent };
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal.aborted) cancel();
  signal.addEventListener("abort", cancel, { once: true });
  const timeout = window.setTimeout(cancel, 8000);

  try {
    const [sections, routes] = await Promise.all([
      loadHomeSections(controller.signal),
      loadPublishedRouteRecords(controller.signal, true),
    ]);
    return sections ? {
      status: "success",
      content: {
        ...sections,
        pathways: { ...sections.pathways, cards: routes.map(routeToPathway) },
      },
    } : { status: "empty" };
  } catch {
    return { status: "error" };
  } finally {
    window.clearTimeout(timeout);
    signal.removeEventListener("abort", cancel);
    cancel();
  }
}
