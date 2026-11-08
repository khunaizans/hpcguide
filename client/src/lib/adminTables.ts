import { supabase } from "@/lib/supabase";

export type CmsTable = "pages" | "sections" | "items" | "media" | "site_settings";
export type CmsRow = Record<string, unknown>;

export const cmsTables: Array<{ id: CmsTable; label: string; hint: string }> = [
  { id: "pages", label: "الصفحات", hint: "إدارة الصفحات" },
  { id: "sections", label: "الأقسام", hint: "أقسام الصفحات" },
  { id: "items", label: "العناصر", hint: "النصوص والبطاقات" },
  { id: "media", label: "الوسائط", hint: "الصور والملفات" },
  { id: "site_settings", label: "الإعدادات", hint: "إعدادات الموقع" },
];

const suggestedFields: Record<CmsTable, string[]> = {
  pages: ["title", "name", "slug", "is_visible", "sort_order"],
  sections: ["page_id", "title", "name", "subtitle", "content", "is_visible", "sort_order"],
  items: ["section_id", "title", "name", "subtitle", "description", "link_label", "link_url", "image_url", "is_visible", "sort_order"],
  media: ["name", "alt_text"],
  site_settings: ["setting_key", "setting_value", "updated_at"],
};

export async function readTable(table: CmsTable) {
  if (!supabase) throw new Error("اتصال Supabase غير مهيأ");
  const { data, error } = await supabase.from(table).select("*").limit(1000);
  if (error) throw new Error(error.message);
  return (data ?? []) as CmsRow[];
}

export function fieldsFor(table: CmsTable, rows: CmsRow[], row?: CmsRow) {
  const discovered: string[] = [];
  rows.forEach((item) => Object.keys(item).forEach((key) => { if (!discovered.includes(key)) discovered.push(key); }));
  const fields = [...discovered, ...suggestedFields[table].filter((field) => !discovered.includes(field))];
  return row ? fields.filter((field) => row[field] !== undefined || suggestedFields[table].includes(field)) : fields;
}

export function rowKey(row: CmsRow) {
  for (const field of ["id", "uuid", "slug", "key"]) if (row[field] !== undefined && row[field] !== null) return { field, value: row[field] };
  return null;
}

export function showValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "ظاهر" : "مخفي";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function editValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
}

export function isLong(field: string, value: unknown) {
  return ["description", "content", "body", "text", "value", "url"].some((name) => field.includes(name)) || typeof value === "string" && value.length > 80;
}

export function castValue(field: string, value: string, original: unknown) {
  if (typeof original === "boolean" || field.startsWith("is_") || field.startsWith("show_")) return value === "true";
  if (typeof original === "number" || field.endsWith("_order") || field === "order") return value === "" ? null : Number(value);
  return value;
}
