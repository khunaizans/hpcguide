import { useTranslation } from "react-i18next";
import PathwayName from "@/components/PathwayName";
import { getMediaUrl } from "@/lib/mediaUrl";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import {
  loadPublishedRoute,
  loadRouteRecords,
  routeToPathway,
  type RouteRecord,
} from "@/lib/routesCms";

import { getPathway } from "@/lib/pathways";
import { useRoute } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./VisualResearchDetail.css";
import { Sparkles, ExternalLink, ArrowLeft, ArrowRight } from "lucide-react";


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
  const { t, i18n } = useTranslation();
  const [, params] = useRoute<{ slug: string }>("/pathways/:slug");
  const slug = params?.slug;

const [route, setRoute] = useState<RouteRecord | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  let active = true;

  setIsLoading(true);
  setRoute(null);

  if (!slug) {
    setIsLoading(false);
    return () => {
      active = false;
    };
  }

  const request = import.meta.env.DEV
    ? loadRouteRecords().then(
        (routes) => routes.find((item) => item.slug === slug) ?? null
      )
    : loadPublishedRoute(slug);

  void request
    .then((data) => {
      if (!active) return;

      setRoute(data ?? null);
      setIsLoading(false);
    })
    .catch((error) => {
      console.error("Failed to load route:", error);

      if (!active) return;

      setRoute(null);
      setIsLoading(false);
    });

  return () => {
    active = false;
  };
}, [slug]);

const timelineEvents = (route?.events ?? [])
  .filter((event) => event.visible)
  .sort((a, b) => a.order - b.order);

const participationRequirements = (route?.requirements ?? [])
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

const routeTheme =
  slug === "visual-research" || route?.eyebrow?.trim() === "07"
    ? "hpc-route-07"
    : slug === "research-review" || route?.eyebrow?.trim() === "08"
    ? "hpc-route-08"
    : "";


const translationSection = routeTheme === "hpc-route-08" ? "researchReview" : "visualResearch";
const isEnglish = i18n.resolvedLanguage === "en" && (routeTheme === "hpc-route-07" || routeTheme === "hpc-route-08");
const resources = i18n.getResourceBundle("en", "translation");
const copy = { ...resources.posterOral, ...resources[translationSection].copy } as Record<string, string>;
const normalize = (text: string) => text.normalize("NFKC").replace(/[\u0640\u064b-\u065f\u0670]/g, "").trim().replace(/\s+/g, " ");
const localize = (text: string) => isEnglish ? Object.entries(copy).find(([key]) => normalize(key) === normalize(text))?.[1] ?? text : text;

if (isLoading) {
  return (
    <main
      className={`poster-oral-page ${routeTheme}`}
      dir={isEnglish ? "ltr" : "rtl"}
      style={{
        minHeight: "100vh",
        backgroundColor: "#0C0A65",
      }}
    >
      <SiteHeader />

      <section
        aria-busy="true"
        aria-label={isEnglish ? t(`${translationSection}.loading`) : "جارٍ تحميل بيانات المسار"}
        style={{
          minHeight: "100vh",
          backgroundColor: "#0C0A65",
        }}
      />
    </main>
  );
}

  return (
    <main
      className={`poster-oral-page ${routeTheme}`}
      dir={isEnglish ? "ltr" : "rtl"}
    >
      <SiteHeader />

      <section className="poster-oral-hero">
        <div
          className="poster-oral-hero-image"
          aria-hidden="true"
        >
          {posterImageSrc && (
            <img src={posterImageSrc} alt="" />
          )}
        </div>

        <div className="poster-oral-hero-content">
          <a
            href={`${import.meta.env.BASE_URL}#pathways`}
            className="detail-back hpc-pathways-back"
          >
            {isEnglish ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
            {localize("الرجوع إلى المسارات")}
          </a>

          <span
            className="poster-oral-eyebrow"
            style={{ color: "#FFFFFF" }}
          >
            {isEnglish ? t(`${translationSection}.track`) : <>المسار {route?.eyebrow || "—"}</>}
          </span>

          <h1><PathwayName slug={slug} number={route?.eyebrow}>{route?.title || ""}</PathwayName></h1>

          <p className="poster-oral-description">
            {localize(route?.details || route?.description || "")}
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
          <span>{localize("رحلة المشاركة")}</span>
          <h2 id="poster-timeline-title">{localize("الخط الزمني")}</h2>
        </div>

        <div className="poster-oral-timeline-main">
          {timelineEvents.length > 0 ? (
            <PosterTimeline events={timelineEvents.map(event => ({ ...event, date: localize(event.date), title: localize(event.title) }))} />
          ) : (
            <p>{localize("سيتم عرض المواعيد بعد نشرها من لوحة Admin.")}</p>
          )}

          <section className="poster-oral-requirements">
            <div className="poster-oral-requirements-heading">
              <span>{localize("قبل المشاركة")}</span>
              <h2>{localize("شروط التسجيل")}</h2>
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
                    <p>{localize(item.text)}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p>{localize("سيتم عرض شروط المشاركة بعد نشرها من لوحة Admin.")}</p>
            )}
          </section>
        </div>

        <aside className="research-cta poster-oral-registration">
          <span className="research-cta__number">
            {route?.eyebrow || "—"} <i />
          </span>

          <div className="research-cta__icon">
            <Sparkles size={20} />
          </div>

          <h2>{localize("مهتم بالمشاركة؟")}</h2>
          <p>{localize("سجل الآن")}</p>

          {route?.ctaUrl?.trim() ? (
            <a
              className="research-cta__button"
              href={route.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {localize(route.ctaLabel || "رابط التسجيل")}
              <ExternalLink size={15} />
            </a>
          ) : (
            <span className="research-cta__note">{isEnglish ? t(`${translationSection}.unavailable`) : "رابط التسجيل غير متاح حاليًا"}</span>
          )}

          <small className="research-cta__note" />
        </aside>
      </section>

      <SiteFooter />
    </main>
  );
}
