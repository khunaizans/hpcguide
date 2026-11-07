import { getMediaUrl } from "@/lib/mediaUrl";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  loadPublishedRoute,
  routeToPathway,
  type RouteRecord,
} from "@/lib/routesCms";


import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./ThreeMTDetail.css";
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


export default function ThreeMTDetail() {
  const [route, setRoute] = useState<RouteRecord | null>(null);
const [isReady, setIsReady] = useState(false);
const [heroImageSrc, setHeroImageSrc] = useState("");

  useEffect(() => {
    let active = true;



  const loadPage = async () => {
    try {
      const data = await loadPublishedRoute("3mt");

      if (!active) return;

      const image = data
        ? routeToPathway(data).image
        : "";

      const imageSrc = image
        ? image.includes("supabase.com/dashboard/")
          ? `/images/${image.split("website").pop()}`
          : image.replace(
              "/manus-storage/",
              "/images/"
            )
        : "";

      // Load the correct image before showing the page
      if (imageSrc) {
        await new Promise<void>((resolve) => {
          const img = new Image();

          img.onload = () => {
            if (active) {
              setHeroImageSrc(imageSrc);
            }
            resolve();
          };

          img.onerror = () => {
            console.error(
              "Failed to load 3MT image:",
              imageSrc
            );
            resolve();
          };

          img.src = imageSrc;
        });
      }

      if (!active) return;

      setRoute(data ?? null);
    } catch (error) {
      console.error(
        "Failed to load 3MT page:",
        error
      );
    } finally {
      if (active) {
        setIsReady(true);
      }
    }
  };

  void loadPage();

  return () => {
    active = false;
  };
}, []);



const previewEvents = [
  ["27 ديسمبر 2026", "بداية التسجيل"],
  ["10 مارس 2027", "انتهاء التسجيل"],
  ["15 مارس 2027", "إعلان القبول"],
  ["17 أبريل 2027", "يوم المؤتمر الأول"],
  ["18 أبريل 2027", "يوم المؤتمر الثاني"],
  ["19 أبريل 2027", "الحفل الختامي وإعلان الفائزين"],
].map(([date, title], index) => ({
  id: `preview-${index}`,
  date,
  title,
  description: "",
  visible: true,
  order: index,
}));


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


const participationRequirements = (route?.requirements ?? [])
  .filter((item) => item.visible)
  .sort((a, b) => a.order - b.order);


useEffect(() => {
  const cards = document.querySelectorAll(
  ".three-mt-page .three-mt-requirements-heading h2, " +
  ".three-mt-page .three-mt-requirement, " +
  ".three-mt-page .three-mt-registration"
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

if (!isReady) {
  return (
    <main className="three-mt-page" dir="rtl">
      <SiteHeader />
      <div
        aria-busy="true"
        style={{
          minHeight: "100vh",
          background: "#0C0A65",
        }}
      />
    </main>
  );
}


return (
  <main className="three-mt-page" dir="rtl">
    <SiteHeader />

<section className="three-mt-hero">
  <div className="three-mt-hero-image" aria-hidden="true">
    {heroImageSrc && (
        <img src={heroImageSrc} alt="" />
    )}
  </div>

  <div className="three-mt-hero-content">

<a
  href="/#pathways"
  className="detail-back hpc-pathways-back"
>
  <ArrowRight size={18} />
  الرجوع إلى المسارات
</a>

    <span className="three-mt-eyebrow">
      المسار 06
    </span>

    <h1>
      {route?.title || "مسار العرض البحثي في ثلاث دقائق"}
    </h1>

    <p className="three-mt-description">
      {route?.details || route?.description || ""}
    </p>
  </div>

  <div className="three-mt-visual" aria-hidden="true">
    <div className="three-mt-orbit" />
    <div className="three-mt-visual-core">
      RESEARCH
    </div>
  </div>
</section>


<section
  className="three-mt-timeline"
  aria-labelledby="poster-timeline-title"
>
  <div className="three-mt-timeline-heading">
    <span>رحلة المشاركة</span>
    <h2 id="poster-timeline-title">الخط الزمني</h2>
  </div>
<div className="three-mt-timeline-main">

  {timelineEvents.length > 0 ? (
    <PosterTimeline events={timelineEvents} />
  ) : (
    <p>سيتم عرض المواعيد بعد نشرها من لوحة Admin.</p>
  )}
<section className="three-mt-requirements">
  <div className="three-mt-requirements-heading">
    <span>قبل المشاركة</span>
    <h2>شروط التسجيل</h2>
  </div>

  {participationRequirements.length > 0 ? (

<ol className="three-mt-requirements-list">
  {participationRequirements.map((item, index) => (
    <li
      key={item.id}
      className="three-mt-requirement"
    >
      <span className="three-mt-requirement-number">
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
<aside className="research-cta three-mt-registration">


<span className="research-cta__number">
  06 <i></i>
</span>

  <div className="research-cta__icon">
    <Sparkles size={20} />
  </div>


<h2>{route?.ctaTitle || "مهتم بالمشاركة؟"}</h2>

<p>{route?.ctaDescription || "سجل الآن"}</p>


{route?.ctaUrl ? (
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
  <button
    type="button"
    className="research-cta__button"
    disabled
    style={{
      opacity: 0.65,
      cursor: "not-allowed",
    }}
  >
    رابط التسجيل
    <ExternalLink size={15} />
  </button>
)}

</aside>
</section>

<SiteFooter />
</main>
);
}
