import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Trans, useTranslation } from "react-i18next";
import {
  Check,
  ChevronLeft,
  Clock3,
  Menu,
} from "lucide-react";
import { pathwayCards } from "@/lib/pathways";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { locations } from "@/lib/locations";
import PathwaysStats from "@/components/PathwaysStats";
import { fallbackHomeContent, HomeContent, mapHomeContent } from "@/lib/homeCms";
import {
  loadPublishedRouteRecords,
  loadRouteRecords,
  routeToPathway,
} from "@/lib/routesCms";
import { supabase } from "@/lib/supabase";
import { getMediaUrl } from "@/lib/mediaUrl";
function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

const observer = new IntersectionObserver(
  ([entry]) => {
    setVisible(entry.isIntersecting);
  },
  { threshold: 0.16 }
);

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}


function Reveal({
  children,
  className = "",
  delay = 0,
  onClickCapture,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onClickCapture?: React.MouseEventHandler<HTMLDivElement>;
}) {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      onClickCapture={onClickCapture}
    >
      {children}
    </div>
  );
}


function Hero() {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === "en";
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameCallback = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoSrc = import.meta.env.BASE_URL + "videos/hpc-hero.mp4";
  const posterSrc = import.meta.env.BASE_URL + "videos/hpc-hero-poster.webp";

  const cancelFrame = () => {
    if (frameCallback.current !== null) videoRef.current?.cancelVideoFrameCallback(frameCallback.current);
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    frameCallback.current = null;
    animationFrame.current = null;
  };

  const revealVideoFrame = () => {
    const video = videoRef.current;
    if (!video || videoPlaying || reducedMotion || videoFailed || frameCallback.current !== null || animationFrame.current !== null) return;
    if (typeof video.requestVideoFrameCallback === "function") {
      frameCallback.current = video.requestVideoFrameCallback(() => {
        frameCallback.current = null;
        setVideoPlaying(true);
      });
    } else if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      // Older browsers: wait for decoded data and a paint opportunity.
      animationFrame.current = requestAnimationFrame(() => {
        animationFrame.current = requestAnimationFrame(() => {
          animationFrame.current = null;
          if (!video.error && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setVideoPlaying(true);
        });
      });
    }
  };

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      cancelFrame();
      setReducedMotion(preference.matches);
      setVideoPlaying(false);
    };
    preference.addEventListener("change", updateMotion);
    return () => {
      preference.removeEventListener("change", updateMotion);
      cancelFrame();
    };
  }, []);

  // Follow the existing fixed header, including its responsive and CMS sizes.
  useLayoutEffect(() => {
    const header = sectionRef.current?.parentElement?.querySelector(".site-header");
    if (!header) return;
    const updateHeight = () => sectionRef.current?.style.setProperty(
      "--hero-header-height", header.getBoundingClientRect().height + "px"
    );
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="hero" className="hero-section" dir={isEnglish ? "ltr" : "rtl"} lang={isEnglish ? "en" : "ar"} aria-labelledby="hero-video-title">
      <div className="hero-film">
        <div className="hero-film__media" aria-hidden="true">
          <img className="hero-film__poster" src={posterSrc} alt="" fetchPriority="high" loading="eager" />
          {!reducedMotion && (
            <video
              ref={videoRef}
              className={"hero-film__video" + (videoPlaying && !videoFailed ? " is-playing" : "") + (videoFailed ? " is-failed" : "")}
              src={videoSrc}
              poster={posterSrc}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onLoadedData={revealVideoFrame}
              onPlaying={revealVideoFrame}
              onError={() => {
                cancelFrame();
                setVideoPlaying(false);
                setVideoFailed(true);
              }}
            />
          )}
        </div>
        <div className="hero-film__caption">
          <div className="hero-film__copy">
            <p className="hero-film__intro">{t("hero.videoIntro")}</p>
            <h1 id="hero-video-title">
              <Trans i18nKey="hero.videoTitle" components={{ accent: <span className="hero-film__accent" /> }} />
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, description, light = false }: { eyebrow: string; title: React.ReactNode; description: React.ReactNode; light?: boolean }) {
  return (
    <div className={`section-heading ${light ? "section-heading--light" : ""}`}>
      <p className="eyebrow"><span /> {eyebrow}</p>
      {title ? <h2>{title}</h2> : null}
      <p className="section-description">{description}</p>
    </div>
  );
}
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      const currentProgress =
        maxScroll > 0 ? window.scrollY / maxScroll : 0;

      setProgress(Math.max(0, Math.min(1, currentProgress)));
    };

    updateProgress();

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div className="floating-progress" aria-hidden="true">
      <span style={{ top: `${progress * 72}%` }} />
    </div>
  );
}
function StrategicGoals() {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === "en";
  const sectionRef = useRef<HTMLElement | null>(null);
const [scrollProgress, setScrollProgress] = useState(0);

useEffect(() => {
  let frame = 0;

  const updateProgress = () => {
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const progress =
      (viewportHeight - rect.top) /
      (viewportHeight + rect.height);

    setScrollProgress(Math.max(0, Math.min(1, progress)));
  };

  const onScroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(updateProgress);
  };

  updateProgress();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}, []);

