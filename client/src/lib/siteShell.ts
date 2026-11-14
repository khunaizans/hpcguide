import { supabase } from "@/lib/supabase";
import { getMediaUrl } from "./mediaUrl";
export type ShellLink = {
  label: string;
  labelEn?: string;
  href: string;
  kind: "section" | "page" | "external";
  visible: boolean;
  order: number;
};
export type ShellButton = { label: string; href: string; visible: boolean; order: number };
export type ShellHeader = { logoUrl: string; logoSize: "small" | "medium" | "large"; logoHref: string; links: ShellLink[]; buttons: ShellButton[]; background: "glass" | "white" | "transparent"; textColor: "ink" | "muted"; height: "compact" | "standard" };

export type ShellFooter = {
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  logoUrl: string;
  copyright: string;
  copyrightEn?: string;
  links: ShellLink[];
  socials: Array<{
    label: string;
    labelEn?: string;
    href: string;
    icon: "linkedin" | "x" | "instagram" | "youtube" | "globe";
    visible: boolean;
    order: number;
  }>;
  partners: Array<{
    name: string;
    nameEn?: string;
    imageUrl: string;
    href: string;
    visible: boolean;
    order: number;
  }>;
  background: "white" | "soft" | "navy";
  textColor: "ink" | "muted";
};

export type SiteShell = { header: ShellHeader; footer: ShellFooter };

const logo = "/images/hpc-logo_739bab33.png";export const defaultShell: SiteShell = {
  header: { logoUrl: logo, logoSize: "medium", logoHref: "/", background: "glass", textColor: "muted", height: "standard", links: [
    { label: "الرئيسية", href: "#hero", kind: "section", visible: true, order: 0 }, { label: "عن المؤتمر", href: "#about", kind: "section", visible: true, order: 1 }, { label: "المسارات", href: "#pathways", kind: "section", visible: true, order: 2 }, { label: "المساعد", href: "#assistant", kind: "section", visible: true, order: 3 }, { label: "الخريطة", href: "#resources", kind: "section", visible: true, order: 4 }
  ], buttons: [] },
  footer: { title: "مؤتمر التخصصات الصحية", description: "نلتقي لنحوّل المعرفة إلى أثر.", logoUrl: logo, copyright: "© HPC 2027", links: [], socials: [], partners: [], background: "white", textColor: "muted" }
};

function mergeShell(value: unknown): SiteShell {
  if (!value || typeof value !== "object") return defaultShell;
  const raw = value as Partial<SiteShell>;
  return { header: { ...defaultShell.header, ...(raw.header ?? {}), links: Array.isArray(raw.header?.links) ? raw.header.links : defaultShell.header.links, buttons: Array.isArray(raw.header?.buttons) ? raw.header.buttons : [] }, footer: { ...defaultShell.footer, ...(raw.footer ?? {}), links: Array.isArray(raw.footer?.links) ? raw.footer.links : [], socials: Array.isArray(raw.footer?.socials) ? raw.footer.socials : [], partners: Array.isArray(raw.footer?.partners) ? raw.footer.partners : [] } };
}

export async function loadPublishedShell(): Promise<SiteShell> {
  if (!supabase) return defaultShell;
  const { data } = await supabase.from("site_settings").select("setting_value").eq("setting_key", "shell_header_footer_published").maybeSingle();
  if (!data?.setting_value) return defaultShell;
  try { return mergeShell(typeof data.setting_value === "string" ? JSON.parse(data.setting_value) : data.setting_value); } catch { return defaultShell; }
}

export async function saveShellSetting(key: "shell_header_footer_draft" | "shell_header_footer_published", value: SiteShell) {
  if (!supabase) throw new Error("اتصال Supabase غير مهيأ");
  const encoded = JSON.stringify(value);
  const existing = await supabase.from("site_settings").select("id").eq("setting_key", key).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  const result = existing.data?.id ? await supabase.from("site_settings").update({ setting_value: encoded, updated_at: new Date().toISOString() }).eq("id", existing.data.id) : await supabase.from("site_settings").insert({ setting_key: key, setting_value: encoded });
  if (result.error) throw new Error(result.error.message);
}

export async function loadShellDraft(rows: Array<Record<string, unknown>>): Promise<SiteShell> {
  const draft = rows.find((row) => row.setting_key === "shell_header_footer_draft");
  const published = rows.find((row) => row.setting_key === "shell_header_footer_published");
  const row = draft ?? published;
  if (!row?.setting_value) return defaultShell;
  try { return mergeShell(typeof row.setting_value === "string" ? JSON.parse(row.setting_value) : row.setting_value); } catch { return defaultShell; }
}
