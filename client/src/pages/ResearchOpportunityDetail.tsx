import { useTranslation } from "react-i18next";
import PathwayName from "@/components/PathwayName";
import { getMediaUrl } from "@/lib/mediaUrl";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

import {
  loadPublishedRoute,
  routeToPathway,
} from "@/lib/routesCms";

import { getPathway } from "@/lib/pathways";

import "./ResearchOpportunityDetail.css";

export type ResearchTimelineEvent = {
  date: string;
  title: string;
};

export type ResearchRequirement = {
  id: string;
  text: string;
};

export const researchOpportunityContent = {
  eyebrow: "مسار",
  title: "الفرص البحثية",
  description:
    "مسار يهدف إلى تمكين الباحثين والمهتمين من تطوير أفكار بحثية نوعية تسهم في مواجهة التحديات الصحية وتحسين جودة الرعاية. يقدّم المسار رحلة متكاملة تبدأ من التسجيل، مرورًا بتطوير المقترحات من خلال المحاضرات وورش العمل، وصولًا إلى تقديم المقترحات البحثية والحفل الختامي وإعلان الفائزين.",
  timelineTitle: "الخط الزمني",
  ctaTitle: "مهتم بالمشاركة؟",
  ctaDescription: "",
  ctaLabel: "زيارة موقع المؤتمر",
  conferenceUrl: "",
  requirements: [
    { id: "requirement-1", text: "التسجيل كفريق مكوّن من 3 إلى 5 طلاب من التخصصات الصحية، جميعهم من جامعة واحدة معتمدة داخل المملكة." },
    { id: "requirement-2", text: "أن يكون المشارك طالبًا جامعيًا منتظمًا." },
    { id: "requirement-3", text: "لا يُسمح بتكرار الأعضاء بين الفرق." },
    { id: "requirement-4", text: "تقديم فكرة بحثية مميزة قائمة على الأصالة والأهمية والتأثير." },
    { id: "requirement-5", text: "يُفضّل وجود مشرف من أعضاء هيئة التدريس." },
    { id: "requirement-6", text: "الالتزام بالحضور إلى الرياض للمراحل النهائية." },
  ] as ResearchRequirement[],
  events: [
    { date: "27 ديسمبر 2026", title: "بداية التسجيل" },
    { date: "10 مارس 2027", title: "انتهاء التسجيل" },
    { date: "15 مارس 2027", title: "إعلان القبول" },
    { date: "16 أبريل 2027", title: "ورشة عمل افتراضية" },
    { date: "18 أبريل 2027", title: "تسليم المقترحات البحثية" },
    { date: "17–18 أبريل 2027", title: "ورشة عمل حضورية" },
    { date: "19 أبريل 2027", title: "الحفل الختامي وإعلان الفائزين" },
  ] as ResearchTimelineEvent[],
};


function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.18 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}


