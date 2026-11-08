import { supabase } from "@/lib/supabase";

export type AnswerBlock = { type: "text" | "image" | "file" | "link"; text?: string; url?: string; label?: string; alt?: string };
export type AssistantQuestion = {
  id?: unknown;
  question: string;
  answer: AnswerBlock[];
  is_visible?: boolean;
  sort_order?: number;
  pathwaySlug?: string;
};
export type AssistantContent = { name: string; welcome: string; icon: string; enabled: boolean; questions: AssistantQuestion[] };
export const fallbackAssistant: AssistantContent = { name: "مساعد المؤتمر", welcome: "كيف أقدر أساعدك؟", icon: "؟", enabled: true, questions: [
  { question: "أين تقع المطاعم؟", answer: [{ type: "text", text: "يمكنك معرفة المواقع والخدمات من قسم المرافق المجاورة." }] },
  { question: "أين توجد مواقف السيارات؟", answer: [{ type: "text", text: "تجد مواقف السيارات ضمن صفحة المرافق المجاورة." }] },
  { question: "كيف أصل إلى القاعات؟", answer: [{ type: "text", text: "افتح خريطة المؤتمر من قسم الخريطة لمعرفة أقرب طريق." }] },
  { question: "أين أجد خريطة المؤتمر؟", answer: [{ type: "text", text: "يمكنك الوصول إلى الخريطة من القائمة العلوية أو قسم المرافق." }] },
] };
function parseBlocks(row: Record<string, unknown>): AnswerBlock[] { try { const raw = row.answer ?? row.description; const value = typeof raw === "string" ? JSON.parse(raw) : raw; return Array.isArray(value) ? value as AnswerBlock[] : [{ type: "text", text: String(row.description ?? "") }]; } catch { return [{ type: "text", text: String(row.description ?? "") }]; } }

export async function loadAssistant(): Promise<AssistantContent> {
  if (!supabase) return fallbackAssistant;

  // Read the published version first
  const { data: publishedRow, error: publishedError } = await supabase
    .from("site_settings")
    .select("setting_value")
    .eq("setting_key", "assistant_published_content")
    .maybeSingle();

  if (!publishedError && publishedRow?.setting_value) {
    try {
      const published = JSON.parse(
        String(publishedRow.setting_value)
      ) as Partial<AssistantContent>;

      if (published && Array.isArray(published.questions)) {
        return {
          name: String(published.name ?? fallbackAssistant.name),
          welcome: String(
            published.welcome ?? fallbackAssistant.welcome
          ),
          icon: String(published.icon ?? fallbackAssistant.icon),
          enabled: published.enabled !== false,
          questions: published.questions.filter(
            (question) =>
              question &&
              typeof question.question === "string" &&
              Array.isArray(question.answer)
          ),
        };
      }
    } catch (error) {
      console.error("Invalid published assistant content:", error);
    }
  }

  // Compatibility with the existing data until first publication
  const { data: section, error: sectionError } = await supabase
    .from("sections")
    .select("*")
    .eq("name", "assistant_qa")
    .eq("is_visible", true)
    .maybeSingle();

  if (sectionError || !section) return fallbackAssistant;

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("section_id", section.id)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  const { data: settingsRows } = await supabase
    .from("site_settings")
    .select("setting_key,setting_value")
    .in("setting_key", [
      "assistant_name",
      "assistant_welcome",
      "assistant_icon",
      "assistant_enabled",
    ]);

  const settings = Object.fromEntries(
    (settingsRows ?? []).map((row) => [
      row.setting_key,
      row.setting_value,
    ])
  );

  return {
    name: String(settings.assistant_name ?? section.title ?? fallbackAssistant.name),
    welcome: String(settings.assistant_welcome ?? fallbackAssistant.welcome),
    icon: String(settings.assistant_icon ?? fallbackAssistant.icon),
    enabled: settings.assistant_enabled !== "false",
    questions: (items ?? [])
      .map((row) => {
        const rowName = String(row.name ?? "");
        const pathwayMatch = rowName.match(
          /^pathway-faq:(.+):[^:]+$/
        );

        return {
          id: row.id,
          question: String(row.title ?? ""),
          answer: parseBlocks(row),
          is_visible: row.is_visible !== false,
          sort_order: Number(row.sort_order ?? 0),
          pathwaySlug: pathwayMatch?.[1],
        };
      })
      .filter((question) => question.question),
  };
}

export function answerToJson(blocks: AnswerBlock[]) { return JSON.stringify(blocks); }
