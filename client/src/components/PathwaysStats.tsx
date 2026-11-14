
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./PathwaysStats.css";

export type ConferenceEdition = {
  year: string;
  name: string;
  stats: {
    label: string;
    value: number;
  }[];
};

export const defaultEditions: ConferenceEdition[] = [
  {
    year: "2024",
    name: "الثامنة",
    stats: [
      { label: "المستفيدون", value: 6000 },
      { label: "عدد الأبحاث", value: 670 },
      { label: "ورش العمل", value: 59 },
      { label: "المحاضرات العلمية", value: 106 },
      { label: "الجلسات النقاشية", value: 15 },
      { label: "المتحدثون", value: 256 },
      { label: "الجهات المشاركة", value: 12 },
    ],
  },
  {
    year: "2025",
    name: "التاسعة",
    stats: [
      { label: "المستفيدون", value: 6500 },
      { label: "عدد الأبحاث", value: 1113 },
      { label: "ورش العمل", value: 48 },
      { label: "المحاضرات العلمية", value: 78 },
      { label: "الجلسات النقاشية", value: 23 },
      { label: "المتحدثون", value: 259 },
      { label: "الجهات المشاركة", value: 15 },
    ],
  },
  {
    year: "2026",
    name: "العاشرة",
    stats: [
      { label: "المستفيدون", value: 7000 },
      { label: "عدد الأبحاث", value: 1836 },
      { label: "ورش العمل", value: 56 },
      { label: "المحاضرات العلمية", value: 92 },
      { label: "الجلسات النقاشية", value: 6 },
      { label: "المتحدثون", value: 152 },
      { label: "الجهات المشاركة", value: 13 },
    ],
  },
];

type Props = {
  editions?: ConferenceEdition[];
};


function AnimatedStatNumber({
  value,
  visible,
}: {
  value: number;
  visible: boolean;
}) {
  const [displayed, setDisplayed] = useState(0);
  const numberRef = useRef<HTMLElement | null>(null);

 useEffect(() => {
  if (!visible) {
    setDisplayed(0);
    return;
  }

  let frameId = 0;
    let observer: IntersectionObserver | null = null;
    let started = false;

    const startAnimation = () => {
      if (started) return;
      started = true;

      let startTime: number | null = null;
      const duration = 1200;

      const animate = (time: number) => {
        if (startTime === null) startTime = time;

        const progress = Math.min(
          (time - startTime) / duration,
          1
        );

        const eased = 1 - Math.pow(1 - progress, 4);

        setDisplayed(Math.round(value * eased));

        if (progress < 1) {
          frameId = requestAnimationFrame(animate);
        } else {
          setDisplayed(value);
        }
      };

      frameId = requestAnimationFrame(animate);
    };

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
    ) {
      setDisplayed(value);
    } else if (
      "IntersectionObserver" in window &&
      numberRef.current
    ) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            startAnimation();
            observer?.disconnect();
          }
        },
        { threshold: 0.2 }
      );

      observer.observe(numberRef.current);
    } else {
      startAnimation();
    }

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [value, visible]);

  return (
    <strong ref={numberRef}>
      {displayed.toLocaleString("en-US")}
    </strong>
  );
}

export default function PathwaysStats({
  editions = defaultEditions,
}: Props) {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === "en";
  const [selectedYear, setSelectedYear] = useState("2026");
const statsRef = useRef<HTMLDivElement | null>(null);
const [statsVisible, setStatsVisible] = useState(false);

useEffect(() => {
  const element = statsRef.current;
  if (!element) return;

  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !("IntersectionObserver" in window)
  ) {
    setStatsVisible(true);
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      setStatsVisible(entry.isIntersecting);
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -5% 0px",
    }
  );

  observer.observe(element);

  return () => observer.disconnect();
}, []);
  const selected =
    editions.find((item) => item.year === selectedYear) ??
    editions[editions.length - 1];

  if (!selected) return null;

  return (
    <div
  ref={statsRef}
  className={`pathways-history-stats ${
    statsVisible ? "is-visible" : ""
  }`}
  dir={isEnglish ? "ltr" : "rtl"}
  lang={isEnglish ? "en" : "ar"}
>
      <div className="pathways-stats-header">
        <h3>{isEnglish ? t("keyFigures.title") : "أبرز الأرقام"}</h3>
      </div>

      <div className="pathways-stats-years">
        {[...editions]
  .sort((a, b) => Number(b.year) - Number(a.year))
  .map((edition) => (
          <button
            key={edition.year}
            type="button"
            className={
              selected.year === edition.year ? "active" : ""
            }
            onClick={() => setSelectedYear(edition.year)}
            aria-pressed={selected.year === edition.year}
          >
            {edition.year}
          </button>
        ))}
      </div>

      <p className="pathways-stats-edition">
        {isEnglish ? t(`keyFigures.editions.${selected.name}`, { defaultValue: selected.name }) : <>النسخة {selected.name}</>}
      </p>

      <div className="pathways-stats-grid" key={selected.year}>
        {selected.stats.map((stat, index) => (
          <div
  className="pathways-stat-card"
  key={stat.label}
  style={{
  animationDelay: `${index * 100}ms`,
  ["--stat-delay" as string]: `${index * 100}ms`,
}}
>
            <AnimatedStatNumber
  key={`${selected.year}-${stat.label}`}
  value={stat.value}
  visible={statsVisible}
/>
            <span>{isEnglish ? t(`keyFigures.labels.${stat.label}`, { defaultValue: stat.label }) : stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
