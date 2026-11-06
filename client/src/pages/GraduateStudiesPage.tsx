
import { ArrowRight, ExternalLink, MapPin } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./AdministrativeTowerPage.css";

const GRADUATE_MAP_QUERY =
  "مبنى الدراسات العليا جامعة الملك سعود بن عبدالعزيز للعلوم الصحية الرياض";

const GRADUATE_MAP_URL =
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(GRADUATE_MAP_QUERY)}`;

const GRADUATE_MAP_EMBED =
  `https://www.google.com/maps?q=${encodeURIComponent(GRADUATE_MAP_QUERY)}&z=17&output=embed`;

export default function GraduateStudiesPage() {
  return (
    <div className="tower-detail graduate-detail" dir="rtl">
      <SiteHeader />

      <main>
        <section
          className="tower-detail__hero"
          aria-labelledby="graduate-page-title"
        >
          <img
            className="tower-detail__hero-image"
            src="/images/graduate-studies-hero.webp"
            alt="مبنى الدراسات العليا"
          />

          <div className="tower-detail__hero-copy">
            <Link
              href="/#resources"
              className="tower-detail__hero-back"
            >
              <ArrowRight size={18} />
              الرجوع إلى دليل المكان
            </Link>

            <h1 id="graduate-page-title">
              مبنى الدراسات العليا
            </h1>

            <p className="tower-detail__hero-description">
              تعرّف على مبنى الدراسات العليا وموقعه
              ومرافقه، واستكشف تفاصيل المبنى
              لتسهيل وصولك وتنقلك خلال المؤتمر.
            </p>
          </div>
        </section>


{/* Graduate Studies Location */}

<section
  className="tower-detail__content graduate-location"
  aria-label="موقع مبنى الدراسات العليا"
>
  <div className="tower-detail__inner">

    <div className="tower-detail__section-intro graduate-location__heading">
      <h2>
        موقع <span>مبنى الدراسات العليا</span>
      </h2>
    </div>

    <div className="tower-detail__map-holder">
      <div className="graduate-map-card">

        <div className="graduate-map-card__header">

          <div className="graduate-map-card__location">
            <MapPin size={22} />
            <span>الموقع على الخريطة</span>
          </div>

          <a
            href={GRADUATE_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            افتح في خرائط Google
            <ExternalLink size={17} />
          </a>

        </div>

        <div className="graduate-map-card__frame">
          <iframe
            src={GRADUATE_MAP_EMBED}
            title="خريطة مبنى الدراسات العليا"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>

      </div>
    </div>

  </div>
</section>

      </main>

      <SiteFooter />
    </div>
  );
}
