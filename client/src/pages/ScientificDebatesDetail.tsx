
import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  loadPublishedRoute,
  routeToPathway,
  type RouteRecord,
} from "@/lib/routesCms";

import { getPathway } from "@/lib/pathways";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./ScientificDebatesDetail.css";
import { Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import { getMediaUrl } from "@/lib/mediaUrl";

type PosterTimelineEvent = {
  date: string;
  title: string;
};

function PosterTimeline({ events }: { events: PosterTimelineEvent[] }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const eventRefs = useRef<Array<HTMLLIElement | null>>([]);


useEffect(() => {

const updateTimeline = () => {
  const viewportHeight = window.innerHeight;
  const isMobile = window.innerWidth <= 760;


if (isMobile) {
  const hasScrolled = window.scrollY > 40;

  const count = hasScrolled
    ? eventRefs.current
        .slice(0, events.length)
        .filter(
          (element) =>
            element &&
            element.getBoundingClientRect().top <
              viewportHeight * 0.78
        ).length
    : 0;

  setVisibleCount(count);
  return;
}


  // Keep the existing desktop animation
  const firstEvent = eventRefs.current[0];
  if (!firstEvent) return;

  const top = firstEvent.getBoundingClientRect().top;

  const start = viewportHeight * 0.95;
  const end = viewportHeight * 0.70;

  const progress = Math.max(
    0,
    Math.min(1, (start - top) / (start - end))
  );

  setVisibleCount(Math.ceil(progress * events.length));
};

  window.addEventListener("scroll", updateTimeline, {
    passive: true,
  });
  window.addEventListener("resize", updateTimeline);

  updateTimeline();

  return () => {
    window.removeEventListener("scroll", updateTimeline);
    window.removeEventListener("resize", updateTimeline);
  };
}, [events.length]);


  return (
    <ol
      className="research-timeline"
      style={{
        "--research-progress": `${
          events.length
            ? Math.min(100, (visibleCount / events.length) * 100)
            : 0
        }%`,
      } as CSSProperties}
    >
      {events.map((event, index) => (
        <li
          ref={(node) => {
            eventRefs.current[index] = node;
          }}
          data-index={index}
          className={`research-timeline__event ${
            index < visibleCount ? "is-visible" : ""
          }`}
          key={`${event.date}-${event.title}-${index}`}
        >
          <div className="research-timeline__marker">
            <span>{String(index + 1).padStart(2, "0")}</span>
          </div>

          <div className="research-timeline__copy">
            <time>{event.date}</time>
            <h3>{event.title}</h3>
          </div>
        </li>
      ))}
    </ol>
  );
}


export default function ScientificDebatesDetail() {
  const [route, setRoute] = useState<RouteRecord | null>(null);

  useEffect(() => {
    let active = true;

    loadPublishedRoute("scientific-debates").then((data) => {
      if (active) setRoute(data ?? null);
    });

    return () => {
      active = false;
    };
  }, []);



const previewEvents = [
  ["27 ديسمبر 2026", "بداية التسجيل"],
  ["10 مارس 2027", "انتهاء التسجيل"],
  ["15 مارس 2027", "إعلان القبول"],
  ["11–12 أبريل 2027", "منافسات دوري 16 افتراضية"],
  ["17–18 أبريل 2027", "منافسات دوري 8 افتراضية"],
  ["18 أبريل 2027", "منافسات نصف النهائي حضورية"],
  ["18 أبريل 2027", "المناظرة النهائية حضورية"],
  ["19 أبريل 2027", "الحفل الختامي وإعلان الفائزين"],
].map(([date, title], index) => ({
  id: `preview-${index}`,
  date,
  title,
  description: "",
  visible: true,
  order: index,
}));


const timelineEvents = [
  ...(import.meta.env.DEV && !route?.events?.length
    ? previewEvents
    : route?.events ?? []),
]
  .filter((event) => event.visible)
  .sort((a, b) => a.order - b.order);




const previewRequirements = [
  "التسجيل كفريق مكوّن من 3 طلاب من التخصصات الصحية، جميعهم من جامعة واحدة معتمدة داخل المملكة.",
  "عدم تكرار الأعضاء بين الفرق.",
  "الالتزام بالحضور إلى مدينة الرياض للمراحل النهائية.",
  "يمنع استخدام أي أدوات أو أجهزة مساعدة خارج الوسائل المتاحة في المرحلة الثالثة من المسابقة.",
].map((text, index) => ({
  id: `preview-requirement-${index}`,
  text,
  visible: true,
  order: index,
}));

const participationRequirements = [
  ...(import.meta.env.DEV && !route?.requirements?.length
    ? previewRequirements
    : route?.requirements ?? []),
]
  .filter((item) => item.visible)
  .sort((a, b) => a.order - b.order);



useEffect(() => {
  const cards = document.querySelectorAll(
  ".scientific-debates-page .scientific-debates-requirements-heading h2, " +
  ".scientific-debates-page .scientific-debates-requirement, " +
  ".scientific-debates-page .scientific-debates-registration"
);
  if (!("IntersectionObserver" in window)) {
    cards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  cards.forEach((card) => observer.observe(card));

  return () => observer.disconnect();
}, [route]);


const debatesImage =
  (route ? routeToPathway(route).image : null) ||
  getPathway("scientific-debates")?.image;

const debatesImageSrc = getMediaUrl(debatesImage);

  return (
    <main className="scientific-debates-page" dir="rtl">
      <SiteHeader />



<section className="scientific-debates-hero">
  <div
    className="scientific-debates-hero-image"
    aria-hidden="true"
  >
    {debatesImageSrc && (
      <img src={debatesImageSrc} alt="" />
    )}
  </div>

  <div className="scientific-debates-hero-content">

<a
  href={`${import.meta.env.BASE_URL}#pathways`}
  className="detail-back hpc-pathways-back"
>
  <ArrowRight size={18} />
  الرجوع إلى المسارات
</a>

    <span className="scientific-debates-eyebrow">
      المسار 03
    </span>

    <h1>
      {route?.title || "مسار المناظرات العلمية"}
    </h1>

    <p className="scientific-debates-description">
      {route?.details || route?.description || ""}
    </p>
  </div>

  <div className="scientific-debates-visual" aria-hidden="true">
    <div className="scientific-debates-orbit" />
    <div className="scientific-debates-visual-core">
      RESEARCH
    </div>
  </div>
</section>


<section
  className="scientific-debates-timeline"
  aria-labelledby="poster-timeline-title"
>
  <div className="scientific-debates-timeline-heading">
    <span>رحلة المشاركة</span>
    <h2 id="poster-timeline-title">الخط الزمني</h2>
  </div>
<div className="scientific-debates-timeline-main">

  {timelineEvents.length > 0 ? (
    <PosterTimeline events={timelineEvents} />
  ) : (
    <p>سيتم عرض المواعيد بعد نشرها من لوحة Admin.</p>
  )}

{participationRequirements.length > 0 && (

<section className="scientific-debates-requirements">
  <div className="scientific-debates-requirements-heading">
    <span>قبل المشاركة</span>
    <h2>شروط التسجيل</h2>
  </div>

  {participationRequirements.length > 0 ? (

<ol className="scientific-debates-requirements-list">
  {participationRequirements.map((item, index) => (
    <li
      key={item.id}
      className="scientific-debates-requirement"
    >
      <span className="scientific-debates-requirement-number">
        {String(index + 1).padStart(2, "0")}
      </span>
      <p>{item.text}</p>
    </li>
  ))}
</ol>
  ) : (
    <p>سيتم عرض شروط المشاركة بعد نشرها من لوحة Admin.</p>
  )}
</section>
)}
</div>
<aside className="research-cta scientific-debates-registration">

  <span className="research-cta__number">
    03 <i></i>
  </span>

  <div className="research-cta__icon">
    <Sparkles size={20} />
  </div>

  <h2>مهتم بالمشاركة؟</h2>

  <p>
   سجل الآن
  </p>

  <a
    className="research-cta__button"
    href="https://hpcgate.ksau-hs.edu.sa/Home/Index"
    target="_blank"
    rel="noopener noreferrer"
  >
   رابط التسجيل
    <ExternalLink size={15} />
  </a>

  <small className="research-cta__note">
  </small>
</aside>

</section>


      <SiteFooter />
    </main>
  );
}
