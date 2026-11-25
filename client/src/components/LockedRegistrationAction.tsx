import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  buttonClassName?: string;
};

export default function LockedRegistrationAction({
  buttonClassName = "research-cta__button",
}: Props) {
  const { i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === "en";

  return (
    <>
      <button
        type="button"
        className={`${buttonClassName} hpc-registration-disabled`}
        disabled
        style={{
          opacity: 0.65,
          cursor: "not-allowed",
        }}
      >
        {isEnglish ? "Registration Link" : "رابط التسجيل"}
        <ExternalLink size={15} />
      </button>

      <small
        className="research-cta__note hpc-registration-opening"
        style={{
          display: "block",
          marginTop: "14px",
          textAlign: "center",
          fontSize: "12px",
          color: "#68749a",
        }}
      >
        {isEnglish
          ? "Registration opens on December 27, 2026"
          : "سيتم تفعيل رابط التسجيل في 27 ديسمبر 2026"}
      </small>
    </>
  );
}