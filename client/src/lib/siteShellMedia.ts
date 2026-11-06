import { CmsRow } from "@/lib/adminTables";
import { supabase } from "@/lib/supabase";

export function mediaUrl(row: CmsRow) {
  const path = String(row.name ?? "");
  if (!path) return "";
  if (/^(https?:\/\/|\/)/.test(path)) return path;
  return supabase?.storage.from("Media").getPublicUrl(path).data.publicUrl ?? "";
}