const goals = [
  "الصحة الرقمية والرعاية الصحية في ضوء الرؤية",
  "الخصخصة والاستدامة في القطاع الصحي",
  "الصحة النفسية في استراتيجية التحول",
  "تحسين جودة الحياة من خلال الخدمات الصحية",
  "تمكين الكوادر الوطنية الصحية",
  "تعزيز ثقافة الوقاية والأوبئة الصحية",
  "البحث والابتكار لدعم التحول الصحي",
];


  return (
    <section
     ref={sectionRef}
      id="strategic-goals"
      className="strategic-goals-section"
      dir={isEnglish ? "ltr" : "rtl"}
      lang={isEnglish ? "en" : "ar"}
    >
      <div className="container">
        <h2
  className="strategic-goals-title"
  style={{
    opacity: scrollProgress >= 0.03 ? 1 : 0,
    transform:
      scrollProgress >= 0.03
        ? "translateY(0)"
        : "translateY(30px)",
  }}
>
  {isEnglish ? <>{t("strategicObjectives.headingLead")} <span>{t("strategicObjectives.headingAccent")}</span></> : <>الأهداف <span>الاستراتيجية</span></>}
</h2>

        <div className="strategic-goals-grid">
          {goals.map((goal, index) => {
  const visible = scrollProgress >= 0.08 + index * 0.05;

  return (
    <div
      className="strategic-goal"
      key={goal}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(25px)",
      }}
    >

              <svg
                viewBox="0 0 52 42"
                width="42"
                height="36"
                aria-hidden="true"
              >
                <path
  d="M26 3V26 M13 14L26 27L39 14 M6 36H46"
  fill="none"
  stroke="currentColor"
  strokeWidth="6"
  strokeLinecap="square"
  strokeLinejoin="miter"
/>
              </svg>

                <p>{isEnglish ? t(`strategicObjectives.items.${index + 1}`, { defaultValue: goal }) : goal}</p>
        </div>
      );
    })}
      </div>
    </div>
  </section>
);
}

