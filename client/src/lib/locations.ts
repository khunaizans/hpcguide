export type Location = {
  slug: string;
  title: string;
  image: string;
  description: string;
  details: string;
  highlights: string[];
};

export const locations: Location[] = [
  {
    slug: "administrative-tower",
    title: "البرج الإداري",
    image: "/images//images/",
    description: "نقطة الوصول الرئيسية للمؤتمر ومركز الخدمات الإدارية.",
    details: "استخدم هذا الدليل للوصول إلى البرج الإداري، والتعرّف على نقطة الاستقبال والخدمات التي تساعدك منذ لحظة وصولك.",
    highlights: ["نقطة الاستقبال الرئيسية", "خدمات وإرشادات الزوار", "معلومات التسجيل والدعم"],
  },
  {
    slug: "postgraduate-studies",
    title: "الدراسات العليا",
    image: "/images/postgraduate-building_d0f7d595.png",
    description: "مساحة أكاديمية للتعلّم، البحث، وبناء الخطوة القادمة.",
    details: "تعرّف على مبنى الدراسات العليا والمساحات الأكاديمية القريبة من فعاليات المؤتمر، حيث تتحول المعرفة إلى فرص جديدة.",
    highlights: ["المساحات الأكاديمية", "البرامج والفرص البحثية", "بيئة للتعلم والتطوير"],
  },
  {
    slug: "nearby-facilities",
    title: "المرافق المجاورة",
    image: "/images/nearby-map_c38385fb.png",
    description: "خريطة سريعة لما يحيط بموقع المؤتمر من مرافق وخدمات.",
    details: "استكشف المرافق المجاورة التي تساعدك على التنقل براحة أكبر، وخطط مسارك بين الجلسات والوجهات القريبة.",
    highlights: ["خريطة للمرافق القريبة", "وجهات وخدمات مساندة", "تنقل أسهل بين المواقع"],
  },
  {
    slug: "parking",
    title: "مواقف السيارات",
    image: "/images/parking_91b91608.png",
    description: "إرشادات مختصرة تساعدك على الوصول إلى مواقف السيارات.",
    details: "خطط لوصولك بسلاسة عبر معرفة مسارات الدخول ومناطق الوقوف القريبة من موقع المؤتمر.",
    highlights: ["مسارات وصول واضحة", "مواقف قريبة من الموقع", "وصول أكثر سلاسة"],
  },

{
  slug: "clinical-simulation-center",
  title: "مركز المحاكاة السريرية",
  image: "",
  description: "تعرّف على مركز المحاكاة السريرية ومرافقه التعليمية.",
  details:
    "استكشف مركز المحاكاة السريرية ودوره في دعم التعليم والتدريب العملي في بيئة تعليمية تفاعلية.",
  highlights: [
    "التدريب بالمحاكاة السريرية",
    "تطوير المهارات العملية",
    "التعليم والتدريب الصحي",
  ],
},

];

export function getLocation(slug: string) {
  return locations.find((location) => location.slug === slug);
}
