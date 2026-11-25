import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation } from "wouter";
import { Trans, useTranslation } from "react-i18next";
import {
  Check,
  ChevronLeft,
  Clock3,
  Menu,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { locations } from "@/lib/locations";
import PathwaysStats from "@/components/PathwaysStats";
import { fallbackHomeContent, type HomeContent } from "@/lib/homeCms";
import { loadPublishedHome, readHomeSnapshot, readPreparedHome, saveHomeSnapshot, type PublishedHomeLoad } from "@/lib/homeData";
import { supabase } from "@/lib/supabase";
import { getMediaUrl } from "@/lib/mediaUrl";
import { homeScrollStorageKey, readHomeNavigation, type HomeNavigation, type HomeScrollPosition } from "@/lib/homeScroll";
import { PublicShellSnapshotProvider, usePublicShell } from "@/contexts/PublicShellContext";

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
  return (
    <div
      className={`home-reveal ${className}`}
      data-reveal="pending"
      style={{ "--home-reveal-delay": `${delay}ms` } as CSSProperties}
      onClickCapture={onClickCapture}
    >
      {children}
    </div>
  );
}

function Hero() {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === "en";
  const publishedHeaderHeight = usePublicShell()?.shell.header.height;
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
    if (typeof ResizeObserver !== "function") {
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [publishedHeaderHeight]);

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
      id="strategic-goals"
      className="strategic-goals-section"
      dir={isEnglish ? "ltr" : "rtl"}
      lang={isEnglish ? "en" : "ar"}
    >
      <div className="container">
        <h2 className="strategic-goals-title" data-reveal="pending" data-reveal-progress={0.03}>
  {isEnglish ? <>{t("strategicObjectives.headingLead")} <span>{t("strategicObjectives.headingAccent")}</span></> : <>الأهداف <span>الاستراتيجية</span></>}
</h2>

        <div className="strategic-goals-grid">
          {goals.map((goal, index) => (
            <div
              className="strategic-goal"
              key={goal}
              data-reveal="pending"
              data-reveal-progress={0.08 + index * 0.05}
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
          ))}
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
          <div className="statement-card statement-card--vision">
            <div className="statement-number">01</div>
            <div><p className="card-label">{about.visionLabel}</p><h3>{about.visionTitle}</h3><p>{about.visionText}</p></div>
          </div>
          <div className="statement-card statement-card--mission">
            <div className="statement-number">02</div>
            <div><p className="card-label">{about.missionLabel}</p><h3>{about.missionTitle}</h3><p>{about.missionText}</p></div>
          </div>
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
  className={`pathway-card pathway-card--${card.tone} hpc-route-${card.eyebrow.trim()} ${
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
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === "en";
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
            eyebrow={isEnglish ? t("navigation.venue") : content.resources.eyebrow}
            title={
              <>
                {isEnglish ? t("venueGuide.home.titleLead") : content.resources.titleLine1}
                <br />
                <span>{isEnglish ? t("venueGuide.home.titleAccent") : content.resources.titleLine2}</span>
              </>
            }
            description={isEnglish ? t("venueGuide.home.description") : content.resources.description}
          />
        </Reveal>

        <div className="resource-grid">
          {content.resources.cards.map((location, index) => {
            const isTower =
              location.slug === "administrative-tower";
              const isGraduate = location.slug === "postgraduate-studies";
               const isSimulation =
  location.slug === "clinical-simulation-center";
            const cardTitle = isEnglish
              ? t(`venueGuide.venues.${location.slug}.title`, { defaultValue: location.title })
              : location.title;
            const fallbackImage = getMediaUrl(
              locations.find((item) => item.slug === location.slug)?.image
            ) || `${import.meta.env.BASE_URL}images/nearby-map_c38385fb.png`;

            return (
              <Reveal
                key={location.slug}
                delay={
  isTower ? 0 :
  isGraduate ? 70 :
  isSimulation ? 140 :
  index * 70
}


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
  aria-label={t("venueGuide.explore", { title: cardTitle })}
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
      src={`${import.meta.env.BASE_URL}images/tower-card-new.webp`}
      alt={t("venueGuide.venues.administrative-tower.title")}
      className="tower-seamless__base"
    />
  </div>

  <div className="tower-seamless__cap" aria-hidden="true">
    <img
      src={`${import.meta.env.BASE_URL}images/tower-roof-from-original-aligned.webp`}
      alt=""
      className="tower-seamless__roof"
    />
  </div>
</div>

<div className="resource-card__tower-info">
  <h3>{t("venueGuide.venues.administrative-tower.title")}</h3>
</div>

</>
) : (
<>


<div className="resource-card__icon">

{isGraduate ? (
  <div className="graduate-photo-window">
    <img
      src={`${import.meta.env.BASE_URL}images/graduate-studies-card-portrait.webp`}
      alt={isEnglish ? t("venueGuide.venues.postgraduate-studies.title") : "الدراسات العليا"}
      className="graduate-photo-image"
    />
  </div>
) : isSimulation ? (


<>
  {/* الصورة الكاملة داخل البطاقة */}
  <div className="simulation-photo-window">
    <img
      src={`${import.meta.env.BASE_URL}images/clinical-simulation-center.webp`}
      alt={t("venueGuide.venues.clinical-simulation-center.title")}
      className="simulation-photo-base"
    />
  </div>

  {/* طبقة المبنى المعزولة */}
  <img
    src={`${import.meta.env.BASE_URL}images/clinical-simulation-building-cutout.webp`}
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
      alt={cardTitle}
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
                        <h3>{cardTitle}</h3>
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


type HomeLoad = { status: "loading" } | PublishedHomeLoad;

const revealSelector = ".home-reveal[data-reveal], .pathways-history-stats[data-reveal], [data-reveal-progress]";

function getRevealBounds(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const offset = parseFloat(getComputedStyle(element).translate.split(" ")[1]) || 0;
  return { top: rect.top - offset, bottom: rect.bottom - offset, height: rect.height, paintedTop: rect.top };
}

function getRevealOverlap({ top, bottom }: { top: number; bottom: number }, viewportTop: number, viewportBottom: number) {
  return Math.min(viewportBottom, bottom) - Math.max(viewportTop, top);
}

export default function Home({ returning = false }: { returning?: boolean }) {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === "en";
  const publishedShell = usePublicShell();
  const mainRef = useRef<HTMLElement>(null);
  const scheduleRevealUpdate = useRef<(() => void) | null>(null);
  const updateRevealTargets = useRef<(() => void) | null>(null);
  const restoredReveals = useRef(new WeakSet<HTMLElement>());
  const animateSectionEntry = useRef(false);

  const activateSectionReveals = useRef<(() => void) | null>(null);
  const pendingHeaderEntrance = useRef<HTMLElement | null>(null);
  const syncHeaderEntrance = useRef<(() => void) | null>(null);
  
const [navigation] = useState<HomeNavigation>(() => {
  const initial = readHomeNavigation();

  const navigationEntry = performance.getEntriesByType(
    "navigation"
  )[0] as PerformanceNavigationTiming | undefined;

  const reloadOnPathways =
    !returning &&
    navigationEntry?.type === "reload" &&
    initial.hash === "#pathways";

  if (reloadOnPathways) {
    return {
      hash: "#pathways",
      intent: "section",
      headerEntrance: false,
    };
  }

  return initial;
});

  const pendingNavigation = useRef<HomeNavigation | null>(navigation);
  const [prepared] = useState(() => navigation.intent ? readPreparedHome() : undefined);
  const shell = publishedShell ?? prepared?.shell ?? null;
  

const [cached] = useState(() => {
  const internal = returning || Boolean(navigation.intent);

  if (!supabase) return;

  const snapshot = readHomeSnapshot();
  if (!snapshot) return;

  return {
    content: snapshot.content,
    shell:
      internal && publishedShell && !publishedShell.failed
        ? publishedShell
        : snapshot.shell,
    internal: true,
  };
});

  const [load, setLoad] = useState<HomeLoad>(() => prepared?.load ?? (supabase
    ? { status: "loading" }
    : { status: "success", content: fallbackHomeContent }));
  const resolved = shell && load.status !== "loading";
  // A return stays on one layout. Revalidation below prepares the snapshot for the next visit.
  const usingCache = cached && (cached.internal || (load.status !== "empty" && (!resolved || load.status === "error" || shell?.failed)));
  const content = usingCache ? cached.content : resolved
    ? load.status === "success" ? load.content : fallbackHomeContent
    : null;
  const displayShell = usingCache ? cached.shell : resolved ? shell : null;
  const ready = Boolean(content);
  const cmsError = resolved && (load.status === "error" || shell?.failed);
  const cmsEmpty = resolved && load.status === "empty";
  const cmsMessage = cached?.internal ? undefined
    : cmsEmpty ? "common.homeEmpty"
    : !cmsError ? undefined
    : usingCache ? "common.homeCached"
    : load.status === "success" ? "common.homeShellError"
    : "common.homeError";

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    history.scrollRestoration = "manual";
    let entry: string;
    let frame = 0;
let returnFrame1 = 0;
let returnFrame2 = 0;

    const save = () => {
      if (!ready || pendingNavigation.current || history.state?.hpcHomeEntry !== entry) return;
      const y = window.scrollY;
      const headerHeight = main.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;
      const line = (headerHeight + window.innerHeight) / 2;
      const section = Array.from(main.querySelectorAll<HTMLElement>(":scope > section[id]"))
        .find(element => {
          const rect = element.getBoundingClientRect();
          return rect.top <= line && rect.bottom > line;
        });
      const position: HomeScrollPosition = {
        entry,
        sectionId: section?.id,
        offset: section ? -section.getBoundingClientRect().top : 0,
        y,
        hash: window.location.hash,
      };
      try {
        sessionStorage.setItem(`${homeScrollStorageKey}:${entry}`, JSON.stringify(position));
      } catch {
        // Scrolling still works when storage is unavailable.
      }
    };

    const applyNavigation = () => {
      const target = pendingNavigation.current;
      
if (
  target &&
  !ready &&
  (
    target.headerEntrance ||
    (target.scroll?.y ?? 0) > 0 ||
    (target.hash && target.hash !== "#hero")
  )
) {
  return;
}


      const savedEntry = target?.intent ? undefined : history.state?.hpcHomeEntry;
      entry = savedEntry ?? crypto.randomUUID?.() ?? String(Date.now());
      // The boot script defers the native fragment until the CMS sections exist.
      if (history.state?.hpcHomeEntry !== entry || target?.intent || history.state?.hpcPendingHomeHash) {
        const { hpcPendingHomeHash, hpcHomeIntent, hpcHeaderEntrance, ...state } = history.state ?? {};
        const hash = target?.hash ?? window.location.hash;
        history.replaceState({ ...state, hpcHomeEntry: entry }, "", location.pathname + location.search + hash);
      }

      if (target) {
        const saved = target.scroll;
        let top = saved?.y ?? 0;
        const header = main.querySelector(".site-header");
        const savedSection = saved?.sectionId ? document.getElementById(saved.sectionId) : null;
        const section = !saved && target.hash && target.hash !== "#hero"
          ? document.getElementById(target.hash.slice(1))
          : null;

        if (savedSection && saved && saved.y > 0 && Number.isFinite(saved.offset)) {
          top = window.scrollY + savedSection.getBoundingClientRect().top + saved.offset;
        } else if (section) {
          const headerHeight = header?.getBoundingClientRect().height ?? 0;
          top = window.scrollY + section.getBoundingClientRect().top - headerHeight;
        }

        

const isSectionRefresh =
  target === navigation &&
  ["#pathways", "#about", "#resources"].includes(target.hash) &&
  (
    performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined
  )?.type === "reload";

const smoothArrival =
  (returning || isSectionRefresh) &&
  (target.intent === "section" || isSectionRefresh) &&
  section !== null &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;


if (smoothArrival) {
  const sectionId = section.id;

  // Start at the homepage Hero without reloading the document.
  window.scrollTo({
    top: 0,
    behavior: "instant",
  });

  // Allow Home to paint before starting the smooth scroll.
  returnFrame1 = requestAnimationFrame(() => {
    returnFrame2 = requestAnimationFrame(() => {
      const destination = document.getElementById(sectionId);
      if (!destination) return;

      const headerHeight =
        main.querySelector(".site-header")
          ?.getBoundingClientRect().height ?? 0;

      const destinationTop =
        window.scrollY +
        destination.getBoundingClientRect().top -
        headerHeight;

      window.scrollTo({
        top: Math.max(0, destinationTop),
        behavior: "smooth",
      });
    });
  });

} else if (
  Math.abs(window.scrollY - Math.max(0, top)) > 0.5
) {
  window.scrollTo({
    top: Math.max(0, top),
    behavior: "instant",
  });
}

        const entrance = target.headerEntrance && ready
          ? section ?? (target.intent === "top" ? main.querySelector<HTMLElement>("#hero") : null)
          : null;
        pendingHeaderEntrance.current = entrance;
        
animateSectionEntry.current =
  target.intent === "section" && !entrance;
        syncHeaderEntrance.current?.();

        
if (animateSectionEntry.current) {
  const activate = activateSectionReveals.current;
  if (section && activate) {
    const elements =
  section.querySelectorAll<HTMLElement>(revealSelector);

            elements.forEach(element => {
              restoredReveals.current.delete(element);
              element.dataset.reveal = "pending";
            });
            // A quick return can find the previous exit still fading out.
            // Start the entrance from the painted pending state.
            elements.forEach(element => {
              const stats = element.classList.contains("pathways-history-stats");
              const properties = stats ? ["opacity", "transform"] : ["opacity", "translate", "filter"];
              element.getAnimations?.({ subtree: stats }).forEach(animation => {
                if ("transitionProperty" in animation && properties.includes(String(animation.transitionProperty))) {
                  animation.finish();
                }
              });
            });
            activate();
          }
        } else if (!entrance && window.scrollY > 0) {
          const viewportTop = header?.getBoundingClientRect().bottom ?? 0;
          const viewportBottom = window.innerHeight;

          main.querySelectorAll<HTMLElement>(revealSelector).forEach(element => {
            if (
              getRevealOverlap(
                getRevealBounds(element),
                viewportTop,
                viewportBottom
              ) > 0
            ) {
              restoredReveals.current.add(element);
              element.dataset.reveal = "instant";
            }
          });

          scheduleRevealUpdate.current?.();
        }

        pendingNavigation.current = null;
      }
      save();
    };

 
let lastHeaderHash: string | null = null;
let dedupeFrame = 0;

const handleHistory = (event: Event) => {
  if (
    location.pathname.replace(/\/+$/, "") !==
    import.meta.env.BASE_URL.replace(/\/+$/, "")
  ) {
    return;
  }

  if (event.type === "hpc:home-navigation") {
    const detail = (event as CustomEvent<HomeNavigation>).detail;
    const requested = detail?.intent
      ? detail
      : readHomeNavigation();

    if (!requested.intent || lastHeaderHash === requested.hash) {
      return;
    }

    lastHeaderHash = requested.hash;

    dedupeFrame = requestAnimationFrame(() => {
      lastHeaderHash = null;
      dedupeFrame = 0;
    });

    pendingNavigation.current = requested;
  } else {
    pendingNavigation.current = readHomeNavigation();
  }

  applyNavigation();
};

const scheduleSave = () => {
  if (frame) return;

  frame = requestAnimationFrame(() => {
    frame = 0;
    save();
  });
};


    applyNavigation();
    window.addEventListener("hpc:home-navigation", handleHistory);
    window.addEventListener("hpc:save-home-position", save);
    window.addEventListener("popstate", handleHistory);
    window.addEventListener("scroll", scheduleSave, { passive: true });
    window.addEventListener("pagehide", save);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(returnFrame1);
cancelAnimationFrame(returnFrame2);
      window.removeEventListener("hpc:home-navigation", handleHistory);
      window.removeEventListener("hpc:save-home-position", save);
      window.removeEventListener("popstate", handleHistory);
      window.removeEventListener("scroll", scheduleSave);
      window.removeEventListener("pagehide", save);
    };
  }, [ready]);

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main || !ready) return;

    const header = main.querySelector(".site-header");
    let targets = new Set<HTMLElement>();
    let goals: Element | null = null;
    let stats: Element | null = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const positioned = restoredReveals.current;

    let frame = 0;
    let firstPaintFrame = 0;
    let activationFrame = 0;

    let allowRevealUpdate = true;
    const headerAnimations = new Map<HTMLElement, Animation>();

    const stopHeaderAnimation = (element: HTMLElement, animation: Animation) => {
      animation.onfinish = null;
      animation.cancel();
      headerAnimations.delete(element);
      delete element.dataset.headerEntrance;
    };
    const stopHeaderAnimations = () => {
      headerAnimations.forEach((animation, element) => stopHeaderAnimation(element, animation));
    };
    
const playHeaderAnimation = (element: HTMLElement) => {
  const isHero = element.classList.contains("hero-film__copy");

  
const animation = element.animate(
  isHero
    ? [
        {
          opacity: 0.15,
          translate: "0 32px",
          filter: "blur(4px)",
        },
        {
          opacity: 1,
          translate: "0 0px",
          filter: "blur(0px)",
        },
      ]
    : [
        {
          opacity: 0.78,
          translate: "0 16px",
        },
        {
          opacity: 1,
          translate: "0 0px",
        },
      ],
  {
    duration: isHero ? 900 : 400,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "both",
  }
);


  headerAnimations.set(element, animation);

  animation.onfinish = () => {
    stopHeaderAnimation(element, animation);
  };
};


    const update = () => {
      frame = 0;

      // Let the browser paint the pending state first.
      // Otherwise the elements may appear without transition.
      if (!allowRevealUpdate) return;

      const section = pendingHeaderEntrance.current;
      pendingHeaderEntrance.current = null;
      if (reducedMotion.matches) stopHeaderAnimations();
      const entrance = section && !reducedMotion.matches && typeof section.animate === "function" ? section : null;
      const intro = entrance?.querySelector<HTMLElement>(".hero-film__copy, .home-reveal:has(> .section-heading)");
      const viewportTop = header?.getBoundingClientRect().bottom ?? 0;
      const viewportBottom = window.innerHeight;
      // Preserve the statistics observer's 5% bottom margin, which was relative to root width.
      const statsBottom = viewportBottom - document.documentElement.clientWidth * 0.05;
      const goalsRect = goals?.getBoundingClientRect();
      const goalsProgress = goalsRect ? (viewportBottom - goalsRect.top) / (viewportBottom + goalsRect.height) : 0;
      const elements = Array.from(targets);
      const next = elements.map(element => {
        if (reducedMotion.matches) return "instant";
        const trigger = element.dataset.revealProgress;
        const bounds = getRevealBounds(element);
        const bottom = element === stats ? statsBottom : viewportBottom;
        const entering = element.dataset.reveal === "pending";
        const minimumOverlap = entering ? Math.min(24, bounds.height * 0.16) : 0;
        // A card hidden behind the header has left the visible viewport. Measure its layout
        // bounds on exit so its own transition cannot bring it back into view.
        const visible = trigger !== undefined
          ? goalsProgress >= Number(trigger)
          : getRevealOverlap(bounds, viewportTop, bottom) > minimumOverlap
            && (!entering || element === intro || bounds.paintedTop < bottom);

        // Release restored visibility when the element leaves the viewport.
        if (entrance?.contains(element)) positioned.delete(element);
        if (positioned.has(element)) {
          const stillOnScreen =
            getRevealOverlap(
              bounds,
              viewportTop,
              viewportBottom
            ) > 0;

          if (stillOnScreen) {
            return "instant";
          }

          positioned.delete(element);
          return "pending";
        }

        return visible ? "revealed" : "pending";

      });
      elements.forEach((element, index) => {
        const animate = next[index] === "revealed" && (element === intro || (element === stats && entrance?.contains(element)));
        const active = headerAnimations.get(element);
        if (active && next[index] !== "revealed") stopHeaderAnimation(element, active);
        if (animate) element.dataset.headerEntrance = "";
        if (element.dataset.reveal !== next[index]) element.dataset.reveal = next[index];
        if (animate) playHeaderAnimation(element);
      });
      if (intro && entrance?.id === "hero") {
        // A fresh Home mount also starts the Hero copy's own entrance.
        // Settle that copy before animating it for this header click.
        intro.getAnimations({ subtree: true }).forEach(animation => {
          if ("animationName" in animation && animation.animationName === "hero-copy-enter") animation.finish();
        });
        intro.dataset.headerEntrance = "";
        playHeaderAnimation(intro);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    scheduleRevealUpdate.current = schedule;

    const syncEntrance = () => {
      stopHeaderAnimations();
      if (!pendingHeaderEntrance.current) return;
      cancelAnimationFrame(firstPaintFrame);
      cancelAnimationFrame(activationFrame);
      cancelAnimationFrame(frame);
      allowRevealUpdate = true;
      update();
    };
    syncHeaderEntrance.current = syncEntrance;

    const activateAfterPaint = () => {
      allowRevealUpdate = false;
      cancelAnimationFrame(firstPaintFrame);
      cancelAnimationFrame(activationFrame);
      firstPaintFrame = requestAnimationFrame(() => {
        activationFrame = requestAnimationFrame(() => {
          allowRevealUpdate = true;
          animateSectionEntry.current = false;
          schedule();
        });
      });
    };
    activateSectionReveals.current = activateAfterPaint;
    if (animateSectionEntry.current) activateAfterPaint();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);
    const revealObserver = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(schedule, { threshold: 0.16 })
      : null;
    updateRevealTargets.current = () => {
      const next = new Set(main.querySelectorAll<HTMLElement>(revealSelector));
      targets.forEach(element => {
        if (!next.has(element) && element.dataset.revealProgress === undefined) revealObserver?.unobserve(element);
      });
      next.forEach(element => {
        if (!targets.has(element) && element.dataset.revealProgress === undefined) revealObserver?.observe(element);
      });
      targets = next;
      goals = main.querySelector("#strategic-goals");
      stats = main.querySelector(".pathways-history-stats[data-reveal]");
      if (pendingHeaderEntrance.current) syncEntrance();
      else schedule();
    };

    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
    resizeObserver?.observe(main);
    if (header) resizeObserver?.observe(header);
    return () => {
      scheduleRevealUpdate.current = null;
      updateRevealTargets.current = null;
      activateSectionReveals.current = null;
      syncHeaderEntrance.current = null;
      stopHeaderAnimations();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(firstPaintFrame);
      cancelAnimationFrame(activationFrame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", schedule);
      revealObserver?.disconnect();
      resizeObserver?.disconnect();
    };
  }, [ready]);

  useLayoutEffect(() => {
    updateRevealTargets.current?.();
  }, [content]);

  useLayoutEffect(() => {
    if (!supabase || !resolved) return;
    if (load.status === "success" && shell && !shell.failed) {
      saveHomeSnapshot({ content: load.content, shell });
    } else if (load.status === "empty") {
      saveHomeSnapshot();
    }
  }, [load, resolved, shell]);

  useEffect(() => {
    if (!supabase || prepared) return;
    const controller = new AbortController();
    void loadPublishedHome(controller.signal).then(result => {
      if (!controller.signal.aborted) setLoad(result);
    });

    return () => controller.abort();
  }, [prepared]);

  useLayoutEffect(() => {
  if (ready) {
    document.documentElement.removeAttribute("data-home-boot");
  }
}, [ready]);

if (!ready) {
  return null;
}
  
  return (
    <PublicShellSnapshotProvider value={displayShell}>
      <main
        ref={mainRef}
        className="home-page"
        dir={isEnglish ? "ltr" : "rtl"}
        aria-busy={!ready || undefined}
      >
        <SiteHeader contentReady={ready} />
        {content?.visibility.hero && <Hero />}
        {content && (
          <>
            {content.visibility.about && <About content={content} />}
            {content.visibility.about && <StrategicGoals />}
            <AccompanyingExhibition />
            {content.visibility.pathways && <Pathways content={content} />}
            {content.visibility.resources && <Resources content={content} />}
          </>
        )}
        {cmsMessage && <p className="container home-cms-status" role="status">{t(cmsMessage)}</p>}
      </main>
      {content && <SiteFooter />}
    </PublicShellSnapshotProvider>
  );
}
