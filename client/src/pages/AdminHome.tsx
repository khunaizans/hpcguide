import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, ImagePlus, Link as LinkIcon, RefreshCw, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import type { CmsRow } from "@/lib/adminTables";
import { migrateHomepage } from "@/lib/homeCms";
import { loadPublishedRouteRecords } from "@/lib/routesCms";
import { supabase } from "@/lib/supabase";

type HomeSection = { id: string; name: string; title: string; visible: boolean; items: CmsRow[] };
type HomeData = { page: CmsRow | null; sections: HomeSection[] };
const labels: Record<string, string> = { hero: "المقدمة الرئيسية", about: "عن المؤتمر", pathways: "المسارات", assistant: "المساعد", resources: "دليل المكان" };
const sectionOrder = ["hero", "about", "pathways", "assistant", "resources"];
const fieldLabels: Record<string, string> = { kicker: "العبارة التعريفية", "title-lead": "العنوان الرئيسي", "title-accent": "العنوان المميز", description: "الوصف", "top-right": "النص العلوي الأيمن", "top-left": "النص العلوي الأيسر", eyebrow: "العنوان الصغير", "title-line-1": "السطر الأول", "title-line-2": "السطر الثاني", "vision-label": "تسمية الرؤية", "vision-title": "عنوان الرؤية", "vision-text": "نص الرؤية", "mission-label": "تسمية الرسالة", "mission-title": "عنوان الرسالة", "mission-text": "نص الرسالة", "bot-name": "اسم المساعد", "bot-status": "حالة المساعد", note: "ملاحظة المساعد", welcome: "رسالة الترحيب", "user-message": "رسالة المستخدم", "bot-reply": "رد المساعد", placeholder: "النص الإرشادي" };
const longFields = new Set(["description", "vision-text", "mission-text", "note", "welcome", "user-message", "bot-reply"]);

function value(row: CmsRow | undefined, field: string) { return String(row?.[field] ?? ""); }
function mediaUrl(row: CmsRow) { const path = String(row.name ?? ""); if (/^(https?:\/\/|\/)/.test(path)) return path; return supabase?.storage.from("Media").getPublicUrl(path).data.publicUrl ?? ""; }
function sectionItems(section: HomeSection, names?: string[]) { return section.items.filter((item) => !names || names.includes(String(item.name))); }

function Field({ label, value: fieldValue, onChange, wide = false }: { label: string; value: string; onChange: (value: string) => void; wide?: boolean }) { return <label className={wide ? "home-editor-field home-editor-field--wide" : "home-editor-field"}><span>{label}</span>{longFields.has(label) || wide ? <textarea rows={3} value={fieldValue} onChange={(event) => onChange(event.target.value)} /> : <input value={fieldValue} onChange={(event) => onChange(event.target.value)} />}</label>; }

