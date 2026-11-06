import { locations } from "@/lib/locations";
import { pathwayCards } from "@/lib/pathways";
import { supabase } from "@/lib/supabase";

export type HomeQuestion = { label: string; answer: string };
export type HomePathway = { slug: string; eyebrow: string; title: string; image: string; tone: string; text: string; details: string; highlights: string[]; link_url: string };
export type HomeLocation = { slug: string; title: string; image: string; description: string; link_url: string };
export type HomeContent = {
  visibility: { hero: boolean; about: boolean; pathways: boolean; assistant: boolean; resources: boolean };
  hero: { kicker: string; titleLead: string; titleAccent: string; description: string; topRight: string; topLeft: string; image: string; imageAlt: string };
  about: { eyebrow: string; titleLine1: string; titleLine2: string; description: string; visionLabel: string; visionTitle: string; visionText: string; missionLabel: string; missionTitle: string; missionText: string };
  pathways: { eyebrow: string; titleLine1: string; titleLine2: string; description: string; cards: HomePathway[] };
  assistant: { eyebrow: string; titleLine1: string; titleLine2: string; description: string; botName: string; botStatus: string; note: string; questions: HomeQuestion[]; welcome: string; userMessage: string; botReply: string; placeholder: string };
  resources: { eyebrow: string; titleLine1: string; titleLine2: string; description: string; cards: HomeLocation[] };
};

export const fallbackHomeContent: HomeContent = {
  visibility: { hero: true, about: true, pathways: true, assistant: false, resources: true },
  hero: { kicker: "المعرفة تتحول إلى أثر", titleLead: "دليلك داخل", titleAccent: "HPC", description: "رحلة تفاعلية بين البحث، الابتكار، والمهارات التي تصنع مستقبل الرعاية الصحية.", topRight: "HPC / 2027", topLeft: "مؤتمر التخصصات الصحية", image: "/images/hpc-hero_4791d5fd.png", imageAlt: "فريق من المختصين الصحيين يعملون معاً" },
  about: { eyebrow: "عن المؤتمر", titleLine1: "حين يجتمع", titleLine2: "العلم بالأثر", description: "مؤتمر التخصصات الصحية مساحة تُقرّب المسافة بين الفكرة وتطبيقها، وبين المتعلم والممارس، وبين البحث واحتياج الإنسان.", visionLabel: "رؤية المؤتمر", visionTitle: "منصة وطنية رائدة في البحث والتطوير الصحي.", visionText: "نسهم في دعم صحة الإنسان وتعزيز جودة الحياة في المملكة من خلال مجتمع يتعلم باستمرار.", missionLabel: "رسالة المؤتمر", missionTitle: "تعزيز مكانة البحث العلمي في التخصصات الصحية.", missionText: "بيئة علمية وتفاعلية تجمع الطلاب والممارسين والخبراء، وتسهم في تطوير القطاع الصحي واستدامته." },
  pathways: { eyebrow: "المسارات", titleLine1: "اختر مساحتك", titleLine2: "في الحكاية", description: "لكل فضول مسار. استكشف البرامج التي صُممت لتمنحك معرفة قابلة للتطبيق، وتجربة تبقى معك.", cards: pathwayCards.map((card) => ({ slug: card.slug, eyebrow: card.eyebrow, title: card.title, image: card.image, tone: card.tone, text: card.text, details: card.details, highlights: card.highlights, link_url: `/pathways/${card.slug}` })) },
  assistant: { eyebrow: "المساعد", titleLine1: "عندك", titleLine2: "سؤال؟", description: "مساعدك السريع للتعرف على المؤتمر، مساراته، وتجربة المشاركة فيه.", botName: "مساعد HPC", botStatus: "متاح الآن للإجابة", note: "يمكن تطوير هذا المساعد ليتصل بمصدر معرفة أو نموذج ذكاء اصطناعي مستقبلاً.", questions: [{ label: "ما هو مؤتمر التخصصات الصحية؟", answer: "هو منصة علمية تجمع طلاب التخصصات الصحية والممارسين والخبراء لتبادل المعرفة وبناء مستقبل صحي أكثر ابتكاراً." }, { label: "ما هي مسارات المؤتمر؟", answer: "يضم المؤتمر ثلاثة مسارات رئيسية: البرنامج العلمي، الملصقات والعروض البحثية، والمناظرات العلمية." }, { label: "كيف يمكنني المشاركة؟", answer: "اختر المسار الأنسب لك، ثم تابع تفاصيل التسجيل والمواعيد من صفحة البرنامج عند فتح التسجيل." }, { label: "أين يقام المؤتمر؟", answer: "تُعلن تفاصيل الموقع والجدول النهائي ضمن التحديثات الرسمية للمؤتمر." }], welcome: "مرحباً بك! أنا مساعد مؤتمر التخصصات الصحية. كيف أستطيع مساعدتك؟", userMessage: "أرغب في معرفة المزيد عن المؤتمر", botReply: "يسعدني ذلك. اختر سؤالك من القائمة أو اكتب سؤالك مباشرة.", placeholder: "...أكتب سؤال" },
  resources: { eyebrow: "دليل المكان", titleLine1: "كل ما تحتاجه", titleLine2: "في طريقك", description: "معلومات سريعة تساعدك على الوصول، التنقل، واكتشاف ما حولك أثناء المؤتمر.", cards: locations.map((location) => ({ slug: location.slug, title: location.title, image: location.image, description: location.description, link_url: `/locations/${location.slug}` })) },
};

