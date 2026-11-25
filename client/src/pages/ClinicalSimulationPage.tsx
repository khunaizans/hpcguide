import { useTranslation } from "react-i18next";
import VenueDetail, { VenueMap } from "./VenueDetail";

export default function ClinicalSimulationPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "venueGuide.venues.clinical-simulation-center" });
  const title = t("title");

  return (
    <VenueDetail
      venue="clinical-simulation-center"
      title={title}
      titleId="simulation-page-title"
      description={t("heroDescription")}
      image={`${import.meta.env.BASE_URL}images/clinical-simulation-center.webp`}
      imageAlt={t("imageAlt")}
    >
      <VenueMap
        venueName={title}
        query="Riyadh Clinical Simulation Center, Ar Rimayah, Riyadh, Saudi Arabia"
        sectionLabel={t("mapSection")}
        frameTitle={t("mapTitle")}
      />
    </VenueDetail>
  );
}