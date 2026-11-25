import { useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import VenueDetail, { VenueMap } from "./VenueDetail";
import "./AdministrativeTowerPage.css";

const MEDIA = {
  tower: `${import.meta.env.BASE_URL}images/administrative-tower-hero1.png`,
  planOne: `${import.meta.env.BASE_URL}images/tower-plan-1.png`,
  planTwo: `${import.meta.env.BASE_URL}images/tower-plan-2.png`,
};

function PlanImage({ src, label }: { src: string; label: string }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [zoom, setZoom] = useState(1);

  return (
    <>
      <div className="venue-card tower-plan__media">
        {failed ? (
          <div className="tower-plan__empty" role="status">
            <ImageIcon size={30} />
            <bdi>{label}</bdi>
            <bdi><small>{t("venueGuide.floorPlans.missingImage")}</small></bdi>
          </div>
        ) : (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("venueGuide.floorPlans.openFull", { label })}
            title={t("venueGuide.floorPlans.viewFull", { label })}
            onClick={event => {
              event.preventDefault();
              setZoom(1);
              dialogRef.current?.showModal();
            }}
          >
            <img src={src} alt={label} loading="lazy" onError={() => setFailed(true)} />
          </a>
        )}
      </div>

      {!failed && (
        <dialog
          ref={dialogRef}
          className="tower-plan-lightbox"
          aria-label={t("venueGuide.floorPlans.view", { label })}
          onClose={() => setZoom(1)}
        >
          <div className="tower-plan-lightbox__toolbar">
            <bdi>{label}</bdi>
            <div className="tower-plan-lightbox__controls">
              <button
                type="button"
                onClick={() => setZoom(value => Math.max(1, value - 0.25))}
                aria-label={t("venueGuide.floorPlans.zoomOut")}
              >
                −
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom(value => Math.min(3, value + 0.25))}
                aria-label={t("venueGuide.floorPlans.zoomIn")}
              >
                +
              </button>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label={t("venueGuide.floorPlans.close")}
              >
                ×
              </button>
            </div>
          </div>
          <div className="tower-plan-lightbox__viewport">
            <img src={src} alt={label} style={{ width: `${zoom * 100}%` }} />
          </div>
        </dialog>
      )}
    </>
  );
}

export default function AdministrativeTowerPage() {
  const { t } = useTranslation();
  const title = t("venueGuide.venues.administrative-tower.title");
  const zoomHint = t("venueGuide.floorPlans.zoomHint");

  return (
    <VenueDetail
      venue="administrative-tower"
      title={title}
      titleId="tower-page-title"
      description={t("venueGuide.venues.administrative-tower.heroDescription")}
      image={MEDIA.tower}
      imageAlt={t("venueGuide.venues.administrative-tower.imageAlt")}
    >
      <VenueMap
        venueName={title}
        query="مركز المؤتمرات جامعة الملك سعود بن عبدالعزيز للعلوم الصحية الرياض"
        sectionLabel={t("venueGuide.venues.administrative-tower.mapSection")}
        frameTitle={t("venueGuide.venues.administrative-tower.mapTitle")}
      />
      <section className="venue-section" aria-labelledby="tower-plans-title">
        <div className="venue-section__inner">
          <h2 id="tower-plans-title" className="venue-section__heading" data-venue-reveal>
            <bdi>{t("venueGuide.floorPlans.heading")}</bdi>
          </h2>
          <div className="tower-plans">
            <figure data-venue-reveal>
              <div className="tower-plan__level" data-zoom-hint={zoomHint}><bdi><Trans t={t} i18nKey="venueGuide.floorPlans.groundHeading" components={{ accent: <span /> }} /></bdi></div>
              <PlanImage src={MEDIA.planOne} label={t("venueGuide.floorPlans.ground")} />
            </figure>
            <figure data-venue-reveal>
              <div className="tower-plan__level" data-zoom-hint={zoomHint}><bdi><Trans t={t} i18nKey="venueGuide.floorPlans.firstHeading" components={{ accent: <span /> }} /></bdi></div>
              <PlanImage src={MEDIA.planTwo} label={t("venueGuide.floorPlans.first")} />
            </figure>
          </div>
        </div>
      </section>
    </VenueDetail>
  );
}