export default function AdminHome({ mediaRows, refresh }: { mediaRows: CmsRow[]; refresh: () => void }) {
  const [, navigate] = useLocation();
  const [data, setData] = useState<HomeData>({ page: null, sections: [] });
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const media = useMemo(() => mediaRows.map((row) => ({ label: String(row.alt_text ?? row.name ?? "صورة"), url: mediaUrl(row) })).filter((item) => item.url), [mediaRows]);
  const load = async () => {
    if (!supabase) return;
    setBusy(true);
    try {
      const { data: page, error: pageError } = await supabase.from("pages").select("*").eq("slug", "home").maybeSingle();
      if (pageError) throw new Error(pageError.message);
      if (!page) { setData({ page: null, sections: [] }); return; }
      const { data: rows, error: sectionError } = await supabase.from("sections").select("*").eq("page_id", page.id).order("sort_order", { ascending: true });
      if (sectionError) throw new Error(sectionError.message);
      const ids = (rows ?? []).map((row) => row.id);
      const { data: items, error: itemError } = ids.length ? await supabase.from("items").select("*").in("section_id", ids).order("sort_order", { ascending: true }) : { data: [], error: null };
      if (itemError) throw new Error(itemError.message);
      const sections = (rows ?? []).sort((a, b) => sectionOrder.indexOf(String(a.name)) - sectionOrder.indexOf(String(b.name))).map((row) => { const sectionItems = (items ?? []).filter((item) => String(item.section_id) === String(row.id)); if (String(row.name) === "hero" && !sectionItems.some((item) => String(item.name) === "image")) sectionItems.push({ id: `new-hero-image-${row.id}`, section_id: row.id, name: "image", is_visible: true }); return { id: String(row.id), name: String(row.name), title: String(row.title ?? labels[String(row.name)] ?? "قسم"), visible: row.is_visible !== false, items: sectionItems }; });
      setData({ page, sections });
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر تحميل الصفحة الرئيسية"); } finally { setBusy(false); }
  };
  useEffect(() => { void load(); }, []);

const addResourceCard = (section: HomeSection) => {
  const numbers = section.items.map((item) => {
    const match = String(item.name ?? "").match(/^card-(\d+)$/);
    return match ? Number(match[1]) : 0;
  });

  const nextNumber = Math.max(0, ...numbers) + 1;

  const newCard = {
    id: `new-resource-${nextNumber}`,
    name: `card-${nextNumber}`,
    title: "مركز المحاكاة السريرية",
    description: "",
    image_url: "",
    link_url: "",
    is_visible: true,
    sort_order: 10 + nextNumber,
  } as CmsRow;

  updateSection(section.id, {
    items: [...section.items, newCard],
  });
};

  const updateSection = (sectionId: string, patch: Partial<HomeSection>) => setData((current) => ({ ...current, sections: current.sections.map((section) => section.id === sectionId ? { ...section, ...patch } : section) }));
  const updateItem = (sectionId: string, name: string, patch: CmsRow) => setData((current) => ({ ...current, sections: current.sections.map((section) => section.id === sectionId ? { ...section, items: section.items.map((item) => String(item.name) === name ? { ...item, ...patch } : item) } : section) }));

const moveResourceCard = (
  section: HomeSection,
  cardName: string,
  direction: -1 | 1
) => {
  const cards = section.items
    .filter((row) => /^card-\d+$/.test(String(row.name ?? "")))
    .sort(
      (a, b) =>
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
    );

  const index = cards.findIndex(
    (row) => String(row.name) === cardName
  );

  const targetIndex = index + direction;

  if (index < 0 || targetIndex < 0 || targetIndex >= cards.length) {
    return;
  }

  [cards[index], cards[targetIndex]] = [
    cards[targetIndex],
    cards[index],
  ];

  const reordered = cards.map((row, position) => ({
    ...row,
    sort_order: 10 + position,
  }));

  updateSection(section.id, {
    items: [
      ...section.items.filter(
        (row) => !/^card-\d+$/.test(String(row.name ?? ""))
      ),
      ...reordered,
    ],
  });
};

  const item = (section: HomeSection, name: string) => section.items.find((row) => String(row.name) === name);
  const save = async (section: HomeSection) => {
    if (!supabase || !data.page) return;
    setSaving(section.id);
    try {
      const sectionResult = await supabase.from("sections").update({ is_visible: section.visible, title: section.title }).eq("id", section.id);
      if (sectionResult.error) throw new Error(sectionResult.error.message);
      for (const row of section.items) {
        if (row.name === "vision-text") {
  console.log("VISION SAVE DEBUG:", {
    id: row.id,
    description: row.description,
    length: String(row.description ?? "").length
  });
}

const payload = {
  title: row.title ?? null,
  subtitle: row.subtitle ?? null,
  description: row.description ?? null,
  image_url: row.image_url ?? null,
  alt_text: row.alt_text ?? null,
  link_url: row.link_url ?? null,
  link_label: row.link_label ?? null,
  is_visible: row.is_visible !== false,

  ...(section.name === "resources" &&
  /^card-\d+$/.test(String(row.name ?? ""))
    ? { sort_order: Number(row.sort_order ?? 10) }
    : {}),
};

        const result = String(row.id).startsWith("new-") ? await supabase.from("items").insert({ ...payload, section_id: section.id, name: row.name, sort_order: Number(row.sort_order ?? 7) }) : await supabase.from("items").update(payload).eq("id", row.id);
        if (result.error) throw new Error(result.error.message);
        if (!String(row.id).startsWith("new-")) {
  const { data: saved, error: verifyError } = await supabase
    .from("items")
    .select("description")
    .eq("id", row.id)
    .single();

  if (verifyError) throw new Error(verifyError.message);

  if (saved.description !== payload.description) {
    throw new Error(`لم يتم حفظ التعديل في Supabase: ${row.name}`);
  }
}
      }
      toast.success(`تم حفظ قسم ${labels[section.name] ?? section.title}`);
      await load(); refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر حفظ القسم"); } finally { setSaving(null); }
  };
  const migrate = async () => { setBusy(true); try { await migrateHomepage(); toast.success("تم استيراد محتوى الصفحة الحالية"); await load(); refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر الاستيراد"); } finally { setBusy(false); } };
  const uploadHero = async (section: HomeSection, event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file || !supabase) return; setSaving(section.id); try { const path = `admin/home-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "-")}`; const uploaded = await supabase.storage.from("Media").upload(path, file, { contentType: file.type, upsert: false }); if (uploaded.error) throw new Error(uploaded.error.message); const url = supabase.storage.from("Media").getPublicUrl(path).data.publicUrl; const mediaInsert = await supabase.from("media").insert({
  name: path,
  file_url: url,
  alt_text: file.name
});
 if (mediaInsert.error) throw new Error(mediaInsert.error.message);
 const imageItem = section.items.find(
  (item) => item.name === "image"
);

if (!imageItem) {
  throw new Error("لم يتم العثور على عنصر صورة الغلاف");
}

const { data: savedImage, error: imageError } = await supabase
  .from("items")
  .update({
    image_url: url,
    alt_text: file.name
  })
  .eq("id", imageItem.id)
  .select("id")
  .single();

if (imageError) {
  throw new Error(imageError.message);
}

if (!savedImage) {
  throw new Error("لم يتم حفظ رابط الصورة");
}
 updateItem(section.id, "image", { image_url: url, alt_text: file.name }); toast.success("تم رفع الصورة واختيارها"); } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر رفع الصورة"); } finally { setSaving(null); event.target.value = ""; } };
  const renderFields = (section: HomeSection, names: string[]) => <div className="home-editor-fields">{names.map((name) => { const row = item(section, name); return <Field key={name} label={fieldLabels[name] ?? name} value={value(row, name === "description" || name.endsWith("-text") || name === "note" || name === "welcome" || name === "user-message" || name === "bot-reply" ? "description" : "title")} wide={name === "description" || name.endsWith("-text") || name === "note" || name === "welcome" || name === "user-message" || name === "bot-reply"} onChange={(next) => updateItem(section.id, name, { [name === "description" || name.endsWith("-text") || name === "note" || name === "welcome" || name === "user-message" || name === "bot-reply" ? "description" : "title"]: next })} />; })}</div>;
  const renderSection = (section: HomeSection) => {
    const name = section.name;
    return <article className={`home-editor-card ${section.visible ? "" : "is-hidden"}`} key={section.id}><div className="home-editor-card-head"><div><small>قسم الصفحة الرئيسية</small><h3>{labels[name] ?? section.title}</h3></div><div className="home-editor-card-actions"><label className="home-visibility"><input type="checkbox" checked={section.visible} onChange={(event) => updateSection(section.id, { visible: event.target.checked })} />{section.visible ? <Eye size={15} /> : <EyeOff size={15} />} {section.visible ? "ظاهر" : "مخفي"}</label><button className="primary" onClick={() => save(section)} disabled={saving === section.id}><Save size={14} />{saving === section.id ? "جارٍ الحفظ..." : "حفظ القسم"}</button></div></div>
      {name === "hero" && <>{renderFields(section, ["kicker", "title-lead", "title-accent", "description", "top-right", "top-left"])}<div className="home-image-editor"><div><b>الصورة الرئيسية</b><small>اختر من مكتبة Media أو ارفع صورة جديدة.</small></div><select value={value(item(section, "image"), "image_url")} onChange={(event) => updateItem(section.id, "image", { image_url: event.target.value })}><option value="">الصورة الحالية</option>{media.map((asset) => <option key={asset.url} value={asset.url}>{asset.label}</option>)}</select><label className="primary upload"><Upload size={14} /> رفع واستبدال<input type="file" accept="image/*" onChange={(event) => uploadHero(section, event)} /></label><input className="home-alt-input" placeholder="النص البديل للصورة" value={value(item(section, "image"), "alt_text")} onChange={(event) => updateItem(section.id, "image", { alt_text: event.target.value })} /></div></>}
      {name === "about" && renderFields(section, ["eyebrow", "title-line-1", "title-line-2", "description", "vision-label", "vision-title", "vision-text", "mission-label", "mission-title", "mission-text"])}
      {name === "pathways" && <><div className="home-section-note"><LinkIcon size={16} /><span>بيانات بطاقات المسارات مشتركة مع قسم <b>المسارات</b>. عدّل أسماء المسارات وصورها من هناك لتظهر تلقائيًا هنا.</span><button onClick={() => navigate("/admin/routes")}>فتح إدارة المسارات</button></div>{renderFields(section, ["eyebrow", "title-line-1", "title-line-2", "description"])}</>}
      {name === "assistant" && <div className="home-section-note"><ImagePlus size={16} /><span>محتوى المساعد يُدار من قسم المساعد للحفاظ على مصدر بيانات واحد.</span><button onClick={() => navigate("/admin")}>فتح إدارة المساعد</button></div>}
{name === "resources" && (
  <>
    {renderFields(section, [
      "eyebrow",
      "title-line-1",
      "title-line-2",
      "description",
    ])}

    <div className="home-shared-cards">
      {section.items
        .filter((row) =>
          /^card-\d+$/.test(String(row.name ?? ""))
        )

.map((row) => (
  <div key={String(row.id)}>

<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
  }}
>
  <strong>{String(row.title ?? "مرفق")}</strong>

  <div style={{ display: "flex", gap: "8px" }}>
    <button
      type="button"
      onClick={() =>
        moveResourceCard(section, String(row.name), -1)
      }
    >
      ↑ للأعلى
    </button>

    <button
      type="button"
      onClick={() =>
        moveResourceCard(section, String(row.name), 1)
      }
    >
      ↓ للأسفل
    </button>
  </div>
</div>

    <label>
      <span>اسم المرفق</span>
      <input
        type="text"
        value={String(row.title ?? "")}
        onChange={(event) =>
          updateItem(section.id, String(row.name), {
            title: event.target.value,
          })
        }
      />
    </label>

    <label>
      <span>رابط صفحة المرفق</span>
      <input
        type="text"
        value={String(row.link_url ?? "")}
        placeholder="/locations/clinical-simulation-center"
        onChange={(event) =>
          updateItem(section.id, String(row.name), {
            link_url: event.target.value,
          })
        }
      />
    </label>

<label>
  <span>صورة المرفق</span>
  <select
    value={String(row.image_url ?? "")}
    onChange={(event) =>
      updateItem(section.id, String(row.name), {
        image_url: event.target.value,
      })
    }
  >
    <option value="">اختر صورة من المكتبة</option>
    {media.map((asset) => (
      <option key={asset.url} value={asset.url}>
        {asset.label}
      </option>
    ))}
  </select>
</label>

<label className="home-visibility">
  <input
    type="checkbox"
    checked={row.is_visible !== false}
    onChange={(event) =>
      updateItem(section.id, String(row.name), {
        is_visible: event.target.checked,
      })
    }
  />
  {row.is_visible !== false ? (
    <>
      <Eye size={15} />
      ظاهر
    </>
  ) : (
    <>
      <EyeOff size={15} />
      مخفي
    </>
  )}
</label>

  </div>
))}

    </div>

    <button
      type="button"
      className="primary"
      onClick={() => addResourceCard(section)}
      style={{ marginTop: "16px" }}
    >
      + إضافة مرفق
    </button>
  </>
)}

    </article>;
  };
  return <section className="admin-panel home-admin-panel"><div className="admin-panel-head"><div><small>إدارة المحتوى العام</small><h2>الصفحة الرئيسية</h2><p>عدّل محتوى الأقسام مع الحفاظ على التصميم والحركات الحالية.</p></div><div><button onClick={() => void load()} disabled={busy}><RefreshCw size={14} /> تحديث</button>{!data.page && <button className="primary" onClick={() => void migrate()} disabled={busy}><RefreshCw size={14} /> استيراد المحتوى الحالي</button>}</div></div>{data.page && <div className="home-admin-note">تظهر تغييرات المسارات من المصدر المشترك نفسه في البطاقات وصفحات التفاصيل. لا توجد نسخة منفصلة من بيانات المسارات هنا.</div>}{!data.page ? <div className="admin-empty"><ImagePlus size={28} /><h3>لم تتم مزامنة الصفحة الرئيسية بعد</h3><p>سيتم استيراد المحتوى الحالي فقط إلى الجداول الموجودة دون تغيير الموقع العام.</p><button className="primary" onClick={() => void migrate()} disabled={busy}>استيراد الصفحة الحالية</button></div> : <div className="home-editor-list">{data.sections.map(renderSection)}</div>}</section>;
}
