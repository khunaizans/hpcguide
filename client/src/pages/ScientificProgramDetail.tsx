
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

import {
  loadPublishedRoute,
  routeToPathway,
  type RouteRecord,
} from "@/lib/routesCms";

import { getPathway } from "@/lib/pathways";


export default function ScientificProgramDetail() {
  console.log("SCIENTIFIC PAGE LOADED");
  const [route, setRoute] = useState<RouteRecord | null>(null);

  useEffect(() => {
    let active = true;

  void loadPublishedRoute("scientific-program").then((data) => {
  console.log("SCIENTIFIC CMS DEBUG:", data?.contentItems);

  if (active && data) {
    setRoute(data);
  }
});
        return () => {
      active = false;
    };
  }, []);
useEffect(() => {
  const elements = document.querySelectorAll<HTMLElement>(
    ".scientific-program-page .scientific-program-lecture-card, " +
    ".scientific-program-page .scientific-program-workshop-card, " +
    ".scientific-program-page .scientific-program-registration-card"
  );

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {

entries.forEach((entry) => {
  entry.target.classList.toggle(
    "scientific-in-view",
    entry.isIntersecting
  );
});

    },
    {
      threshold: 0.15,
    }
  );

  elements.forEach((element, index) => {
    element.classList.add("scientific-reveal");
    element.style.setProperty(
      "--scientific-delay",
      `${index * 120}ms`
    );
    observer.observe(element);
  });

  return () => {
    observer.disconnect();
    elements.forEach((element) => {
      element.classList.remove(
        "scientific-reveal",
        "scientific-in-view"
      );
      element.style.removeProperty("--scientific-delay");
    });
  };
}, []);


const lectures = route?.contentItems
  ?.filter((item) => item.visible)
  .find((item) => item.title.includes("المحاضرات"));

  const workshops = route?.contentItems
  ?.filter((item) => item.visible)
  .find((item) => item.title.includes("ورش العمل"));

const heroImage =
  route
    ? routeToPathway(route).image
    : getPathway("scientific-program")?.image;

const heroImageSrc =
  heroImage?.includes("supabase.com/dashboard/")
    ? `/images/${heroImage.split("website").pop()}`
    : heroImage?.replace("/manus-storage/", "/images/");

  return (
    <main className="scientific-program-page" dir="rtl">
      <SiteHeader />

      <section className="scientific-program-hero">

<div className="scientific-program-hero-image" aria-hidden="true">
  {heroImageSrc && (
    <img src={heroImageSrc} alt="" />
  )}
</div>

        <div className="scientific-program-hero-content">
          <Link href="/#pathways" className="detail-back">
            <ArrowRight size={16} />
            الرجوع إلى المسارات
          </Link>


<p className="eyebrow scientific-program-pathway-number">
  المسار 01
</p>


          <h1>{route?.title || "مسار البرنامج العلمي"}</h1>

          <p className="scientific-program-description">
            {route?.details || route?.description || ""}
          </p>
               </div>

      </section>

<section className="scientific-program-board">
  <div className="scientific-program-board-container">

    {/* المحاضرات والجلسات النقاشية */}
    <div className="scientific-program-lecture-card">
      <h2>
        {lectures?.title || "المحاضرات والجلسات النقاشية"}
      </h2>

      <p className="scientific-program-card-subtitle">
        {lectures?.subtitle || "تبادل المعرفة والخبرات الصحية"}
      </p>

      <p className="scientific-program-card-description">
        {lectures?.description ||
          "يتيح البرنامج العلمي للطلاب والممارسين الصحيين فرصة التفاعل المباشر مع نخبة من الخبراء والمتخصصين في المجال الصحي، والاطلاع على أحدث الأبحاث والتطورات والممارسات في مختلف التخصصات الصحية."}
      </p>
    </div>

    <div className="scientific-program-bottom-cards">

      {/* ورش العمل - اليمين */}
      <div className="scientific-program-workshop-card">
        <h2>{workshops?.title || "ورش العمل"}</h2>

        <p className="scientific-program-card-subtitle">
          {workshops?.subtitle || "تطبيق المعرفة وتطوير المهارات"}
        </p>

        <p className="scientific-program-card-description">
          {workshops?.description ||
            "تقدم ورش العمل تجربة تعليمية وتفاعلية تتيح للمشاركين تطوير مهاراتهم وتطبيق المعرفة في مختلف المجالات الصحية."}
        </p>
      </div>

      {/* التسجيل - اليسار */}

<div className="scientific-program-registration-card">

<div className="scientific-registration-top">
  <strong>01</strong>
</div>


  <div className="scientific-registration-icon">
    <Sparkles size={26} />
  </div>

  <h2>مهتم بالمشاركة؟</h2>

  <p>اطّلع على تفاصيل البرنامج العلمي وفرص المشاركة.</p>

  <a
  href="https://hpcgate.ksau-hs.edu.sa/Home/Index"
  target="_blank"
  rel="noopener noreferrer"
  className="scientific-registration-button"
>
  التسجيل الآن ↗
</a>

  <small></small>
</div>


    </div>
  </div>
</section>


      <SiteFooter />
    </main>
  );
}
