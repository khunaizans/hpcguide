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


function AnimatedStatNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? value : 0
  );
  const numberRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const card = numberRef.current?.closest(".pathways-stat-card");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | null = null;
    let frame = 0;
    let active = false;

    const stop = () => {
      cancelAnimationFrame(frame);
      active = false;
    };

    const start = () => {
      active = true;
      let startTime: number | undefined;
      const animate = (time: number) => {
        startTime ??= time;
        const progress = Math.min((time - startTime) / 1600, 1);
        setDisplayed(Math.round(value * (1 - (1 - progress) ** 3)));
        if (progress < 1) frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    };

    const observe = () => {
      observer?.disconnect();
      stop();
      if (motion.matches || !card || typeof IntersectionObserver !== "function") {
        setDisplayed(value);
        return;
      }

      setDisplayed(0);
      // The gap between thresholds absorbs the existing card reveal offset.
      observer = new IntersectionObserver(entries => {
        if (motion.matches) return;
        const entry = entries.at(-1);
        if (!entry) return;
        if (active && entry.intersectionRatio <= 0.02) {
          stop();
          setDisplayed(0);
        } else if (!active && entry.intersectionRatio >= 0.35) {
          start();
        }
      }, { threshold: [0.02, 0.35] });
      observer.observe(card);
    };

    observe();
    motion.addEventListener("change", observe);
    return () => {
      observer?.disconnect();
      motion.removeEventListener("change", observe);
      stop();
    };
  }, [value]);

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
  const selected =
    editions.find((item) => item.year === selectedYear) ??
    editions[editions.length - 1];

  if (!selected) return null;

  return (
    <div
  className="pathways-history-stats"
  data-reveal="pending"
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
  ["--stat-delay" as string]: `${index * 100}ms`,
}}
>
            <AnimatedStatNumber
  key={`${selected.year}-${stat.label}`}
  value={stat.value}
/>
            <span>{isEnglish ? t(`keyFigures.labels.${stat.label}`, { defaultValue: stat.label }) : stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
