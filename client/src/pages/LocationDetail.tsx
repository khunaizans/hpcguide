import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useRoute } from "wouter";
import { getLocation } from "@/lib/locations";
import VenueDetail from "./VenueDetail";

export default function LocationDetail() {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === "en";
  const [, params] = useRoute<{ slug: string }>("/locations/:slug");
  const location = params ? getLocation(params.slug) : undefined;

  if (!location) {
    return (
      <main className="pathway-not-found" lang={isEnglish ? "en" : "ar"}>
        <h1><bdi>{t("venueGuide.notFound")}</bdi></h1>
        <Link href="/#resources"><bdi>{t("venueGuide.backToMap")}</bdi></Link>
      </main>
    );
  }

  const copy = `venueGuide.venues.${location.slug}`;
  const title = isEnglish ? t(`${copy}.title`, { defaultValue: location.title }) : location.title;

  return (
    <VenueDetail
      venue={location.slug}
      title={title}
      description={isEnglish ? t(`${copy}.heroDescription`, { defaultValue: location.details }) : location.details}
      image={location.image}
      imageAlt={title}
      backLabel={t("venueGuide.backToMap")}
      eyebrow={t("navigation.venue")}
    >
      <section className="venue-section">
        <div className="venue-section__inner">
          <div data-venue-reveal>
            <p className="venue-section__label"><bdi>{t("venueGuide.details.label")}</bdi></p>
            <h2 className="venue-section__heading">
              <bdi>{t("venueGuide.details.titleLead")}<br /><span>{t("venueGuide.details.titleAccent")}</span></bdi>
            </h2>
            <p className="venue-section__description"><bdi>{isEnglish ? t(`${copy}.description`, { defaultValue: location.description }) : location.description}</bdi></p>
          </div>
          <ul className="venue-section__cards" role="list">
            {location.highlights.map((highlight, index) => (
              <li key={highlight} data-venue-reveal>
                <div className="venue-card venue-highlight">
                  <span aria-hidden="true"><Check size={15} /></span>
                  <bdi>{isEnglish ? t(`${copy}.highlights.${index}`, { defaultValue: highlight }) : highlight}</bdi>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </VenueDetail>
  );
}