import { useLayoutEffect, useRef, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./VenueDetail.css";

type VenueDetailProps = {
  venue: string;
  title: string;
  titleId?: string;
  description: string;
  image: string;
  imageAlt: string;
  backLabel?: string;
  eyebrow?: string;
  children: ReactNode;
};

export default function VenueDetail({
  venue,
  title,
  titleId = "venue-page-title",
  description,
  image,
  imageAlt,
  backLabel,
  eyebrow,
  children,
}: VenueDetailProps) {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === "en";
  const BackArrow = isEnglish ? ArrowLeft : ArrowRight;
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const elements = mainRef.current?.querySelectorAll("[data-venue-reveal]");
    if (
      !elements ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof window.IntersectionObserver !== "function"
    ) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle("hpc-in-view", entry.isIntersecting);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });

    elements.forEach(element => {
      element.classList.add("hpc-scroll-reveal");
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      elements.forEach(element => {
        element.classList.remove("hpc-scroll-reveal", "hpc-in-view");
      });
    };
  }, [venue]);

  return (
    <>
      <main
        ref={mainRef}
        className="venue-detail"
        data-venue={venue}
        dir={isEnglish ? "ltr" : "rtl"}
        lang={isEnglish ? "en" : "ar"}
      >
        <SiteHeader />
        <section className="venue-hero" aria-labelledby={titleId}>
          <div className="venue-hero__media">
            <img src={image} alt={imageAlt} />
          </div>
          <div className="venue-hero__copy" data-venue-reveal>
            <Link className="detail-back venue-hero__back" href="/#resources">
              <BackArrow size={16} />
              <bdi>{backLabel ?? t("venueGuide.back")}</bdi>
            </Link>
            {eyebrow && <p className="venue-hero__eyebrow"><bdi>{eyebrow}</bdi></p>}
            <h1 id={titleId}><bdi>{title}</bdi></h1>
            <p className="venue-hero__description"><bdi>{description}</bdi></p>
          </div>
        </section>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

type VenueMapProps = {
  venueName: string;
  query: string;
  sectionLabel: string;
  frameTitle: string;
};

export function VenueMap({ venueName, query, sectionLabel, frameTitle }: VenueMapProps) {
  const { t } = useTranslation();
  const encodedQuery = encodeURIComponent(query);

  return (
    <section className="venue-section" aria-label={sectionLabel}>
      <div className="venue-section__inner">
        <h2 className="venue-section__heading" data-venue-reveal>
          <bdi>{t("venueGuide.map.heading")} <span>{venueName}</span></bdi>
        </h2>
        <div data-venue-reveal>
          <div className="venue-card venue-map">
            <div className="venue-map__header">
              <div className="venue-map__label">
                <MapPin size={20} />
                <bdi>{t("venueGuide.map.label")}</bdi>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodedQuery}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <bdi>{t("venueGuide.map.open")}</bdi>
                <ExternalLink size={17} />
              </a>
            </div>
            <iframe
              src={`https://www.google.com/maps?q=${encodedQuery}&z=17&output=embed`}
              title={frameTitle}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