type Row = Record<string, unknown>;
const text = (row: Row | undefined, key: string, fallback: string) => {
  if (row?.is_visible === false) return "";
  return typeof row?.[key] === "string" ? String(row[key]) : fallback;
};
const visible = (row: Row | undefined) => row?.is_visible !== false;
const byName = (items: Row[], name: string) => items.find((item) => item.name === name);

export function mapHomeContent(sections: Row[], items: Row[]): HomeContent {
  const section = (name: string) => sections.find((item) => item.name === name);
const sectionItems = (name: string) =>
  items
    .filter((item) => item.section_id === section(name)?.id)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  const heroItems = sectionItems("hero");
  const aboutItems = sectionItems("about");
  const pathwayItems = sectionItems("pathways");
  const assistantItems = sectionItems("assistant");
  const resourceItems = sectionItems("resources");
  const hero = fallbackHomeContent.hero;
  const about = fallbackHomeContent.about;
  const pathways = fallbackHomeContent.pathways;
  const assistant = fallbackHomeContent.assistant;
  const resources = fallbackHomeContent.resources;
  const item = (rows: Row[], name: string) => byName(rows, name);
  const h = (name: string) => item(heroItems, name);
  const a = (name: string) => item(aboutItems, name);
  const p = (name: string) => item(pathwayItems, name);
  const q = (name: string) => item(assistantItems, name);
  const r = (name: string) => item(resourceItems, name);
  const next = structuredClone(fallbackHomeContent) as HomeContent;
  next.visibility = { hero: section("hero")?.is_visible !== false, about: section("about")?.is_visible !== false, pathways: section("pathways")?.is_visible !== false, assistant: section("assistant")?.is_visible !== false, resources: section("resources")?.is_visible !== false };
  next.hero = { kicker: text(h("kicker"), "title", hero.kicker), titleLead: text(h("title-lead"), "title", hero.titleLead), titleAccent: text(h("title-accent"), "title", hero.titleAccent), description: text(h("description"), "description", hero.description), topRight: text(h("top-right"), "title", hero.topRight), topLeft: text(h("top-left"), "title", hero.topLeft), image: text(h("image"), "image_url", hero.image), imageAlt: text(h("image"), "alt_text", hero.imageAlt) };
  next.about = { eyebrow: text(a("eyebrow"), "title", about.eyebrow), titleLine1: text(a("title-line-1"), "title", about.titleLine1), titleLine2: text(a("title-line-2"), "title", about.titleLine2), description: text(a("description"), "description", about.description), visionLabel: text(a("vision-label"), "title", about.visionLabel), visionTitle: text(a("vision-title"), "title", about.visionTitle), visionText: a("vision-text")?.is_visible === false
  ? ""
  : text(a("vision-text"), "description", about.visionText), missionLabel: text(a("mission-label"), "title", about.missionLabel), missionTitle: text(a("mission-title"), "title", about.missionTitle), missionText: text(a("mission-text"), "description", about.missionText) };
  next.pathways = { eyebrow: text(p("eyebrow"), "title", pathways.eyebrow), titleLine1: text(p("title-line-1"), "title", pathways.titleLine1), titleLine2: text(p("title-line-2"), "title", pathways.titleLine2), description: text(p("description"), "description", pathways.description), cards: pathways.cards };
  next.pathways.cards = pathwayItems.filter((row) => String(row.name ?? "").startsWith("card-")).map((row, index) => { const fallback = pathways.cards[index] ?? pathways.cards[0]; return { ...fallback, slug: text(row, "slug", fallback.slug), eyebrow: text(row, "subtitle", fallback.eyebrow), title: text(row, "title", fallback.title), text: text(row, "description", fallback.text), image: text(row, "image_url", fallback.image), link_url: text(row, "link_url", fallback.link_url), tone: fallback.tone }; });
  if (!next.pathways.cards.length) next.pathways.cards = pathways.cards;
  next.assistant = { ...assistant, eyebrow: text(q("eyebrow"), "title", assistant.eyebrow), titleLine1: text(q("title-line-1"), "title", assistant.titleLine1), titleLine2: text(q("title-line-2"), "title", assistant.titleLine2), description: text(q("description"), "description", assistant.description), botName: text(q("bot-name"), "title", assistant.botName), botStatus: text(q("bot-status"), "title", assistant.botStatus), note: text(q("note"), "description", assistant.note), welcome: text(q("welcome"), "description", assistant.welcome), userMessage: text(q("user-message"), "description", assistant.userMessage), botReply: text(q("bot-reply"), "description", assistant.botReply), placeholder: text(q("placeholder"), "title", assistant.placeholder), questions: assistant.questions };
  const questionRows = assistantItems.filter((row) => String(row.name ?? "").startsWith("question-"));
  if (questionRows.length) next.assistant.questions = questionRows.map((row, index) => ({ label: text(row, "title", assistant.questions[index]?.label ?? "سؤال"), answer: text(row, "description", assistant.questions[index]?.answer ?? "") }));
  next.resources = { eyebrow: text(r("eyebrow"), "title", resources.eyebrow), titleLine1: text(r("title-line-1"), "title", resources.titleLine1), titleLine2: text(r("title-line-2"), "title", resources.titleLine2), description: text(r("description"), "description", resources.description), cards: resources.cards };
  next.resources.cards = resourceItems
.filter(
  (row) =>
    String(row.name ?? "").startsWith("card-") &&
    row.is_visible !== false
)

.map((row) => {
  const cardNumber = Number(
    String(row.name ?? "").replace("card-", "")
  );

  const fallback = resources.cards[cardNumber - 1];

  const linkUrl = text(
    row,
    "link_url",
    fallback?.link_url ?? ""
  );

  return {
    slug: text(
      row,
      "slug",
      linkUrl.split("/").filter(Boolean).pop() ||
        fallback?.slug ||
        String(row.name)
    ),
    title: text(row, "title", fallback?.title ?? ""),
    image: text(row, "image_url", fallback?.image ?? ""),
    description: text(
      row,
      "description",
      fallback?.description ?? ""
    ),
    link_url: linkUrl,
  };
});

  return next;
}

