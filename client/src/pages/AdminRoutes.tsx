import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Plus, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CmsRow } from "@/lib/adminTables";
import { mediaUrl } from "@/lib/siteShellMedia";
import { allFallbackRoutes, loadRouteRecords, RouteContentItem, RouteEvent, RouteRecord, saveRoute } from "@/lib/routesCms";

type Props = { mediaRows: CmsRow[]; refresh: () => void };
const emptyItem = (order: number): RouteContentItem => ({ id: `item-${Date.now()}`, title: "عنصر جديد", subtitle: "", description: "", imageUrl: "", buttonLabel: "", buttonUrl: "", visible: true, order });
const emptyEvent = (order: number): RouteEvent => ({ id: `event-${Date.now()}`, date: "", title: "موعد جديد", description: "", visible: true, order });

/* Official poster and oral presentation requirements */

const posterDefaultRequirements = [
  "يجب أن يكون البحث في أحد المجالات الصحية أو المرتبطة بالتخصصات الصحية، وأن يكون أصليًا وذا أهداف ونتائج واضحة.",

  "المشاركة متاحة لطلاب وطالبات التخصصات الصحية من الجامعات داخل المملكة العربية السعودية، ودول الخليج، والدول الأخرى.",

  "يجب ألا يتجاوز ملخص البحث 500 كلمة، وأن يتضمن الأهداف والمنهجية والنتائج والاستنتاج.",

  "يجب الالتزام بالدقة العلمية واللغوية والإملائية، وتوثيق المحتوى والمصادر وفق المتطلبات المعتمدة.",

  "يُسمح بمقدمين اثنين كحد أقصى للملصق البحثي (Poster)، ومقدم واحد للعرض الشفهي (Oral).",

  "تخضع جميع المشاركات للتحكيم وفق المعايير المعتمدة، ويُمنح الفائزون شهادتين: شهادة للمقدم وشهادة للبحث.",

  "يلتزم المقدم أو المقدمان بالحضور في الموعد والمكان المحددين لتقديم البحث.",

  "يجب الالتزام بجميع تعليمات المسابقة ومتطلبات التقديم والقوالب والمواعيد النهائية المحددة.",

  "يجب أن يتطابق المحتوى المعروض مع النسخة النهائية المقدمة، ولا يُسمح بإجراء أي تعديلات بعد الموعد النهائي.",

  "الالتزام بحضور جميع أيام المنافسة المحددة للمسار والحفل الختامي."
];

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={wide ? "route-field route-field--wide" : "route-field"}><span>{label}</span>{children}</label>; }
function OrderActions({ visible, onToggle, onUp, onDown, onDelete }: { visible: boolean; onToggle: () => void; onUp: () => void; onDown: () => void; onDelete: () => void }) { return <div className="route-row-actions"><button onClick={onUp} title="أعلى"><ArrowUp size={14} /></button><button onClick={onDown} title="أسفل"><ArrowDown size={14} /></button><button onClick={onToggle} title={visible ? "إخفاء" : "إظهار"}>{visible ? <EyeOff size={14} /> : <Eye size={14} />}</button><button className="danger" onClick={onDelete} title="حذف"><Trash2 size={14} /></button></div>; }

