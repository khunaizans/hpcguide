import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

export default function PathwayName({ slug, number, children }: { slug?: string; number?: string; children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const key = number?.trim() === "07" ? "visual-research" : number?.trim() === "08" ? "research-review" : slug;
  if (i18n.resolvedLanguage !== "en" || !key || !i18n.exists(`pathwayNames.${key}`, { lng: "en" })) return <>{children}</>;
  return <span lang="en" dir="ltr" style={{ display: "inline-block", maxWidth: "100%", whiteSpace: "normal", overflowWrap: "anywhere", textWrap: "balance" }}>{t(`pathwayNames.${key}`)}</span>;
}
