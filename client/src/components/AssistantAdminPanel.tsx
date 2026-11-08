import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, MessageCircle, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AnswerBlock, answerToJson } from "@/lib/assistant";
import { CmsRow } from "@/lib/adminTables";
import { loadRouteRecords, routeToPathway } from "@/lib/routesCms";

type Props = { sections: CmsRow[]; items: CmsRow[]; mediaRows: CmsRow[]; settings: CmsRow[]; refresh: () => void };
const emptyBlock = (): AnswerBlock => ({ type: "text", text: "" });
const answerTypes = [{ type: "text", label: "نص" }, { type: "image", label: "صورة" }, { type: "file", label: "ملف" }, { type: "link", label: "رابط / زر" }] as const;
function mediaUrl(row: CmsRow) { const path = String(row.name ?? ""); return /^(https?:\/\/|\/)/.test(path) ? path : supabase?.storage.from("Media").getPublicUrl(path).data.publicUrl ?? ""; }
function parseBlocks(row?: CmsRow): AnswerBlock[] { try { const raw = row?.answer ?? row?.description; const value = typeof raw === "string" ? JSON.parse(raw) : raw; return Array.isArray(value) && value.length ? value : [{ type: "text", text: String(row?.description ?? "") }]; } catch { return [emptyBlock()]; } }

export default function AssistantAdminPanel({ sections, items, mediaRows, settings, refresh }: Props) {
  const [selectedGroup, setSelectedGroup] = useState("general");

const [pathwayOptions, setPathwayOptions] = useState<
  { slug: string; title: string }[]
>([]);

useEffect(() => {
  let active = true;

  void loadRouteRecords()
    .then((records) => {
      if (!active) return;

      setPathwayOptions(
        records.map(routeToPathway).map((route) => ({
          slug: route.slug,
          title: route.title,
        }))
      );
    })
    .catch((error) => {
      console.error("Failed to load assistant pathways:", error);
      toast.error("تعذر تحميل المسارات");
    });

  return () => {
    active = false;
  };
}, []);
  const section = sections.find((row) => row.name === "assistant_qa"); const questions = useMemo(() => {
  if (!section?.id) return [];

  return items
    .filter(
      (row) => String(row.section_id) === String(section.id)
    )
    .filter((row) => {
      const group = String(row.name ?? "");

      if (selectedGroup === "general") {
        return !group.startsWith("pathway-faq:");
      }

      return group.startsWith(`pathway-faq:${selectedGroup}:`);
    })
    .sort(
      (a, b) =>
        Number(a.sort_order ?? 0) -
        Number(b.sort_order ?? 0)
    );
}, [items, section?.id, selectedGroup]);
  const getSetting = (key: string, fallback: string) => String(settings.find((row) => row.setting_key === key)?.setting_value ?? fallback);
  const [name, setName] = useState(getSetting("assistant_name", "مساعد المؤتمر")); const [welcome, setWelcome] = useState(getSetting("assistant_welcome", "كيف أقدر أساعدك؟")); const [icon, setIcon] = useState(getSetting("assistant_icon", "؟")); const [enabled, setEnabled] = useState(getSetting("assistant_enabled", "true") !== "false"); const [editing, setEditing] = useState<CmsRow | null>(null); const [busy, setBusy] = useState(false); const [assistantTab, setAssistantTab] = useState<"questions" | "settings">("questions");
  useEffect(() => { setName(getSetting("assistant_name", "مساعد المؤتمر")); setWelcome(getSetting("assistant_welcome", "كيف أقدر أساعدك؟")); setIcon(getSetting("assistant_icon", "؟")); setEnabled(getSetting("assistant_enabled", "true") !== "false"); }, [settings]);

const saveSetting = async (key: string, value: string) => {
  if (!supabase) {
    throw new Error("اتصال Supabase غير مهيأ");
  }

  const { data: existing, error: lookupError } = await supabase
    .from("site_settings")
    .select("id")
    .eq("setting_key", key)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  const result = existing?.id
    ? await supabase
        .from("site_settings")
        .update({ setting_value: value })
        .eq("id", existing.id)
    : await supabase
        .from("site_settings")
        .insert({ setting_key: key, setting_value: value });

  if (result.error) {
    throw new Error(result.error.message);
  }
};

 
const saveSettings = async () => {
  if (!supabase || busy) return;

  setBusy(true);

  try {
    // Load all questions, including hidden questions
    const { data: assistantSection, error: sectionError } =
      await supabase
        .from("sections")
        .select("id")
        .eq("name", "assistant_qa")
        .maybeSingle();

    if (sectionError) throw sectionError;

    let allQuestions: CmsRow[] = [];

    if (assistantSection) {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("section_id", assistantSection.id)
        .order("sort_order", { ascending: true })
        .limit(1000);

      if (error) throw error;
      allQuestions = data ?? [];
    }

    // Build a complete draft
    const draftContent = {
      name,
      welcome,
      icon,
      enabled,
      questions: allQuestions.map((row) => {
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
      }),
    };

    // Save draft separately from published content
    await saveSetting(
      "assistant_draft_content",
      JSON.stringify(draftContent)
    );

    // Save assistant settings
    await saveSetting("assistant_name", name);
    await saveSetting("assistant_welcome", welcome);
    await saveSetting("assistant_icon", icon);
    await saveSetting("assistant_enabled", String(enabled));

    toast.success("تم حفظ المسودة بنجاح");
    refresh();
  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : "تعذر حفظ المسودة"
    );
  } finally {
    setBusy(false);
  }
};

  

