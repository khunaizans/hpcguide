import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowDown,
  ArrowUpLeft,
  Check,
  ChevronLeft,
  Clock3,
  Menu,
  Sparkles,
} from "lucide-react";
import { pathwayCards } from "@/lib/pathways";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { locations } from "@/lib/locations";
import { fallbackHomeContent, HomeContent, mapHomeContent } from "@/lib/homeCms";
import { loadPublishedRouteRecords, routeToPathway } from "@/lib/routesCms";
import { supabase } from "@/lib/supabase";
import { getMediaUrl } from "@/lib/mediaUrl";
const ASSETS = {
  hero: "/images/hpc-hero_4791d5fd.png",
  logo: "/images/hpc-logo_739bab33.png",
  send: "/images/send_39c5f246.png",
  event1: "/images/event-1_a532ed68.png",
  event2: "/images/event-2_e3b688f1.png",
  event3: "/images/event-3_b7dba0a3.png",
  event4: "/images/event-4_6dab0775.png",
  event5: "/images/event-5_3b846531.png",
  event6: "/images/event-6_69c277ce.png",
};

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


function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark ${compact ? "brand-mark--compact" : ""}`}>
      <img src={ASSETS.logo} alt="مؤتمر التخصصات الصحية" />
      {!compact && <span>Health Professions Conference</span>}
    </div>
  );
}

function VisualFallback({ variant = "hero", label }: { variant?: string; label?: string }) {
  return <div className={`visual-fallback visual-fallback--${variant}`} role="img" aria-label={label || "هوية مؤتمر التخصصات الصحية"}><span className="visual-fallback__core">{variant === "hero" ? "HPC" : "AI"}</span><span className="visual-fallback__orbit visual-fallback__orbit--one" /><span className="visual-fallback__orbit visual-fallback__orbit--two" /><span className="visual-fallback__spark visual-fallback__spark--one" /><span className="visual-fallback__spark visual-fallback__spark--two" /><small>{label || "Health Professions Conference"}</small></div>;
}

function Hero({ content, pageTitle }: { content: HomeContent; pageTitle: string }) {
  const titleParts = pageTitle.trim().match(/^(.*?)(HPC.*)$/i);
  return (
    <section id="hero" className="hero-section">
      <div className="hero-grid" />
      <div className="ai-pattern" aria-hidden="true">
        <span className="ai-node ai-node--one" /><span className="ai-node ai-node--two" /><span className="ai-node ai-node--three" />
        <span className="ai-node ai-node--four" /><span className="ai-node ai-node--five" /><span className="ai-node ai-node--six" />
        <span className="ai-core">AI</span>
      </div>
      <div className="hero-orb hero-orb--one" />
      <div className="hero-orb hero-orb--two" />
      <div className="hero-topline"><span>{content.hero.topRight}</span><span>{content.hero.topLeft}</span></div>
      <div className="hero-content">
        <Reveal className="hero-brand">
          <LogoMark />
        </Reveal>
        <Reveal delay={80} className="hero-copy">
          <p className="hero-kicker">{content.hero.kicker}</p>
          <h1 style={{ marginRight: "79px" }}><span className="hero-title-lead">{titleParts?.[1].trimEnd() ?? content.hero.titleLead}</span> <em className="hero-title-accent" style={{ marginRight: "187px" }}>{titleParts?.[2] ?? content.hero.titleAccent}</em></h1>
          <p className="hero-description">{content.hero.description}</p>
          <div className="hero-actions">
          </div>
        </Reveal>
        <Reveal delay={180} className="hero-visual-wrap">
          <img className="hero-visual hero-visual--xd" src={getMediaUrl(content.hero.image || ASSETS.hero)} alt={content.hero.imageAlt || "فريق من المختصين الصحيين يعملون معاً"} />
          <div className="hero-float hero-float--left"><span>6</span><small>مسارات للتعلم<br />والمشاركة</small></div>
          <div className="hero-float hero-float--right"><Sparkles size={16} /><small>فكرة<br />تتحول إلى أثر</small></div>
        </Reveal>
      </div>
      <a className="scroll-cue" href="#about"><span>مرر للاستكشاف</span><ArrowDown size={18} /></a>
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
      dir="rtl"
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
  الأهداف <span>الاستراتيجية</span>
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

                <p>{goal}</p>
        </div>
      );
    })}
      </div>
    </div>
  </section>
);
}

function About({ content }: { content: HomeContent }) {
  return (
    <section id="about" className="about-section section-pad">
      <div className="section-pattern research-pattern" aria-hidden="true"><span /><span /><span /><i>R</i></div>
      <div className="container about-layout">
        <Reveal className="about-title">
          <SectionHeading
  eyebrow={content.about.eyebrow}
  title={
    content.about.titleLine1?.trim() || content.about.titleLine2?.trim() ? (
      <>
        {content.about.titleLine1}
        <br />
        <span>{content.about.titleLine2}</span>
      </>
    ) : null
  }
  description={
  content.about.description
    .split(/(الحادي عشر|الحادية عشر|الحادية عشرة)/g)
    .map((part, index) =>
      ["الحادي عشر", "الحادية عشر", "الحادية عشرة"].includes(part) ? (
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
            <div><p className="card-label">{content.about.visionLabel}</p><h3>{content.about.visionTitle}</h3><p>{content.about.visionText}</p></div>
            <ArrowUpLeft className="card-arrow" size={23} />
          </Reveal>
          <Reveal delay={180} className="statement-card statement-card--mission">
            <div className="statement-number">02</div>
            <div><p className="card-label">{content.about.missionLabel}</p><h3>{content.about.missionTitle}</h3><p>{content.about.missionText}</p></div>
            <ArrowUpLeft className="card-arrow" size={23} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function AccompanyingExhibition() {
  return (
    <section
      id="accompanying-exhibition"
      className="accompanying-exhibition"
      dir="rtl"
    >
      <div className="container">
        <Reveal className="exhibition-content">
          <div className="exhibition-heading">
            <h2>المعرض المصاحب</h2>
            <h3></h3>
          </div>

          <div className="exhibition-intro">
            <p>

يتضمن معرض مؤتمر التخصصات الصحية{" "}
<span className="exhibition-highlight">الحادي عشر</span>{" "}
              أركانًا متعددة تسلط الضوء على أحدث التطورات
              وتطبيقات الذكاء الاصطناعي والتقنيات الحديثة
              في المجال الصحي. مجموعة من اللقاءات تهدف إلى
              تعزيز التفاعل المباشر بين المشاركين والخبراء،
              واستعراض كيف يسهم الذكاء الاصطناعي وتقنيات
              المستقبل في إعادة تشكيل الممارسة الصحية
              والارتقاء بها.
            </p>
          </div>

          <p className="exhibition-details">
            من خلال هذه اللقاءات، يحصل المشاركون على فرصة
            مميزة لتبادل الأفكار والنقاشات حول أحدث التطورات
            العلمية والتوجهات المستقبلية للذكاء الاصطناعي.
            كما تسهم هذه الجلسات في توسيع شبكة العلاقات
            المهنية، والاستفادة من خبرات وتجارب المتحدثين،
            مما يثري المعرفة ويساعد في بناء رؤية أعمق
            للتخصصات المختلفة وانتشارها بشكل أوسع عبر
            وسائل التواصل الاجتماعي.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Pathways({ content }: { content: HomeContent }) {

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
        <Reveal><SectionHeading eyebrow={content.pathways.eyebrow} title={<>{content.pathways.titleLine1}<br /><span>{content.pathways.titleLine2}</span></>} description={content.pathways.description} light /></Reveal>
        <div className="pathway-grid">
          {content.pathways.cards.map((card, index) => (

<Reveal
  key={card.eyebrow}
  delay={index * 65}
  className={`pathway-card pathway-card--${card.tone} ${
    touchedCard === index ? "mobile-touched" : ""
  }`}
  onClickCapture={(event) => {
    const isTouchDevice = window.matchMedia(
      "(hover: none) and (pointer: coarse)"
    ).matches;

    if (!isTouchDevice) return;

    event.preventDefault();
    event.stopPropagation();

    if (navigationTimer.current !== null) return;

    setTouchedCard(index);

    navigationTimer.current = setTimeout(() => {
      window.location.assign(card.link_url);
    }, 200);
  }}
>

              <div className="pathway-image-wrap"><img
 src={(() => {
  const image = card.image || "";

  if (image.startsWith("http")) return image;

  const path = image.replace(/^\/manus-storage\//, "/images/");

  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
})()}
  alt={card.title}
  className="pathway-image"
/>
 /<span className="pathway-index">{card.eyebrow}</span></div>

<div className="pathway-body">
  <p>{card.title}</p>
  <span>{card.text}</span>
</div>

<Link
  href={card.link_url}
  className="pathway-card__click-layer"
  aria-label={`استكشف ${card.title}`}
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
              const isGraduate =
               location.title.includes("الدراسات العليا");
               const isSimulation =
  location.slug === "clinical-simulation-center";

            return (
              <Reveal
                key={location.slug}
                delay={index * 70}

className={`resource-card ${
  isTower ? "resource-card--tower" : ""
} ${
  isGraduate ? "resource-card--graduate" : ""
} ${
  isTower && towerRaised ? "is-raised" : ""
  }${isSimulation ? "resource-card--simulation" : ""
}`}

              >
                <Link
                  href={location.link_url}
                  className="resource-card__link"
                  aria-label={`استكشف ${location.title}`}
                  onClick={(event) => {
                    if (!isTower) return;

                    const isTouch = window.matchMedia(
                      "(hover: none) and (pointer: coarse)"
                    ).matches;

                    if (isTouch && !towerRaised) {
                      event.preventDefault();
                      setTowerRaised(true);
                    }
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
      src={
        location.image?.includes("supabase.com/dashboard/")
          ? `/images/${location.image.split("website").pop()}`
          : location.image?.replace(
              "/manus-storage/",
              "/images/"
            )
      }
      alt={location.title}
      className="resource-card__icon-image"
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
        const routes = await loadPublishedRouteRecords();

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
if (cmsLoading) {
  return (
    <main dir="rtl">
      <SiteHeader />
      <div style={{ minHeight: "100vh" }} />
      <SiteFooter />
    </main>
  );
}
  return <main dir="rtl"><SiteHeader />{content.visibility.hero && <Hero content={content} pageTitle={pageTitle} />}{content.visibility.about && <About content={content} />}{content.visibility.about && <StrategicGoals />}<AccompanyingExhibition />{content.visibility.pathways && <Pathways content={content} />}{content.visibility.resources && <Resources content={content} />}<SiteFooter /></main>;
}