function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return <div ref={ref} className={`research-reveal ${visible ? "is-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

function Timeline({ events }: { events: ResearchTimelineEvent[] }) {
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
            viewportHeight * 0.55
      ).length;

    setVisibleCount(count);
    return;
  }

  const firstEvent = eventRefs.current[0];
  if (!firstEvent) return;

  const top = firstEvent.getBoundingClientRect().top;

  // Longer scroll distance for sequential reveal
  const start = viewportHeight * 0.95;
  const end = viewportHeight * 0.20;

  const progress = Math.max(
    0,
    Math.min(1, (start - top) / (start - end))
  );

  const count = Math.min(
    events.length,
    Math.ceil(progress * events.length)
  );

  setVisibleCount(count);
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
    <ol className="research-timeline" style={{ "--research-progress": `${Math.min(100, (visibleCount / events.length) * 100)}%` } as React.CSSProperties}>
      {events.map((event, index) => (
        <li ref={(node) => { eventRefs.current[index] = node; }} data-index={index} className={`research-timeline__event ${index < visibleCount ? "is-visible" : ""}`} key={`${event.date}-${event.title}`}>
          <div className="research-timeline__marker"><span>{String(index + 1).padStart(2, "0")}</span></div>
          <div className="research-timeline__copy"><time>{event.date}</time><h3>{event.title}</h3></div>
        </li>
      ))}
    </ol>
  );
}

export default function ResearchOpportunityDetail() {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === "en";
  const resources = i18n.getResourceBundle("en", "translation");
  const copy = { ...resources.posterOral, ...resources.debateTrack.copy, ...resources.researchOpportunities.copy } as Record<string, string>;
  const normalize = (text: string) => text.normalize("NFKC").replace(/[\u0640\u064b-\u065f\u0670]/g, "").trim().replace(/\s+/g, " ");
  const localize = (text: string) => isEnglish ? Object.entries(copy).find(([key]) => normalize(key) === normalize(text))?.[1] ?? text : text;
  const [, navigate] = useLocation();
  const [content, setContent] = useState(researchOpportunityContent);
  const [isLoading, setIsLoading] = useState(true);

const [researchImage, setResearchImage] = useState(
  () => getPathway("research-opportunities")?.image || ""
);


useEffect(() => {
  let active = true;

  void loadPublishedRoute("research-opportunities")
    .then((route) => {
      if (!active || !route) return;

setResearchImage(
  routeToPathway(route).image ||
  getPathway("research-opportunities")?.image ||
  ""
);

      setContent((current) => ({
        ...current,
        eyebrow: route.eyebrow,
        title: route.title,
        description: route.description || current.description,
        ctaTitle: route.ctaTitle,
        ctaDescription: route.ctaDescription,
        ctaLabel: route.ctaLabel,
        conferenceUrl: route.ctaUrl,
        events: route.events
          .filter((event) => event.visible)
          .sort((a, b) => a.order - b.order)
          .map((event) => ({
            date: event.date,
            title: event.title,
          })),
        requirements: route.requirements
          .filter((requirement) => requirement.visible)
          .sort((a, b) => a.order - b.order)
          .map((requirement) => ({
            id: requirement.id,
            text: requirement.text,
          })),
      }));
    })
    .catch((error) => {
      console.error("Failed to load research opportunities:", error);
    })
    .finally(() => {
      if (active) setIsLoading(false);
    });

  return () => {
    active = false;
  };
}, []);

const returnToPathways = (
  event: React.MouseEvent<HTMLAnchorElement>
) => {
  event.preventDefault();
  navigate("/");

  window.setTimeout(() => {
    document
      .getElementById("pathways")
      ?.scrollIntoView({ behavior: "smooth" });
  }, 40);
};


useEffect(() => {
  if (isLoading) return;

  const cards = document.querySelectorAll<HTMLLIElement>(
    ".research-opportunity-detail .research-requirements__list > li"
  );

  if (!("IntersectionObserver" in window)) {
    cards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle(
          "is-visible",
          entry.isIntersecting
        );
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  cards.forEach((card) => observer.observe(card));

  return () => observer.disconnect();
}, [isLoading, content.requirements]);


  const openConference = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!content.conferenceUrl) event.preventDefault();
  };


const researchImageSrc = getMediaUrl(researchImage);


if (isLoading) {
  return (
    <main
      className="pathway-detail research-opportunity-detail"
      dir={isEnglish ? "ltr" : "rtl"} lang={isEnglish ? "en" : "ar"}
    >
      <SiteHeader />
      <div style={{ minHeight: "100vh" }} aria-busy="true" />
    </main>
  );
}

  return (
    <main className="pathway-detail research-opportunity-detail" dir={isEnglish ? "ltr" : "rtl"} lang={isEnglish ? "en" : "ar"}>
      <SiteHeader />

<section className="research-intro">
  <div
    className="research-intro__image"
    aria-hidden="true"
  >
    {researchImageSrc && (
      <img src={researchImageSrc} alt="" />
    )}
  </div>

        <div className="research-intro__glow" aria-hidden="true" />
        <div className="research-intro__grid">
          <Reveal className="research-intro__copy">
            <a className="detail-back" href={`${import.meta.env.BASE_URL}#pathways`} onClick={returnToPathways}>{isEnglish ? <ArrowLeft size={16} /> : <ArrowRight size={16} />} {localize("الرجوع إلى المسارات")}</a>
            <p className="eyebrow"><span />{isEnglish ? t("researchOpportunities.track") : "04"}</p>
            <h1><PathwayName slug="research-opportunities">{localize("مسار الفرص البحثية")}</PathwayName></h1>
            <p className="research-intro__description">{localize(content.description)}</p>
          </Reveal>

<Reveal className="research-intro__signal" delay={120}>
  <div className="poster-oral-visual" aria-hidden="true">
    <div className="poster-oral-orbit" />
    <div className="poster-oral-visual-core">
      RESEARCH
    </div>
  </div>
</Reveal>
</div>
      </section>
      <section className="research-timeline-section">
<div className="research-section-heading">
  <Reveal>
    <p className="detail-label">{localize("رحلة المشاركة")}</p>
    <h2>{localize(content.timelineTitle)}</h2>
  </Reveal>
</div>

        <div className="research-timeline-layout">

<div className="research-timeline-main">

<div className="research-timeline-wrap">
  <Timeline events={content.events.map(event => ({ ...event, date: localize(event.date), title: localize(event.title) }))} />
</div>


  <div className="research-requirements">
    <div className="research-requirements__heading">
      <p className="detail-label">{isEnglish ? t("researchOpportunities.before") : "قبل أن تبدأ"}</p>
      <h2>{localize("شروط التسجيل")}</h2>
    </div>

    <ol className="research-requirements__list">
      {content.requirements.map((requirement, index) => (
        <li key={requirement.id}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <p>{localize(requirement.text)}</p>
        </li>
      ))}
    </ol>
  </div>
</div>

          <Reveal className="research-cta" delay={160}>
            <span className="research-cta__number">04 <i></i></span>
            <div className="research-cta__icon"><Sparkles size={20} /></div>
            <h2>{localize(content.ctaTitle)}</h2>
            <p>{localize(content.ctaDescription)}</p>
            <a className="research-cta__button" href={content.conferenceUrl || "#"} onClick={openConference}>{localize(content.ctaLabel)}<ExternalLink size={15} /></a>
            {!content.conferenceUrl && <small className="research-cta__note"></small>}
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