async function ensure(table: string, match: Row, values: Row) {
  if (!supabase) throw new Error("اتصال Supabase غير مهيأ");
  const { data: existing, error: findError } = await supabase.from(table).select("*").match(match).limit(1).maybeSingle();
  if (findError) throw new Error(findError.message);
if (existing?.id) {
  return existing as Row;
}
  const { data, error } = await supabase.from(table).insert({ ...match, ...values }).select().single();
  if (error) throw new Error(error.message);
  return data as Row;
}

const itemValues = (sectionId: unknown, name: string, values: Row) => ({ section_id: sectionId, name, is_visible: true, sort_order: values.sort_order ?? 0, ...values });

export async function migrateHomepage() {
  if (!supabase) throw new Error("اتصال Supabase غير مهيأ");
  const page = await ensure("pages", { slug: "home" }, { title: "الرئيسية", name: "home", is_visible: true, sort_order: 1 });
  const sectionDefs = [{ name: "hero", title: "الرئيسية · المقدمة", order: 1 }, { name: "about", title: "الرئيسية · عن المؤتمر", order: 2 }, { name: "pathways", title: "الرئيسية · المسارات", order: 3 }, { name: "assistant", title: "الرئيسية · المساعد", order: 4 }, { name: "resources", title: "الرئيسية · دليل المكان", order: 5 }];
  const sections: Record<string, Row> = {};
  for (const def of sectionDefs) sections[def.name] = await ensure("sections", { page_id: page.id, name: def.name }, { title: def.title, is_visible: true, sort_order: def.order });
  const add = async (section: string, name: string, values: Row) => { await ensure("items", { section_id: sections[section].id, name }, itemValues(sections[section].id, name, values)); };
  const h = fallbackHomeContent.hero; for (const [name, values] of Object.entries({ kicker: { title: h.kicker, sort_order: 1 }, "title-lead": { title: h.titleLead, sort_order: 2 }, "title-accent": { title: h.titleAccent, sort_order: 3 }, description: { description: h.description, sort_order: 4 }, "top-right": { title: h.topRight, sort_order: 5 }, "top-left": { title: h.topLeft, sort_order: 6 }, image: { image_url: h.image, alt_text: h.imageAlt, sort_order: 7 } })) await add("hero", name, values);
  const a = fallbackHomeContent.about; for (const [name, values] of Object.entries({ eyebrow: { title: a.eyebrow, sort_order: 1 }, "title-line-1": { title: a.titleLine1, sort_order: 2 }, "title-line-2": { title: a.titleLine2, sort_order: 3 }, description: { description: a.description, sort_order: 4 }, "vision-label": { title: a.visionLabel, sort_order: 5 }, "vision-title": { title: a.visionTitle, sort_order: 6 }, "vision-text": { description: a.visionText, sort_order: 7 }, "mission-label": { title: a.missionLabel, sort_order: 8 }, "mission-title": { title: a.missionTitle, sort_order: 9 }, "mission-text": { description: a.missionText, sort_order: 10 } })) await add("about", name, values);
  const p = fallbackHomeContent.pathways; for (const [name, values] of Object.entries({ eyebrow: { title: p.eyebrow, sort_order: 1 }, "title-line-1": { title: p.titleLine1, sort_order: 2 }, "title-line-2": { title: p.titleLine2, sort_order: 3 }, description: { description: p.description, sort_order: 4 } })) await add("pathways", name, values); for (let index = 0; index < p.cards.length; index += 1) { const card = p.cards[index]; await add("pathways", `card-${index + 1}`, { title: card.title, subtitle: card.eyebrow, description: card.text, image_url: card.image, link_url: `/pathways/${card.slug}`, sort_order: 10 + index }); }
  const q = fallbackHomeContent.assistant; for (const [name, values] of Object.entries({ eyebrow: { title: q.eyebrow, sort_order: 1 }, "title-line-1": { title: q.titleLine1, sort_order: 2 }, "title-line-2": { title: q.titleLine2, sort_order: 3 }, description: { description: q.description, sort_order: 4 }, "bot-name": { title: q.botName, sort_order: 5 }, "bot-status": { title: q.botStatus, sort_order: 6 }, note: { description: q.note, sort_order: 7 }, welcome: { description: q.welcome, sort_order: 8 }, "user-message": { description: q.userMessage, sort_order: 9 }, "bot-reply": { description: q.botReply, sort_order: 10 }, placeholder: { title: q.placeholder, sort_order: 11 } })) await add("assistant", name, values); for (let index = 0; index < q.questions.length; index += 1) { const question = q.questions[index]; await add("assistant", `question-${index + 1}`, { title: question.label, description: question.answer, sort_order: 20 + index }); }
  const r = fallbackHomeContent.resources; for (const [name, values] of Object.entries({ eyebrow: { title: r.eyebrow, sort_order: 1 }, "title-line-1": { title: r.titleLine1, sort_order: 2 }, "title-line-2": { title: r.titleLine2, sort_order: 3 }, description: { description: r.description, sort_order: 4 } })) await add("resources", name, values); for (let index = 0; index < r.cards.length; index += 1) { const card = r.cards[index]; await add("resources", `card-${index + 1}`, { title: card.title, description: card.description, image_url: card.image, link_url: `/locations/${card.slug}`, sort_order: 10 + index }); }
const mediaAssets = [
  { name: "hpc-hero", path: "/manus-storage/hpc-hero_4791d5fd.png" },
  { name: "hpc-logo", path: "/images/hpc-logo_739bab33.png" },
  ...pathwayCards.map((card) => ({ name: card.title, path: card.image })),
  ...r.cards.map((card) => ({ name: card.title, path: card.image }))
];
  for (const asset of mediaAssets) await ensure("media", { name: asset.path }, { alt_text: asset.name });
  return { page, sections };
}