export default function AdminRoutes({ mediaRows, refresh }: Props) {
  const [routes, setRoutes] = useState<RouteRecord[]>([]); const [selectedSlug, setSelectedSlug] = useState(""); const [draft, setDraft] = useState<RouteRecord | null>(null); const [tab, setTab] = useState<"details" | "content" | "timeline" | "requirements">("details"); const [busy, setBusy] = useState(false); const media = useMemo(() => mediaRows.map((row) => ({ label: String(row.alt_text ?? row.name ?? "ملف"), url: mediaUrl(row) })).filter((item) => item.url), [mediaRows]);
  const reload = async () => { const next = await loadRouteRecords(); setRoutes(next); if (!selectedSlug && next[0]) { setSelectedSlug(next[0].slug); setDraft(next[0]); } else if (selectedSlug) { const current = next.find((item) => item.slug === selectedSlug); if (current) setDraft(current); } };
  useEffect(() => { void reload(); }, []);

const choose = (route: RouteRecord) => {
  const next = structuredClone(route);

  const isPoster = next.title.includes("الملصقات");

  // Add poster requirements only if none exist
  if (isPoster && !next.requirements?.length) {
    next.requirements = posterDefaultRequirements.map(
      (text, index) => ({
        id: `poster-requirement-${index + 1}`,
        text,
        visible: true,
        order: index
      })
    );
  }

  setSelectedSlug(next.slug);
  setDraft(next);
  setTab(isPoster ? "requirements" : "details");
};

  const update = (patch: Partial<RouteRecord>) => setDraft((current) => current ? { ...current, ...patch } : current);
  const save = async (publish: boolean) => { if (!draft) return; setBusy(true); try {
 await saveRoute({ ...draft, published: publish }, publish); toast.success(publish ? "تم نشر المسار" : "تم حفظ مسودة المسار"); await reload(); refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر حفظ المسار"); } finally { setBusy(false); } };
  const create = () => { const base = allFallbackRoutes()[0]; const next = { ...base, slug: `custom-${Date.now()}`, title: "مسار جديد", eyebrow: "07", description: "وصف المسار الجديد", details: "تفاصيل المسار الجديد", imageUrl: media[0]?.url || base.imageUrl, contentItems: [], events: [], published: false }; setRoutes((current) => [...current, next]); choose(next); };
  const changeItem = (index: number, patch: Partial<RouteContentItem>) => update({ contentItems: (draft?.contentItems ?? []).map((item, i) => i === index ? { ...item, ...patch } : item) });
  const move = <T,>(list: T[], index: number, direction: number) => { const next = [...list]; const target = index + direction; if (!next[target]) return next; [next[index], next[target]] = [next[target], next[index]]; return next; };
  const contentItems = draft?.contentItems ?? []; const events = draft?.events ?? []; const requirements = draft?.requirements ?? [];
  return <section className="admin-panel routes-admin-panel"><div className="admin-panel-head"><div><small>إدارة المحتوى العام</small><h2>المسارات</h2><p></p></div><div className="route-save-actions"><button onClick={() => save(false)} disabled={busy || !draft}><Save size={15} /> حفظ المسودة</button><button className="primary" onClick={() => save(true)} disabled={busy || !draft}><Send size={15} /> نشر المسار</button></div></div><div className="routes-layout"><aside className="routes-list"><div className="routes-list-head"><div><b>المسارات الحالية</b><small>{routes.length} مسارات</small></div><button className="primary" onClick={create}><Plus size={14} /> إضافة مسار</button></div>{routes.map((route) => <button key={route.slug} className={route.slug === selectedSlug ? "route-list-card selected" : "route-list-card"} onClick={() => choose(route)}><span className={`route-list-thumb route-tone--${route.tone}`}>{route.imageUrl ? <img src={route.imageUrl} alt="" /> : <ImagePlus size={18} />}</span><span><b>{route.title}</b><small>{route.slug === "research-opportunities" ? "مواعيد وتواريخ" : "محتوى المسار"}</small></span><i className={route.visible ? "status on" : "status"}>{route.visible ? "ظاهر" : "مخفي"}</i></button>)}</aside>{draft ? <div className="route-editor"><div className="route-editor-head"><div><small>محرر المسار</small><h3>{draft.title}</h3><p>تم حفظ آخر نسخة: {draft.published ? "منشورة" : "مسودة"}</p></div><label className="route-visible-toggle"><input type="checkbox" checked={draft.visible} onChange={(e) => update({ visible: e.target.checked })} /> إظهار المسار</label></div><div className="route-tabs"><button className={tab === "details" ? "active" : ""} onClick={() => setTab("details")}>بيانات المسار</button><button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}>المحتوى</button>{true && <><button className={tab === "timeline" ? "active" : ""} onClick={() => setTab("timeline")}>المواعيد</button><button className={tab === "requirements" ? "active" : ""} onClick={() => setTab("requirements")}>شروط المشاركة</button></>}</div>{tab === "details" && <div className="route-editor-grid"><Field label="اسم المسار"><input value={draft.title} onChange={(e) => update({ title: e.target.value })} /></Field><Field label="الرقم التعريفي الظاهر"><Field label="معرّف المسار (Slug)">
  <input
    dir="ltr"
    value={draft.slug}
    readOnly
  />
</Field><input value={draft.eyebrow} onChange={(e) => update({ eyebrow: e.target.value })} /></Field><Field label="العنوان التفصيلي"><input value={draft.details} onChange={(e) => update({ details: e.target.value })} /></Field><Field label="النغمة البصرية"><select value={draft.tone} onChange={(e) => update({ tone: e.target.value })}><option value="mint">نعناعي</option><option value="blue">أزرق</option><option value="sand">رملي</option><option value="ink">داكن</option></select></Field><Field label="الوصف المختصر" wide><textarea rows={3} value={draft.description} onChange={(e) => update({ description: e.target.value })} /></Field><Field label="التفاصيل الكاملة" wide><textarea rows={4} value={draft.details} onChange={(e) => update({ details: e.target.value })} /></Field><Field label="الصورة"><select value={draft.imageUrl} onChange={(e) => update({ imageUrl: e.target.value })}><option value="">الصورة الحالية</option>{media.map((asset) => <option key={asset.url} value={asset.url}>{asset.label}</option>)}</select></Field><Field label="ترتيب المسار"><input type="number" value={draft.order} onChange={(e) => update({ order: Number(e.target.value) })} /></Field><Field label="عنوان زر الدعوة"><input value={draft.ctaLabel} onChange={(e) => update({ ctaLabel: e.target.value })} /></Field><Field label="رابط الزر" wide><input dir="ltr" value={draft.ctaUrl} onChange={(e) => update({ ctaUrl: e.target.value })} /></Field><Field label="عنوان الدعوة"><input value={draft.ctaTitle} onChange={(e) => update({ ctaTitle: e.target.value })} /></Field><Field label="وصف الدعوة"><input value={draft.ctaDescription} onChange={(e) => update({ ctaDescription: e.target.value })} /></Field><Field label="النقاط البارزة" wide><div className="route-highlights">{draft.highlights.map((highlight, index) => <div key={index}><input value={highlight} onChange={(e) => update({ highlights: draft.highlights.map((item, i) => i === index ? e.target.value : item) })} /><button onClick={() => update({ highlights: draft.highlights.filter((_, i) => i !== index) })}><Trash2 size={13} /></button></div>)}<button className="route-add-inline" onClick={() => update({ highlights: [...draft.highlights, "نقطة جديدة"] })}><Plus size={13} /> إضافة نقطة</button></div></Field></div>}{tab === "content" && <div className="route-content-editor"><div className="route-content-head"><div><h4>عناصر محتوى المسار</h4><p>أضف العناوين والأوصاف والأزرار والصور من منتقي الوسائط.</p></div><button className="primary" onClick={() => update({ contentItems: [...contentItems, emptyItem(contentItems.length)] })}><Plus size={14} /> إضافة عنصر</button></div>{contentItems.length === 0 ? <div className="admin-empty"><ImagePlus size={28} /><h3>لا توجد عناصر مخصصة</h3><p>المسار يستخدم حالياً محتواه الأساسي. أضف عناصر إضافية عند الحاجة.</p></div> : contentItems.map((item, index) => <article className={`route-content-card ${item.visible ? "" : "is-hidden"}`} key={item.id}><div className="route-content-card-head"><b>عنصر {index + 1}</b><OrderActions visible={item.visible} onToggle={() => changeItem(index, { visible: !item.visible })} onUp={() => update({ contentItems: move(contentItems, index, -1).map((x, i) => ({ ...x, order: i })) })} onDown={() => update({ contentItems: move(contentItems, index, 1).map((x, i) => ({ ...x, order: i })) })} onDelete={() => update({ contentItems: contentItems.filter((_, i) => i !== index) })} /></div><div className="route-editor-grid"><Field label="العنوان"><input value={item.title} onChange={(e) => changeItem(index, { title: e.target.value })} /></Field><Field label="العنوان الفرعي"><input value={item.subtitle} onChange={(e) => changeItem(index, { subtitle: e.target.value })} /></Field><Field label="الوصف" wide><textarea rows={3} value={item.description} onChange={(e) => changeItem(index, { description: e.target.value })} /></Field><Field label="الصورة"><select value={item.imageUrl} onChange={(e) => changeItem(index, { imageUrl: e.target.value })}><option value="">بدون صورة</option>{media.map((asset) => <option key={asset.url} value={asset.url}>{asset.label}</option>)}</select></Field><Field label="نص الزر"><input value={item.buttonLabel} onChange={(e) => changeItem(index, { buttonLabel: e.target.value })} /></Field><Field label="رابط الزر" wide><input dir="ltr" value={item.buttonUrl} onChange={(e) => changeItem(index, { buttonUrl: e.target.value })} /></Field></div></article>)}</div>}{tab === "timeline" && <div className="route-content-editor"><div className="route-content-head"><div><h4>مواعيد مسار الفرص البحثية</h4><p>أضف التاريخ والعنوان والوصف، ثم رتب المحطات قبل النشر.</p></div><button className="primary" onClick={() => update({ events: [...events, emptyEvent(events.length)] })}><Plus size={14} /> إضافة موعد</button></div>{events.map((event, index) => <article className={`route-content-card ${event.visible ? "" : "is-hidden"}`} key={event.id}><div className="route-content-card-head"><b>محطة {index + 1}</b><OrderActions visible={event.visible} onToggle={() => update({ events: events.map((x, i) => i === index ? { ...x, visible: !x.visible } : x) })} onUp={() => update({ events: move(events, index, -1).map((x, i) => ({ ...x, order: i })) })} onDown={() => update({ events: move(events, index, 1).map((x, i) => ({ ...x, order: i })) })} onDelete={() => update({ events: events.filter((_, i) => i !== index) })} /></div><div className="route-editor-grid"><Field label="التاريخ"><input value={event.date} onChange={(e) => update({ events: events.map((x, i) => i === index ? { ...x, date: e.target.value } : x) })} /></Field><Field label="عنوان الموعد"><input value={event.title} onChange={(e) => update({ events: events.map((x, i) => i === index ? { ...x, title: e.target.value } : x) })} /></Field><Field label="الوصف" wide><textarea rows={3} value={event.description} onChange={(e) => update({ events: events.map((x, i) => i === index ? { ...x, description: e.target.value } : x) })} /></Field></div></article>)}</div>}{tab === "requirements" && <div className="route-content-editor"><div className="route-content-head"><div><h4>شروط المشاركة</h4><p>أضف الشروط وعدّلها ورتّبها قبل نشر المسار.</p></div><button className="primary" onClick={() => update({ requirements: [...requirements, { id: `requirement-${Date.now()}`, text: "شرط جديد", visible: true, order: requirements.length }] })}><Plus size={14} /> إضافة شرط</button></div>{requirements.length === 0 ? <div className="admin-empty"><h3>لا توجد شروط</h3><p>أضف شروط المشاركة الخاصة بهذا المسار.</p></div> : requirements.map((requirement, index) => <article className={`route-content-card ${requirement.visible ? "" : "is-hidden"}`} key={requirement.id}><div className="route-content-card-head"><b>شرط {index + 1}</b><OrderActions visible={requirement.visible} onToggle={() => update({ requirements: requirements.map((x, i) => i === index ? { ...x, visible: !x.visible } : x) })} onUp={() => update({ requirements: move(requirements, index, -1).map((x, i) => ({ ...x, order: i })) })} onDown={() => update({ requirements: move(requirements, index, 1).map((x, i) => ({ ...x, order: i })) })} onDelete={() => update({ requirements: requirements.filter((_, i) => i !== index) })} /></div><div className="route-editor-grid"><Field label="نص الشرط" wide><textarea rows={3} value={requirement.text} onChange={(e) => update({ requirements: requirements.map((x, i) => i === index ? { ...x, text: e.target.value } : x) })} /></Field></div></article>)}</div>}</div> : <div className="admin-empty"><ImagePlus size={28} /><h3>اختر مساراً للبدء</h3></div>}</div></section>;
}
