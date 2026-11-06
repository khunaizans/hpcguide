import { getMediaUrl } from "@/lib/mediaUrl";
export type Pathway = {
  slug: string;
  eyebrow: string;
  title: string;
  image: string;
  tone: string;
  text: string;
  details: string;
  highlights: string[];
};

export const pathwayCards: Pathway[] = [
  {
    slug: "scientific-program",
    eyebrow: "01",
    title: "مسار البرنامج العلمي",
    image:"/images/pathway-scientific_9a22bedb.png",
    tone: "mint",
    text: "جلسات متخصصة وحوارات علمية تفتح أبواب المعرفة أمام المهتمين بالتخصصات الصحية.",
    details: "رحلة معرفية تجمع الخبراء والطلاب حول أحدث الأفكار والممارسات في التخصصات الصحية، عبر جلسات مركزة وحوارات تفاعلية.",
    highlights: ["جلسات علمية متخصصة", "حوارات مع الخبراء", "تجارب معرفية قابلة للتطبيق"],
  },
  {
    slug: "posters-research",
    eyebrow: "02",
    title: "مسار الملصقات والعروض الشفهية",
    image: getMediaUrl("/manus-storage/pathway-research_fcb2cb35.png"),
    tone: "blue",
    text: "مساحة لعرض الأفكار والنتائج البحثية أمام مجتمع متعدد التخصصات.",
    details: "منصة تتيح للباحثين مشاركة أفكارهم ونتائجهم مع مجتمع متنوع، وتحويل البحث إلى حوار يفتح فرصاً جديدة للتعاون.",
    highlights: ["عرض الملصقات البحثية", "مراجعة وتبادل الملاحظات", "تواصل مع مجتمع بحثي متنوع"],
  },
  {
    slug: "scientific-debates",
    eyebrow: "03",
    title: "مسار المناظرات العلمية",
    image: getMediaUrl("/manus-storage/pathway-debates_7b0de934.png"),
    tone: "sand",
    text: "تجربة تفاعلية تطوّر مهارات التفكير النقدي والحوار المبني على الدليل.",
    details: "مساحة حية للتفكير النقدي ومناقشة القضايا الصحية المعاصرة بأسلوب واضح، متوازن، ومبني على الدليل.",
    highlights: ["قضايا صحية معاصرة", "تفكير نقدي وحوار", "تجربة تنافسية تفاعلية"],
  },
  {
    slug: "research-opportunities",
    eyebrow: "04",
    title: "مسار الفرص البحثية",
    image: "/images/pathway-presentations_13b4274a.png",
    tone: "ink",
    text: "لقاء بين الباحثين والطلاب لاكتشاف فرص جديدة للتعاون والتطوير.",
    details: "تعرّف على مساحات التعاون والفرص التي تساعدك على تحويل فضولك البحثي إلى مشروع وخطوة عملية قادمة.",
    highlights: ["فرص تعاون بحثي", "لقاء مع الباحثين", "مسارات للتطوير"],
  },
  {
    slug: "clinical-skills",
    eyebrow: "05",
    title: "مسار المهارات الإكلينيكية",
    image: getMediaUrl("/manus-storage/pathway-clinical_0e1991a2.png"),
    tone: "mint",
    text: "تطبيقات عملية تصقل المهارات السريرية ضمن بيئة تعليمية محفّزة.",
    details: "تجربة تطبيقية تضع المهارات السريرية في سياق واقعي، وتمنحك مساحة للتعلم بالممارسة والتغذية الراجعة.",
    highlights: ["تطبيقات عملية", "تعلم بالممارسة", "بيئة تدريبية محفّزة"],
  },
  {
    slug: "3mt",
    eyebrow: "06",
    title: "مسار 3MT",
    image: getMediaUrl("/manus-storage/pathway-data_b1c3b631.png"),
    tone: "blue",
    text: "حوّل بحثك إلى قصة قصيرة، واضحة، وملهمة تصل إلى الجميع.",
    details: "تحدٍ يساعدك على اختصار بحثك في قصة مؤثرة يفهمها الجميع، ويمنحك الثقة لتقديم فكرتك بصوت واضح.",
    highlights: ["تبسيط الأفكار المعقدة", "عرض قصير ومؤثر", "تطوير مهارات الإلقاء"],
  },
];

export function getPathway(slug: string) {
  return pathwayCards.find((pathway) => pathway.slug === slug);
}
