import { useEffect, useState, type MouseEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { getPathway, type Pathway } from "@/lib/pathways";
import { loadPublishedRoute, routeToPathway } from "@/lib/routesCms";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ResearchOpportunityDetail from "@/pages/ResearchOpportunityDetail";
import ScientificProgramDetail from "@/pages/ScientificProgramDetail";
import PosterOralDetail from "@/pages/PosterOralDetail";
import ScientificDebatesDetail from "@/pages/ScientificDebatesDetail";
import ClinicalSkillsDetail from "@/pages/ClinicalSkillsDetail";
import ThreeMTDetail from "@/pages/ThreeMTDetail";
import VisualResearchDetail from "@/pages/VisualResearchDetail";


function DetailVisual({ tone, title }: { tone: string; title: string }) {
  return <div className={`visual-fallback visual-fallback--${tone}`} role="img" aria-label={title}><span className="visual-fallback__core">AI</span><span className="visual-fallback__orbit visual-fallback__orbit--one" /><span className="visual-fallback__orbit visual-fallback__orbit--two" /><span className="visual-fallback__spark visual-fallback__spark--one" /><span className="visual-fallback__spark visual-fallback__spark--two" /></div>;
}

export default function PathwayDetail() {
  const [, params] = useRoute<{ slug: string }>("/pathways/:slug");
  const [, navigate] = useLocation();
  const basePathway = params ? getPathway(params.slug) : undefined;
  const [pathway, setPathway] = useState<Pathway | undefined>(basePathway);
  useEffect(() => { if (!params?.slug || params.slug === "research-opportunities") return; void loadPublishedRoute(params.slug).then((route) => { if (route) setPathway(routeToPathway(route)); }); }, [params?.slug]);

/* Shared scroll animation for pathway pages */
useEffect(() => {
  // Scientific Program already has its own animation
  if (!pathway || pathway.slug === "scientific-program") {
    return;
  }

  if (
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  ) {
    return;
  }

  const observed = new Set<HTMLElement>();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle(
          "hpc-in-view",
          entry.isIntersecting
        );
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -5% 0px",
    }
  );

  const observeElements = () => {
    const elements = document.querySelectorAll<HTMLElement>(
      [
        "main section h1",
        "main section h2",
        "main section h3",
        "main section p",
        "main section [class*='-card']",
        "main section .detail-highlights",
        "main section .research-cta",
      ].join(", ")
    );

    elements.forEach((element) => {
      if (
        observed.has(element) ||
        element.closest(
          ".hpc-scroll-reveal, .reveal, " +
          ".scientific-reveal, .research-timeline__event"
        )
      ) {
        return;
      }

      observed.add(element);
      element.classList.add("hpc-scroll-reveal");
      observer.observe(element);
    });
  };

  observeElements();

  // Also detect content loaded later from Supabase
  const mutationObserver = new MutationObserver(
    observeElements
  );

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return () => {
    mutationObserver.disconnect();
    observer.disconnect();

    observed.forEach((element) => {
      element.classList.remove(
        "hpc-scroll-reveal",
        "hpc-in-view"
      );
    });
  };
}, [pathway?.slug]);

  const returnToPathways = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate("/");
    window.setTimeout(() => document.getElementById("pathways")?.scrollIntoView({ behavior: "smooth" }), 40);
  };

if (params?.slug?.startsWith("custom-")) {
  return <VisualResearchDetail />;
}
  if (!pathway) {
    return <main className="pathway-not-found" dir="rtl"><h1>المسار غير موجود</h1><Link href={`${import.meta.env.BASE_URL}#pathways`}>العودة إلى المسارات</Link></main>;
  }

  if (pathway.slug === "research-opportunities") return <ResearchOpportunityDetail />;
  if (pathway.slug === "scientific-program") return <ScientificProgramDetail />;
  if (pathway.slug === "posters-research") return <PosterOralDetail />;
  if (pathway.slug === "scientific-debates") return <ScientificDebatesDetail />;
if (pathway.slug === "clinical-skills") {
  return <ClinicalSkillsDetail />;
}

if (pathway.slug === "3mt") {
  return <ThreeMTDetail />;
}

  return (
    <main className="pathway-detail" dir="rtl">
      <SiteHeader />
      <div className="detail-pattern detail-pattern--top" aria-hidden="true"><span /><span /><span /><i>AI</i></div>
      <section className={`detail-hero detail-hero--${pathway.tone}`}>
        <div className="detail-hero-copy">
          <a className="detail-back" href={`${import.meta.env.BASE_URL}#pathways`} onClick={returnToPathways}><ArrowRight size={16} /> الرجوع إلى المسارات</a>
          <p className="eyebrow"><span /> المسار {pathway.eyebrow}</p>
          <h1>{pathway.title}</h1>
          <p>{pathway.details}</p>
        </div>
        <div className="detail-image-wrap"><img src={pathway.image} alt={pathway.title} /></div>
      </section>
      <section className="detail-content">
        <div className="detail-pattern detail-pattern--content" aria-hidden="true"><span /><span /><span /><i>R</i></div>
        <div><p className="detail-label">لماذا هذا المسار؟</p><h2>مساحتك لتتعلم<br /><span>وتصنع أثراً</span></h2></div>
        <div className="detail-highlights">{pathway.highlights.map((highlight) => <div className="detail-highlight" key={highlight}><span><Check size={15} /></span><p>{highlight}</p></div>)}</div>
      </section>
      <SiteFooter />
    </main>
  );
}