function About({ content }: { content: HomeContent }) {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === "en";
  // CMS copy may contain Arabic vowel marks, elongation, bidi controls, or
  // split a word between the two decorative lines. Normalize only for matching.
  const normalizeSlogan = (value: string) => value.normalize("NFKC")
    .replace(/[\s\u0640\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/[أإآٱ]/g, "ا");
  const isHealthSlogan = normalizeSlogan(content.about.titleLine1 + content.about.titleLine2)
    === normalizeSlogan("نبحث لصحة الإنسان");
  // Keep CMS values intact; English copy is a presentation-only translation.
  const about = isEnglish ? {
    ...content.about,
    eyebrow: t("identity.heading", { defaultValue: content.about.eyebrow }),
    titleLine1: isHealthSlogan ? t("identity.sloganLead") : content.about.titleLine1 === fallbackHomeContent.about.titleLine1 ? t("identity.titleLine1", { defaultValue: content.about.titleLine1 }) : content.about.titleLine1,
    titleLine2: isHealthSlogan ? t("identity.sloganAccent") : content.about.titleLine2 === fallbackHomeContent.about.titleLine2 ? t("identity.titleLine2", { defaultValue: content.about.titleLine2 }) : content.about.titleLine2,
    description: t("identity.description", { defaultValue: content.about.description }),
    visionLabel: t("identity.visionLabel", { defaultValue: content.about.visionLabel }),
    visionTitle: t("identity.visionDescription", { defaultValue: content.about.visionTitle }),
    visionText: "",
    missionLabel: t("identity.missionLabel", { defaultValue: content.about.missionLabel }),
    missionTitle: t("identity.missionDescription", { defaultValue: content.about.missionTitle }),
    missionText: "",
  } : content.about;
  return (
    <section id="about" className="about-section section-pad" dir={isEnglish ? "ltr" : "rtl"} lang={isEnglish ? "en" : "ar"}>
      <div className="section-pattern research-pattern" aria-hidden="true"><span /><span /><span /><i>R</i></div>
      <div className="container about-layout">
        <Reveal className={`about-title${isEnglish && isHealthSlogan ? " about-title--health-slogan" : ""}`}>
          <SectionHeading
  eyebrow={about.eyebrow}
  title={
    about.titleLine1?.trim() || about.titleLine2?.trim() ? (
      <>
        {about.titleLine1}
        <br />
        <span>{about.titleLine2}</span>
      </>
    ) : null
  }
  description={
  about.description
    .replace(/\r\n?/g, "\n")
    .replace(/\n(?:[\t ]*\n)+/g, "\n")
    .split(/(الحادي عشر|الحادية عشر|الحادية عشرة|11th)/g)
    .map((part, index) =>
      ["الحادي عشر", "الحادية عشر", "الحادية عشرة", "11th"].includes(part) ? (
        <span key={index} className="about-highlight">
          {part}
        </span>
      ) : (
        part
      )
    )
}
/>
        </Reveal>
        <div className="about-stack">
          <Reveal delay={100} className="statement-card statement-card--vision">
            <div className="statement-number">01</div>
            <div><p className="card-label">{about.visionLabel}</p><h3>{about.visionTitle}</h3><p>{about.visionText}</p></div>
          </Reveal>
          <Reveal delay={180} className="statement-card statement-card--mission">
            <div className="statement-number">02</div>
            <div><p className="card-label">{about.missionLabel}</p><h3>{about.missionTitle}</h3><p>{about.missionText}</p></div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function AccompanyingExhibition() {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === "en";
  return (
    <section
      id="accompanying-exhibition"
      className="accompanying-exhibition"
      dir={isEnglish ? "ltr" : "rtl"}
      lang={isEnglish ? "en" : "ar"}
    >
      <div className="container">
        <Reveal className="exhibition-content">
          <div className="exhibition-heading">
            <h2>{isEnglish ? t("exhibition.title") : "المعرض المصاحب"}</h2>
            <h3></h3>
          </div>

          <div className="exhibition-intro">
            <p>
              {isEnglish ? <Trans i18nKey="exhibition.intro" components={{ edition: <span className="exhibition-highlight" /> }} /> : <>

يتضمن معرض مؤتمر التخصصات الصحية{" "}
<span className="exhibition-highlight">الحادي عشر</span>{" "}
              أركانًا متعددة تسلط الضوء على أحدث التطورات
              وتطبيقات الذكاء الاصطناعي والتقنيات الحديثة
              في المجال الصحي. مجموعة من اللقاءات تهدف إلى
              تعزيز التفاعل المباشر بين المشاركين والخبراء،
              واستعراض كيف يسهم الذكاء الاصطناعي وتقنيات
              المستقبل في إعادة تشكيل الممارسة الصحية
              والارتقاء بها.
              </>}
            </p>
          </div>

          <p className="exhibition-details">
            {isEnglish ? t("exhibition.details") : <>
            من خلال هذه اللقاءات، يحصل المشاركون على فرصة
            مميزة لتبادل الأفكار والنقاشات حول أحدث التطورات
            العلمية والتوجهات المستقبلية للذكاء الاصطناعي.
            كما تسهم هذه الجلسات في توسيع شبكة العلاقات
            المهنية، والاستفادة من خبرات وتجارب المتحدثين،
            مما يثري المعرفة ويساعد في بناء رؤية أعمق
            للتخصصات المختلفة وانتشارها بشكل أوسع عبر
            وسائل التواصل الاجتماعي.
            </>}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Pathways({ content }: { content: HomeContent }) {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === "en";
const [, navigate] = useLocation();
  const [touchedCard, setTouchedCard] = useState<number | null>(null);

  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (navigationTimer.current !== null) {
        clearTimeout(navigationTimer.current);
      }
    };
  }, []);

  return (
    <section id="pathways" className="pathways-section section-pad">
      <div className="section-pattern circuit-pattern" aria-hidden="true"><span /><span /><span /><i>AI</i></div>
      <div className="container">
        <div className="pathways-intro-layout" dir={isEnglish ? "ltr" : "rtl"} lang={isEnglish ? "en" : "ar"}>
  <div className="pathways-intro-heading">
    <Reveal>
      <SectionHeading
        eyebrow={isEnglish ? t("pathwaysIntro.label") : content.pathways.eyebrow}
        title={
          <>
            {isEnglish ? t("pathwaysIntro.titleLead") : content.pathways.titleLine1}
            <br />
            <span>{isEnglish ? t("pathwaysIntro.titleAccent") : content.pathways.titleLine2}</span>
          </>
        }
        description={isEnglish ? t("pathwaysIntro.description") : content.pathways.description}
        light
      />
    </Reveal>
  </div>

  <PathwaysStats />
</div>
        <div className="pathway-grid" dir={isEnglish ? "ltr" : "rtl"}>
          {content.pathways.cards.map((card, index) => (

  <Reveal
  key={card.eyebrow}
  delay={index * 65}
  className={`pathway-card pathway-card--${card.tone} ${
  touchedCard === index ? "mobile-touched" : ""
} ${
  card.eyebrow === "07"
    ? "pathway-card--visual-research"
    : card.eyebrow === "08"
    ? "pathway-card--research-review"
    : ""
}`}
>

              <div className="pathway-image-wrap"><img
 src={getMediaUrl(card.image)}
  alt={card.title}
  className="pathway-image"
  onError={(e) => {
  e.currentTarget.style.visibility = "hidden";
}}
onLoad={(e) => {
  e.currentTarget.style.visibility = "visible";
}}
/>
 /<span className="pathway-index">{card.eyebrow}</span></div>

<div className="pathway-body">
  <p dir={isEnglish ? "ltr" : undefined} style={isEnglish ? { overflowWrap: "anywhere" } : undefined}>{isEnglish ? t(`pathwayNames.${card.eyebrow.trim() === "07" ? "visual-research" : card.eyebrow.trim() === "08" ? "research-review" : card.slug}`, { defaultValue: card.title }) : card.title}</p>
  <span dir={isEnglish ? "ltr" : undefined} style={isEnglish ? { textAlign: "left" } : undefined}>{isEnglish ? t(`pathwayDescriptions.${card.eyebrow.trim() === "07" ? "visual-research" : card.eyebrow.trim() === "08" ? "research-review" : card.slug}`, { defaultValue: card.text }) : card.text}</span>
</div>


<Link
  href={card.link_url}
  className="pathway-card__click-layer"
  aria-label={`استكشف ${card.title}`}
  onClickCapture={(event) => {
    const isTouchDevice = window.matchMedia(
      "(hover: none) and (pointer: coarse)"
    ).matches;

    if (!isTouchDevice || event.detail === 0) return;

    event.preventDefault();
    event.stopPropagation();

    if (navigationTimer.current !== null) {
      clearTimeout(navigationTimer.current);
    }

    setTouchedCard(index);

    navigationTimer.current = setTimeout(() => {
      navigationTimer.current = null;
      navigate(card.link_url);
    }, 550);
  }}
/>

            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}


function Resources({ content }: { content: HomeContent }) {
  const [towerRaised, setTowerRaised] = useState(false);
  const [tappedCard, setTappedCard] = useState<string | null>(null);
  const [, navigate] = useLocation();

  return (
    <section
      id="resources"
      className="resources-section section-pad"
    >
      <div className="container">
        <Reveal>
          <SectionHeading
            eyebrow={content.resources.eyebrow}
            title={
              <>
                {content.resources.titleLine1}
                <br />
                <span>{content.resources.titleLine2}</span>
              </>
            }
            description={content.resources.description}
          />
        </Reveal>

        <div className="resource-grid">
          {content.resources.cards.map((location, index) => {
            const isTower =
              location.slug === "administrative-tower";
              const isGraduate = location.slug === "postgraduate-studies";
               const isSimulation =
  location.slug === "clinical-simulation-center";
            const fallbackImage = getMediaUrl(
              locations.find((item) => item.slug === location.slug)?.image
            ) || `${import.meta.env.BASE_URL}images/nearby-map_c38385fb.png`;

            return (
              <Reveal
                key={location.slug}
                delay={index * 70}


className={`resource-card ${
  isTower ? "resource-card--tower" : ""
} ${
  isGraduate ? "resource-card--graduate" : ""
} ${
  isSimulation ? "resource-card--simulation" : ""
} ${
  isTower && towerRaised ? "is-raised" : ""
} ${
  tappedCard === location.slug ? "is-touch-zoom" : ""
}`}


              >
               <Link
  href={location.link_url}
  className="resource-card__link"
  aria-label={`استكشف ${location.title}`}
onClick={(event) => {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  ) return;

  if (!window.matchMedia("(hover: none)").matches && !isTower) {
    return;
  }

  event.preventDefault();

 
if (isTower) {
  setTowerRaised(true);
}

if (isGraduate || isSimulation) {
  setTappedCard(location.slug);
}

window.setTimeout(() => {
  navigate(location.link_url);
}, isGraduate || isSimulation ? 850 : 450);
}}
>
                  {isTower ? (
                    <>




<div className="tower-seamless">
  <div className="tower-seamless__frame">
    <img
      src={`${import.meta.env.BASE_URL}images/tower-card-new.png`}
      alt="البرج الإداري"
      className="tower-seamless__base"
    />
  </div>

  <div className="tower-seamless__cap" aria-hidden="true">
    <img
      src={`${import.meta.env.BASE_URL}images/tower-roof-from-original-aligned.png`}
      alt=""
      className="tower-seamless__roof"
    />
  </div>
</div>

<div className="resource-card__tower-info">
  <h3>البرج الإداري</h3>
</div>

</>
) : (
<>


<div className="resource-card__icon">

{isGraduate ? (
  <div className="graduate-photo-window">
    <img
      src={`${import.meta.env.BASE_URL}images/graduate-studies-card-portrait.webp`}
      alt="الدراسات العليا"
      className="graduate-photo-image"
    />
  </div>
) : isSimulation ? (


<>
  {/* الصورة الكاملة داخل البطاقة */}
  <div className="simulation-photo-window">
    <img
      src={`${import.meta.env.BASE_URL}images/clinical-simulation-center.webp`}
      alt="مركز المحاكاة السريرية"
      className="simulation-photo-base"
    />
  </div>

  {/* طبقة المبنى المعزولة */}
  <img
    src={`${import.meta.env.BASE_URL}images/clinical-simulation-building-cutout.png`}
    alt=""
    aria-hidden="true"
    className="simulation-building-popout"
  />
</>
) : (

    <img
      src={getMediaUrl(
        location.image?.includes("supabase.com/dashboard/")
          ? `/images/${location.image.split("website").pop()?.replace(/^\/+/, "")}`
          : location.image
      ) || fallbackImage}
      alt={location.title}
      className="resource-card__icon-image"
      onError={(event) => {
        if (event.currentTarget.getAttribute("src") !== fallbackImage) {
          event.currentTarget.src = fallbackImage;
        }
      }}
    />
  )}
</div>

                      <div className="resource-card__body">
                        <h3>{location.title}</h3>
                        <span className="resource-card__arrow">
                          <ChevronLeft size={19} />
                        </span>
                      </div>
                    </>
                  )}
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}


export default function Home() {
  const { i18n } = useTranslation();
const isEnglish = i18n.resolvedLanguage === "en";
  const [content, setContent] = useState<HomeContent>(fallbackHomeContent);
  const [cmsLoading, setCmsLoading] = useState(Boolean(supabase));
  const [pageTitle, setPageTitle] = useState("دليلك داخل HPC");
  useEffect(() => {
    let active = true;
    const loadCmsHome = async () => {
      if (!supabase) return;
      try {
        const { data: page, error: pageError } = await supabase.from("pages").select("id,is_visible").eq("slug", "home").eq("is_visible", true).maybeSingle();
        if (pageError || !page) return;
        const [{ data: sections, error: sectionsError }, { data: items, error: itemsError }] = await Promise.all([
          supabase.from("sections").select("*").eq("page_id", page.id).order("sort_order", { ascending: true }),
          supabase.from("items").select("*").order("sort_order", { ascending: true }),
        ]);
        if (!sectionsError && !itemsError && active && sections?.length) {
  const cmsContent = mapHomeContent(
    (sections ?? []) as Record<string, unknown>[],
    (items ?? []) as Record<string, unknown>[]
  );

  setContent((current) => ({
    ...cmsContent,
    pathways: {
      ...cmsContent.pathways,
      cards: current.pathways.cards
    }
  }));
}
      } catch {
  /* Keep the static homepage snapshot as the safety fallback. */
} finally {
  if (active) setCmsLoading(false);
}
    };
    void loadCmsHome();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    const loadHomePageTitle = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.from("pages").select("title").eq("slug", "home").maybeSingle();
        if (!error && active && typeof data?.title === "string" && data.title.trim()) setPageTitle(data.title.trim());
      } catch { /* Keep the original homepage title as the safety fallback. */ }
    };
    void loadHomePageTitle();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    const loadPublishedRoutes = async () => {
      try {
        const routes = import.meta.env.DEV
  ? await loadRouteRecords()
  : await loadPublishedRouteRecords();

        if (!active || !routes.length) return;

        setContent((current) => ({ ...current, pathways: { ...current.pathways, cards: routes.map(routeToPathway) } }));

      } catch { /* Keep the existing pathway cards as the safety fallback. */ }
    };
    void loadPublishedRoutes();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const onScroll = () => document.documentElement.style.setProperty("--scroll-y", `${window.scrollY}`);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <main className="home-page" dir={isEnglish ? "ltr" : "rtl"} aria-busy={cmsLoading || undefined}>
        <SiteHeader />
        {(cmsLoading || content.visibility.hero) && <Hero />}
        {/* Keep the fallback sections mounted while published content loads. */}
        {content.visibility.about && <About content={content} />}
        {content.visibility.about && <StrategicGoals />}
        <AccompanyingExhibition />
        {content.visibility.pathways && <Pathways content={content} />}
        {content.visibility.resources && <Resources content={content} />}
      </main>
      {!cmsLoading && <SiteFooter />}
    </>
  );
}