const publishAssistant = async () => {
  if (!supabase || busy) return;

  setBusy(true);

  try {
    // Read the last saved draft
    const { data, error } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "assistant_draft_content")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.setting_value) {
      throw new Error(
        "لا توجد مسودة محفوظة. اضغط حفظ المسودة أولاً."
      );
    }

    // Parse saved draft
    const draft = JSON.parse(
      String(data.setting_value)
    ) as {
      name: string;
      welcome: string;
      icon: string;
      enabled: boolean;
      questions: Array<{
        id?: unknown;
        question: string;
        answer: AnswerBlock[];
        is_visible?: boolean;
        sort_order?: number;
        pathwaySlug?: string;
      }>;
    };

    if (!draft || !Array.isArray(draft.questions)) {
      throw new Error("المسودة المحفوظة غير صالحة");
    }

    // Publish visible questions only
    const publishedContent = {
      name: draft.name,
      welcome: draft.welcome,
      icon: draft.icon,
      enabled: draft.enabled,
      questions: draft.questions
        .filter(
          (question) =>
            question &&
            question.is_visible !== false &&
            typeof question.question === "string" &&
            Array.isArray(question.answer)
        )
        .map((question) => ({
          ...question,
          is_visible: true,
        })),
    };

    // Update the public version
    await saveSetting(
      "assistant_published_content",
      JSON.stringify(publishedContent)
    );

    toast.success("تم نشر التغييرات بنجاح");
    refresh();

  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : "تعذر نشر التغييرات"
    );
  } finally {
    setBusy(false);
  }
};
 
const ensureSection = async () => {
  if (!supabase) {
    throw new Error("اتصال Supabase غير مهيأ");
  }

  if (section?.id) {
    return section.id;
  }

  // Find the existing homepage
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id")
    .eq("slug", "home")
    .single();

  if (pageError) {
    throw new Error(pageError.message);
  }

  // Create assistant FAQ section linked to the homepage
  const { data, error } = await supabase
    .from("sections")
    .insert({
      page_id: page.id,
      name: "assistant_qa",
      title: name,
      is_visible: true,
      sort_order: 999,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id;
};

  
const saveQuestion = async (draft: CmsRow) => {
  if (!supabase) return;

  const sectionId = await ensureSection();

  const previousName = String(draft.name ?? "");
  const prefix = `pathway-faq:${selectedGroup}:`;

  const questionName =
    selectedGroup === "general"
      ? previousName && !previousName.startsWith("pathway-faq:")
        ? previousName
        : `assistant-general:${crypto.randomUUID()}`
      : previousName.startsWith(prefix)
        ? previousName
        : `${prefix}${crypto.randomUUID()}`;

  const payload = {
    section_id: sectionId,
    name: questionName,
    title: String(draft.title ?? "").trim(),
    description: answerToJson(
      (draft.answerBlocks as AnswerBlock[]) ?? [emptyBlock()]
    ),
    is_visible: draft.is_visible !== false,
    sort_order: Number(draft.sort_order ?? questions.length),
  };

  if (!payload.title) {
    toast.error("يرجى كتابة السؤال");
    return;
  }

  const result = draft.id
    ? await supabase.from("items").update(payload).eq("id", draft.id)
    : await supabase.from("items").insert(payload);

  if (result.error) {
    throw new Error(result.error.message);
  }

  toast.success(draft.id ? "تم حفظ السؤال" : "تمت إضافة السؤال");

  setEditing(null);
  refresh();
};

  const deleteQuestion = async (row: CmsRow) => { if (!supabase || !window.confirm("حذف السؤال؟")) return; const result = await supabase.from("items").delete().eq("id", row.id); if (result.error) toast.error(result.error.message); else { toast.success("تم حذف السؤال"); refresh(); } };
  const duplicateQuestion = async (row: CmsRow) => { try { await saveQuestion({ title: `${String(row.title ?? "سؤال")} (نسخة)`, answerBlocks: parseBlocks(row), is_visible: true, sort_order: questions.length }); } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر التكرار"); } };
  const move = async (row: CmsRow, direction: number) => { if (!supabase) return; const index = questions.findIndex((item) => String(item.id) === String(row.id)); const target = questions[index + direction]; if (!target) return; await supabase.from("items").update({ sort_order: target.sort_order ?? index + direction }).eq("id", row.id); await supabase.from("items").update({ sort_order: row.sort_order ?? index }).eq("id", target.id); refresh(); };
  const toggle = async (row: CmsRow) => { if (!supabase) return; await supabase.from("items").update({ is_visible: row.is_visible === false }).eq("id", row.id); refresh(); };
  const upload = async (file: File, block: AnswerBlock, update: (next: AnswerBlock) => void) => { if (!supabase) return; const path = `assistant/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "-")}`; const result = await supabase.storage.from("Media").upload(path, file, { contentType: file.type }); if (result.error) { toast.error(result.error.message); return; } await supabase.from("media").insert({ name: path, alt_text: file.name }); update({ ...block, url: supabase.storage.from("Media").getPublicUrl(path).data.publicUrl, label: file.name }); toast.success("تم رفع الملف"); };
  
return (
  <section className="admin-panel assistant-admin-panel">
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "20px",
      }}
    >
      
<button
  type="button"
  className="primary"
  onClick={() => void saveSettings()}
  disabled={busy}
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    position: "relative",
    zIndex: 2,
  }}
