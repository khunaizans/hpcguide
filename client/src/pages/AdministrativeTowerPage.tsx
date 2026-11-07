
import { useEffect, useRef, useState } from "react";
import { ArrowRight, MapPin, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./AdministrativeTowerPage.css";

/*
 * Place these media files inside public/images/.
 * The tower photograph is already used on the homepage.
 * The other three names are placeholders for your actual map and hall plans.
 */
const MEDIA = {
  tower: `${import.meta.env.BASE_URL}images/administrative-tower-hero1.png`,
  map: `${import.meta.env.BASE_URL}images/nearby-map_c38385fb.png`,
  planOne: `${import.meta.env.BASE_URL}images/tower-plan-1.png`,
  planTwo: `${import.meta.env.BASE_URL}images/tower-plan-2.png`,
};
const TOWER_MAP_QUERY =
  "مركز المؤتمرات جامعة الملك سعود بن عبدالعزيز للعلوم الصحية الرياض";

const TOWER_MAP_URL =
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(TOWER_MAP_QUERY)}`;

const TOWER_MAP_EMBED =
  `https://www.google.com/maps?q=${encodeURIComponent(TOWER_MAP_QUERY)}&z=17&output=embed`;

type GuideImageProps = {
  src: string;
  alt: string;
  label: string;
  kind?: "map" | "plan";
};


function GuideImage({
  src,
  alt,
  label,
  kind = "plan",
}: GuideImageProps) {
  const [failed, setFailed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [zoom, setZoom] = useState(1);

  return (
    <div className={`tower-detail__media tower-detail__media--${kind}`}>
      {!failed ? (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="tower-detail__media-link"
          aria-label={`افتح ${label} بحجم كامل`}
          title={`عرض ${label} بحجم كامل`}
          onClick={(event) => {
            if (kind === "plan") {
              event.preventDefault();
              setZoom(1);
              dialogRef.current?.showModal();
            }
          }}
        >
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
          />

          <span className="tower-detail__media-expand" aria-hidden="true">
            <ExternalLink size={17} />
          </span>
        </a>
      ) : (
        <div className="tower-detail__media-empty" role="status">
          {kind === "map" ? (
            <MapPin size={30} />
          ) : (
            <ImageIcon size={30} />
          )}
          <span>{label}</span>
          <small>ضع الصورة داخل مجلد public/images</small>
        </div>
      )}

      {kind === "plan" && !failed && (
        <dialog
          ref={dialogRef}
          className="tower-plan-lightbox"
          aria-label={`عرض ${label}`}
          onClose={() => setZoom(1)}
        >
          <div className="tower-plan-lightbox__toolbar">
            <span>{label}</span>

            <div className="tower-plan-lightbox__controls">
              <button
                type="button"
                onClick={() =>
                  setZoom((value) => Math.max(1, value - 0.25))
                }
                aria-label="تصغير المخطط"
              >
                −
              </button>

              <span>{Math.round(zoom * 100)}%</span>

              <button
                type="button"
                onClick={() =>
                  setZoom((value) => Math.min(3, value + 0.25))
                }
                aria-label="تكبير المخطط"
              >
                +
              </button>

              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="إغلاق المخطط"
              >
                ×
              </button>
            </div>
          </div>

          <div className="tower-plan-lightbox__viewport">
            <img
              src={src}
              alt={alt}
              style={{ width: `${zoom * 100}%` }}
            />
          </div>
        </dialog>
      )}
    </div>
  );
}

export default function AdministrativeTowerPage() {


useEffect(() => {
  const root = document.querySelector(".tower-detail");
  if (!root) return;

  const elements = root.querySelectorAll<HTMLElement>(
    [
      ".tower-detail__hero-back",
      ".tower-detail__hero-copy h1",
      ".tower-detail__hero-description",
      ".tower-detail__section-intro",
      ".tower-detail__map-holder",
      ".tower-detail__plans > figure"
    ].join(", ")
  );

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (
    reducedMotion ||
    !("IntersectionObserver" in window)
  ) {
    return;
  }

  elements.forEach((element, index) => {
    element.classList.add("hpc-scroll-reveal");
    element.style.transitionDelay =
      `${(index % 2) * 130}ms`;
  });

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
      threshold: 0.18
    }
  );

  elements.forEach((element) => {
    observer.observe(element);
  });

  return () => {
    observer.disconnect();

    elements.forEach((element) => {
      element.classList.remove(
        "hpc-scroll-reveal",
        "hpc-in-view"
      );
      element.style.removeProperty("transition-delay");
    });
  };
}, []);

  return (
    <div className="tower-detail" dir="rtl">
      <SiteHeader />
      <main>
        <section className="tower-detail__hero" aria-labelledby="tower-page-title">
          <img
            className="tower-detail__hero-image"
            src={MEDIA.tower}
            alt="البرج الإداري في موقع المؤتمر"
          />


<div className="tower-detail__hero-copy">

  <Link
    href={`${import.meta.env.BASE_URL}#pathways`}
    className="tower-detail__hero-back"
  >
    <ArrowRight size={18} />
    الرجوع إلى دليل المكان
  </Link>

  <h1 id="tower-page-title">
    البرج الإداري
  </h1>

  <p className="tower-detail__hero-description">
    نقطة الوصول الرئيسية للمؤتمر ومركز الخدمات الإدارية.
    اكتشف موقع البرج الإداري ومخططات القاعات
    لتسهيل وصولك وتنقلك خلال المؤتمر.
  </p>

</div>

        </section>

        <section className="tower-detail__content" aria-label="دليل البرج الإداري">
          <div className="tower-detail__inner">


            <div className="tower-detail__section-intro">

<h2>
  موقع <span className="tower-detail__heading-accent">البرج الإداري</span>
</h2>

              <p></p>
            </div>


<div className="tower-detail__map-holder">
  <div className="tower-detail__google-card">

    <div className="tower-detail__google-header">
      <span className="tower-detail__google-title">
        <MapPin size={20} />
        الموقع على الخريطة
      </span>

      <a
        href={TOWER_MAP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="tower-detail__google-link"
      >
        <ExternalLink size={17} />
        افتح في خرائط Google
      </a>
    </div>

    <iframe
      src={TOWER_MAP_EMBED}
      title="موقع البرج الإداري على خرائط Google"
      className="tower-detail__google-frame"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />

  </div>
</div>


            <div className="tower-detail__section-intro tower-detail__section-intro--plans">
              <span className="tower-detail__eyebrow"></span>
              <h2>مخطط المبنى</h2>
            </div>


<div className="tower-detail__plans">

  {/* Right Image - Ground Floor */}
  <figure>
    <div className="tower-plan-level">
      الدور <span>الأرضي</span>
    </div>

    <GuideImage
      src={MEDIA.planOne}
      alt="مخطط الدور الأرضي"
      label="مخطط الدور الأرضي"
    />

  </figure>

  {/* Left Image - First Floor */}
  <figure>
    <div className="tower-plan-level">
      الدور <span>الأول</span>
    </div>

    <GuideImage
      src={MEDIA.planTwo}
      alt="مخطط الدور الأول"
      label="مخطط الدور الأول"
    />
  </figure>

</div>

          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
