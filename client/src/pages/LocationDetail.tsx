import { ArrowRight, Check } from "lucide-react";
import { Link, useRoute } from "wouter";
import { getLocation } from "@/lib/locations";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function LocationDetail() {
  const [, params] = useRoute<{ slug: string }>("/locations/:slug");
  const location = params ? getLocation(params.slug) : undefined;

  if (!location) {
    return <main className="pathway-not-found" dir="rtl"><h1>الموقع غير موجود</h1><Link href="/#resources">العودة إلى الخريطة</Link></main>;
  }

  return (
    <main className="pathway-detail location-detail" dir="rtl">
      <SiteHeader />
      <div className="detail-pattern detail-pattern--top" aria-hidden="true"><span /><span /><span /><i>MAP</i></div>
      <section className="detail-hero detail-hero--blue">
        <div className="detail-hero-copy">
          <Link className="detail-back" href="/#resources"><ArrowRight size={16} /> العودة إلى الخريطة</Link>
          <p className="eyebrow"><span /> دليل المكان</p>
          <h1>{location.title}</h1>
          <p>{location.details}</p>
        </div>
        <div className="detail-image-wrap location-detail-image"><img src={location.image} alt={location.title} /></div>
      </section>
      <section className="detail-content">
        <div className="detail-pattern detail-pattern--content" aria-hidden="true"><span /><span /><span /><i>R</i></div>
        <div><p className="detail-label">في هذا الموقع</p><h2>خطوتك الأولى<br /><span>تبدأ من هنا</span></h2><p className="location-detail-note">{location.description}</p></div>
        <div className="detail-highlights">{location.highlights.map((highlight) => <div className="detail-highlight" key={highlight}><span><Check size={15} /></span><p>{highlight}</p></div>)}</div>
      </section>
      <SiteFooter />
    </main>
  );
}
