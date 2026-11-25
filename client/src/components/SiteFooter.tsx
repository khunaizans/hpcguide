import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { defaultShell } from "@/lib/siteShell";
import { usePublicShell } from "@/contexts/PublicShellContext";

function FooterBrand({
  english,
  children,
}: {
  english: boolean;
  children: ReactNode;
}) {
  return english ? (
    <div className="footer-brand">{children}</div>
  ) : (
    <>{children}</>
  );
}

function FooterCredits() {
  const { t } = useTranslation();

  return (
    <div className="footer-credits">
      <strong>{t("footer.credits")}</strong>
      <span>{t("footer.names1")}</span>
      <span>{t("footer.names2")}</span>
    </div>
  );
}

export default function SiteFooter() {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.resolvedLanguage === "en";

  const snapshot = usePublicShell();
  if (!snapshot) return null;

  const { shell, customized } = snapshot;

  if (!customized) {
    return (
      <footer
        className={`site-footer${isEnglish ? " site-footer--english" : ""}`}
        dir={isEnglish ? "ltr" : undefined}
      >
        <div className="container footer-inner">
          <FooterBrand english={isEnglish}>
            <a
              href={import.meta.env.BASE_URL}
              className="footer-logo"
              aria-label={t("footer.backHome")}
            >
              <img
                src={`${import.meta.env.BASE_URL}images/hpc-logo_739bab33.png`}
                alt={t("footer.title")}
              />
            </a>

            {isEnglish ? (
              <div className="shell-footer-copy">
                <span className="footer-fallback-title">{t("footer.title")}</span>
                <p>{t("footer.description")}</p>
              </div>
            ) : (
              <p>{t("footer.description")}</p>
            )}
          </FooterBrand>

          <div className="footer-meta">
            <div className="footer-copyright">
              {!isEnglish && <span>{t("footer.title")}</span>}
              <span>© HPC 2027</span>
            </div>
            <FooterCredits />
          </div>
        </div>
      </footer>
    );
  }

  const footer = shell.footer;

  const links = footer.links
    .filter(item => item.visible)
    .sort((a, b) => a.order - b.order);

  const socials = footer.socials
    .filter(item => item.visible)
    .sort((a, b) => a.order - b.order);

  const partners = footer.partners
    .filter(item => item.visible)
    .sort((a, b) => a.order - b.order);

  const title = isEnglish
    ? footer.titleEn?.trim() ||
      (footer.title === defaultShell.footer.title
        ? t("footer.title")
        : footer.title)
    : footer.title;

  const description = isEnglish
    ? footer.descriptionEn?.trim() ||
      (footer.description === defaultShell.footer.description
        ? t("footer.description")
        : footer.description)
    : footer.description;

  const copyright = isEnglish
    ? footer.copyrightEn?.trim() || footer.copyright
    : footer.copyright;

 const socialLinks = socials.length > 0 && (
  <div className="shell-footer-socials hpc-footer-socials">

    <a
      className="hpc-footer-heading hpc-footer-side-link--right"
      href="https://hpcgate.ksau-hs.edu.sa/Home/Index"
      target="_blank"
      rel="noopener noreferrer"
    >
      {isEnglish ? "Conference Portal" : "بوابة المؤتمر"}
    </a>

    <div className="hpc-footer-follow">

      <span className="hpc-footer-heading">
        {isEnglish ? "Follow Us" : "تابعنا"}
      </span>

      <div className="hpc-footer-social-icons">
        {socials.map(item => (
          <a
            key={`${item.order}-${item.label}`}
            href={item.href}
            aria-label={
              isEnglish
                ? item.labelEn?.trim() || item.label
                : item.label
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.icon}
          </a>
        ))}
      </div>

    </div>

    <a
      className="hpc-footer-heading hpc-footer-side-link--left"
      href="https://chat.whatsapp.com/HXQhP4QKWGjKSLYh4JxITh"
      target="_blank"
      rel="noopener noreferrer"
    >
      {isEnglish
        ? "Join the Conference Community"
        : "أنضم إلى مجتمع المؤتمر"}
    </a>

  </div>
);

  return (
    <footer
      className={`site-footer shell-footer--${footer.background} shell-footer-text--${footer.textColor}${isEnglish ? " site-footer--english" : ""}`}
      dir={isEnglish ? "ltr" : undefined}
    >
      <div className="container footer-inner">
        <FooterBrand english={isEnglish}>
          <a
            href={import.meta.env.BASE_URL}
            className="footer-logo"
            aria-label={t("footer.backHome")}
          >
            <img
              src={footer.logoUrl || defaultShell.footer.logoUrl}
              alt={t("footer.title")}
            />
          </a>

          <div className="shell-footer-copy">
            <b>{title}</b>
            <p>{description}</p>

            {links.length > 0 && (
              <nav aria-label={isEnglish ? "Footer links" : "روابط الفوتر"}>
                {links.map(item => (
                  <a key={`${item.order}-${item.label}`} href={item.href}>
                    {isEnglish
                      ? item.labelEn?.trim() || item.label
                      : item.label}
                  </a>
                ))}
              </nav>
            )}

            {!isEnglish && socialLinks}

            {partners.length > 0 && (
              <div className="shell-footer-partners">
                {partners.map(item => (
                  <a key={`${item.order}-${item.name}`} href={item.href || "#"}>
                    <img
                      src={item.imageUrl}
                      alt={
                        isEnglish ? item.nameEn?.trim() || item.name : item.name
                      }
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </FooterBrand>

        {isEnglish && socialLinks}

        <div className="footer-meta">
          <div className="footer-copyright">
            <span>{title}</span>
            <span>{copyright}</span>
          </div>

          <FooterCredits />
        </div>
      </div>
    </footer>
  );
}
