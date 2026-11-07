import { getMediaUrl } from "@/lib/mediaUrl";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  loadPublishedRoute,
  routeToPathway,
  type RouteRecord,
} from "@/lib/routesCms";

import { getPathway } from "@/lib/pathways";
import { useRoute } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./VisualResearchDetail.css";
import { Sparkles, ExternalLink, ArrowRight } from "lucide-react";


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
    const count = eventRefs.current
      .slice(0, events.length)
      .filter(
        (element) =>
          element &&
          element.getBoundingClientRect().top <
            viewportHeight * 0.8
      ).length;

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


export default function VisualResearchDetail() {
  const [, params] = useRoute<{ slug: string }>("/pathways/:slug");
  const slug = params?.slug;

  const [route, setRoute] = useState<RouteRecord | null>(null);

  useEffect(() => {
    if (!slug) {
      setRoute(null);
      return;
    }

    let active = true;
    setRoute(null);

    void loadPublishedRoute(slug)
      .then((data) => {
        if (active) setRoute(data ?? null);
      })
      .catch((error) => {
        console.error("Failed to load route:", error);
        if (active) setRoute(null);
      });

    return () => {
      active = false;
    };
  }, [slug]);

const timelineEvents = (route?.events ?? [])
  .filter((event) => event.visible)
  .sort((a, b) => a.order - b.order);

const previewRequirements = [
  "أن يكون البحث متعلقًا بأحد المجالات الصحية.",
  "أن يتضمن البحث العناصر الأساسية، وهي:\n• المقدمة والأهداف (Introduction & Objectives)\n• المنهجية (Methods)\n• النتائج والمناقشة (Results & Discussion)\n• الخاتمة (Conclusion)",
  "وجود مشرف رئيسي للبحث، ولا يشترط حضوره خلال أيام المؤتمر.",
  "أن يكون المشارك طالبًا جامعيًا أو أعلى (مثل طلاب الامتياز، الدراسات العليا، أو الممارسين الصحيين)، ولا يُسمح بمشاركة طلاب المرحلة الثانوية أو ما دونها.",
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
  ".poster-oral-page .poster-oral-requirements-heading h2, " +
  ".poster-oral-page .poster-oral-requirement, " +
  ".poster-oral-page .poster-oral-registration"
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



const posterImage =
  (route ? routeToPathway(route).image : null) ||
  getPathway("posters-research")?.image;

const posterImageSrc = getMediaUrl(posterImage);


  return (
    <main className="poster-oral-page" dir="rtl">
      <SiteHeader />




<section className="poster-oral-hero">
  <div className="poster-oral-hero-image" aria-hidden="true">
    {posterImageSrc && (
      <img src={posterImageSrc} alt="" />
    )}
  </div>

  <div className="poster-oral-hero-content">

<a
  href="/#pathways"
  className="detail-back hpc-pathways-back"
>
  <ArrowRight size={18} />
  الرجوع إلى المسارات
</a>

<span
  className="poster-oral-eyebrow"
  style={{ color: "#FFFFFF" }}
>
  المسار 07
</span>


    <h1>
      {route?.title || "مسار الملصقات والعروض الشفهية"}
    </h1>

    <p className="poster-oral-description">
      {route?.details || route?.description || ""}
    </p>
  </div>

  <div className="poster-oral-visual" aria-hidden="true">
    <div className="poster-oral-orbit" />
    <div className="poster-oral-visual-core">
      RESEARCH
    </div>
  </div>
</section>


<section
  className="poster-oral-timeline"
  aria-labelledby="poster-timeline-title"
>
  <div className="poster-oral-timeline-heading">
    <span>رحلة المشاركة</span>
    <h2 id="poster-timeline-title">الخط الزمني</h2>
  </div>
<div className="poster-oral-timeline-main">

  {timelineEvents.length > 0 ? (
    <PosterTimeline events={timelineEvents} />
  ) : (
    <p>سيتم عرض المواعيد بعد نشرها من لوحة Admin.</p>
  )}
<section className="poster-oral-requirements">
  <div className="poster-oral-requirements-heading">
    <span>قبل المشاركة</span>
    <h2>شروط التسجيل</h2>
  </div>

  {participationRequirements.length > 0 ? (

<ol className="poster-oral-requirements-list">
  {participationRequirements.map((item, index) => (
    <li
      key={item.id}
      className="poster-oral-requirement"
    >
      <span className="poster-oral-requirement-number">
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
</div>
<aside className="research-cta poster-oral-registration">

  <span className="research-cta__number">
    07 <i></i>
  </span>

  <div className="research-cta__icon">
    <Sparkles size={20} />
  </div>

  <h2>مهتم بالمشاركة؟</h2>

  <p>
   سجل الآن
  </p>

  {route?.ctaUrl?.trim() ? (
  <a
    className="research-cta__button"
    href={route.ctaUrl}
    target="_blank"
    rel="noopener noreferrer"
  >
    {route.ctaLabel || "رابط التسجيل"}
    <ExternalLink size={15} />
  </a>
) : (
  <span className="research-cta__note">
    رابط التسجيل غير متاح حاليًا
  </span>
)}

  <small className="research-cta__note">
  </small>
</aside>

</section>


      <SiteFooter />
    </main>
  );
}
