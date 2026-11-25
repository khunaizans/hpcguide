import { useTranslation } from "react-i18next";
import VenueDetail, { VenueMap } from "./VenueDetail";

export default function GraduateStudiesPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "venueGuide.venues.postgraduate-studies" });
  const title = t("title");

  return (
    <VenueDetail
      venue="postgraduate-studies"
      title={title}
      titleId="graduate-page-title"
      description={t("heroDescription")}
      image={`${import.meta.env.BASE_URL}images/graduate-studies-hero-optimized.webp`}
      imageAlt={title}
    >
      <VenueMap
        venueName={title}
        query="مبنى الدراسات العليا جامعة الملك سعود بن عبدالعزيز للعلوم الصحية الرياض"
        sectionLabel={t("mapSection")}
        frameTitle={t("mapTitle")}
      />
    </VenueDetail>
  );
}