>
  <Save size={15} />
  حفظ المسودة
</button>

<button
  type="button"
  className="primary"
  onClick={() => void publishAssistant()}
  disabled={busy}
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    position: "relative",
    zIndex: 2,
  }}
>
  <Upload size={15} />
  نشر التغييرات
</button>

    </div>
<div className="admin-panel-head"><div><small>مساعد الأسئلة والأجوبة</small><h2>المساعد</h2><p>أسئلة جاهزة وإجابات منظمة بدون محادثة حرة.</p></div><button className="primary" onClick={() => setEditing({ title: "", answerBlocks: [emptyBlock()], is_visible: true, sort_order: questions.length })}><Plus size={15} /> إضافة سؤال</button></div><div className="assistant-tabs" role="tablist"><button className={assistantTab === "questions" ? "active" : ""} onClick={() => setAssistantTab("questions")}>الأسئلة والأجوبة</button><button className={assistantTab === "settings" ? "active" : ""} onClick={() => setAssistantTab("settings")}>إعدادات المساعد</button></div>{assistantTab === "settings" && <div className="assistant-settings-card"><div><h3>إعدادات المساعد</h3><p>تتحكم في الزر والرسالة الترحيبية الظاهرة للزوار.</p></div><div className="assistant-settings-grid"><label><span>اسم المساعد</span><input value={name} onChange={(event) => setName(event.target.value)} /></label><label><span>النص الترحيبي</span><input value={welcome} onChange={(event) => setWelcome(event.target.value)} /></label><label><span>أيقونة الزر</span><input value={icon} onChange={(event) => setIcon(event.target.value)} /></label><label className="assistant-toggle"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /><span>إظهار المساعد</span></label></div><button className="primary" onClick={saveSettings} disabled={busy}><Save size={15} /> حفظ الإعدادات</button></div>}{assistantTab === "questions" && (
  <>
    <div className="assistant-settings-card" style={{ marginBottom: 20 }}>
      <label>
        <span>القسم أو المسار</span>
        <select
          value={selectedGroup}
          onChange={(event) => setSelectedGroup(event.target.value)}
        >
          <option value="general">الأسئلة العامة</option>

          {pathwayOptions.map((pathway) => (
            <option key={pathway.slug} value={pathway.slug}>
              {pathway.title}
            </option>
          ))}
        </select>
      </label>
    </div>

    {questions.length === 0 ? <div className="admin-empty"><MessageCircle size={28} /><h3>لا توجد أسئلة بعد</h3><button className="primary" onClick={() => setEditing({ title: "", answerBlocks: [emptyBlock()], is_visible: true, sort_order: 0 })}><Plus size={15} /> إضافة أول سؤال</button></div> : <div className="assistant-question-admin-list">{questions.map((row, index) => <article className={row.is_visible === false ? "is-hidden" : ""} key={String(row.id)}><div className="assistant-question-admin-icon"><MessageCircle size={18} /></div><div><b>{String(row.title ?? "سؤال بلا عنوان")}</b><small>{parseBlocks(row).length} محتوى في الإجابة</small></div><span className={row.is_visible === false ? "status" : "status on"}>{row.is_visible === false ? "مخفي" : "ظاهر"}</span><div className="row-actions"><button onClick={() => move(row, -1)} title="تحريك لأعلى"><ArrowUp size={15} /></button><button onClick={() => move(row, 1)} title="تحريك لأسفل"><ArrowDown size={15} /></button><button onClick={() => toggle(row)}>{row.is_visible === false ? <Eye size={15} /> : <EyeOff size={15} />}</button><button onClick={() => duplicateQuestion(row)}><Copy size={15} /></button><button onClick={() => setEditing({ ...row, answerBlocks: parseBlocks(row) })}><Pencil size={15} /></button><button onClick={() => deleteQuestion(row)}><Trash2 size={15} /></button></div></article>)}</div>}</>)}{editing && <QuestionEditor draft={editing} mediaRows={mediaRows} close={() => setEditing(null)} save={saveQuestion} upload={upload} />}</section>
);
}
function QuestionEditor({ draft, mediaRows, close, save, upload }: { draft: CmsRow; mediaRows: CmsRow[]; close: () => void; save: (draft: CmsRow) => Promise<void>; upload: (file: File, block: AnswerBlock, update: (next: AnswerBlock) => void) => Promise<void> }) { const [question, setQuestion] = useState(String(draft.title ?? "")); const [blocks, setBlocks] = useState<AnswerBlock[]>((draft.answerBlocks as AnswerBlock[]) ?? [emptyBlock()]); const [saving, setSaving] = useState(false); const change = (index: number, next: AnswerBlock) => setBlocks((current) => current.map((block, itemIndex) => itemIndex === index ? next : block)); const submit = async () => {
  if (!question.trim()) {
    toast.error("يرجى كتابة السؤال");
    return;
  }

  setSaving(true);

  try {
    await save({
      ...draft,
      title: question.trim(),
      answerBlocks: blocks,
    });
  } catch (error) {
    console.error("Assistant question save error:", error);

    toast.error(
      error instanceof Error
        ? error.message
        : "حدث خطأ أثناء حفظ السؤال"
    );
  } finally {
    setSaving(false);
  }
}; return <div className="assistant-editor-modal"><div className="assistant-editor-card"><div className="admin-modal-head"><div><small>محرر المساعد</small><h2>{draft.id ? "تعديل السؤال" : "إضافة سؤال"}</h2></div><button onClick={close}><X size={18} /></button></div><label className="assistant-question-input"><span>السؤال</span><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="اكتب السؤال هنا" /></label><div className="answer-blocks-head"><div><h3>الإجابة</h3><p>يمكنك جمع نص وصورة وملف ورابط في إجابة واحدة.</p></div><select onChange={(event) => { const type = event.target.value as AnswerBlock["type"]; if (type) setBlocks((current) => [...current, { type, text: "", label: "", url: "" }]); event.target.value = ""; }}><option value="">+ إضافة محتوى</option>{answerTypes.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}</select></div><div className="answer-block-list">{blocks.map((block, index) => <div className="answer-block-card" key={`${block.type}-${index}`}><div className="answer-block-card-head"><b>{answerTypes.find((item) => item.type === block.type)?.label}</b><div><button onClick={() => index > 0 && setBlocks((current) => current.map((item, itemIndex) => itemIndex === index - 1 ? current[index] : itemIndex === index ? current[index - 1] : item))}><ArrowUp size={14} /></button><button onClick={() => index < blocks.length - 1 && setBlocks((current) => current.map((item, itemIndex) => itemIndex === index + 1 ? current[index] : itemIndex === index ? current[index + 1] : item))}><ArrowDown size={14} /></button><button onClick={() => setBlocks((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button></div></div>{block.type === "text" ? <textarea rows={3} value={block.text ?? ""} onChange={(event) => change(index, { ...block, text: event.target.value })} placeholder="اكتب نص الإجابة" /> : block.type === "link" ? <div className="assistant-block-fields"><input value={block.label ?? ""} onChange={(event) => change(index, { ...block, label: event.target.value })} placeholder="نص الرابط أو الزر" /><input value={block.url ?? ""} onChange={(event) => change(index, { ...block, url: event.target.value })} placeholder="الرابط" /></div> : <div className="assistant-media-select"><select value={block.url ?? ""} onChange={(event) => change(index, { ...block, url: event.target.value })}><option value="">اختيار من الوسائط</option>{mediaRows.map((row, mediaIndex) => <option key={String(row.id ?? mediaIndex)} value={mediaUrl(row)}>{String(row.alt_text ?? row.name ?? `ملف ${mediaIndex + 1}`)}</option>)}</select><label className="primary upload"><Upload size={14} /> رفع ملف جديد<input type="file" accept={block.type === "image" ? "image/*" : ".pdf,.doc,.docx,image/*"} onChange={async (event) => { const file = event.target.files?.[0]; if (file) await upload(file, block, (next) => change(index, next)); event.target.value = ""; }} /></label></div>}</div>)}</div><div className="admin-modal-actions"><button onClick={close}>إلغاء</button><button className="primary" onClick={submit} disabled={saving}><Save size={15} /> حفظ السؤال</button></div></div></div>; }
