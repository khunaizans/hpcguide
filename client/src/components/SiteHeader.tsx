import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { defaultShell, resolveShellLogoUrl, type ShellLink } from "@/lib/siteShell";
import { useTranslation } from "react-i18next";
import { usePublicShell } from "@/contexts/PublicShellContext";
import type { HomeIntent, HomeNavigation } from "@/lib/homeScroll";
import { flushSync } from "react-dom";

let headerArrivalToken = 0;
let headerArrivalAnimation: Animation | null = null;

function animateHeaderArrival(hash: string) {
  const token = ++headerArrivalToken;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const id = hash.replace(/^#/, "") || "hero";
  let attempts = 0;

  const check = () => {
    if (token !== headerArrivalToken) return;

    const main = document.querySelector<HTMLElement>("main.home-page");
    const section = document.getElementById(id);

    const headerHeight =
      document.querySelector(".site-header")
        ?.getBoundingClientRect().height ?? 0;

    const aligned =
      section &&
      Math.abs(section.getBoundingClientRect().top - headerHeight) < 120;

    if (
      !main ||
      !section ||
      !main.contains(section) ||
      main.getAttribute("aria-busy") === "true" ||
      !aligned
    ) {
      if (++attempts < 180) requestAnimationFrame(check);
      return;
    }

    // Animate the section heading, not the entire section.
    const heading = section.querySelector<HTMLElement>("h1, h2");

    if (!heading) return;

    headerArrivalAnimation?.cancel();

    headerArrivalAnimation = heading.animate(
      [
        { opacity: 0.35, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: 500,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      }
    );
  };

  requestAnimationFrame(check);
}


function HeaderLogo({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  return <img src={failed ? defaultShell.header.logoUrl : url} fetchPriority="high" alt="" onError={() => setFailed(true)} />;
}

function isPlainClick(event: MouseEvent<HTMLAnchorElement>) {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey
    && !event.shiftKey && !event.altKey;
}

export default function SiteHeader({ contentReady = true }: { contentReady?: boolean }) {
  const snapshot = usePublicShell();

const HEADER_ANIMATION_KEY = "hpc:header-arrival";

let activeHeaderAnimation: Animation | null = null;

function playHeaderAnimation(id: string) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const section = document.getElementById(id);
  if (!section) return;

  // Vision and Mission cards must remain stationary.
  const target =
    id === "about"
      ? section.querySelector<HTMLElement>("h2") ?? section
      : id === "hero"
        ? section.querySelector<HTMLElement>(".hero-film__copy") ?? section
        : section;

  activeHeaderAnimation?.cancel();

  activeHeaderAnimation = target.animate(
    [
      {
        opacity: 0.72,
        translate: "0 16px",
      },
      {
        opacity: 1,
        translate: "0 0px",
      },
    ],
    {
      duration: 480,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    }
  );
}

  const shell = snapshot?.shell ?? defaultShell;
  // Only remember the header geometry, never published navigation or logos.
  const headerHeight = snapshot ? shell.header.height
    : history.state?.hpcHeaderHeight === "compact" ? "compact" : defaultShell.header.height;
  const [location, navigate] = useLocation(); const isHome = location === "/"; const [menuOpen, setMenuOpen] = useState(false); const [activeSection, setActiveSection] = useState("hero");
   const navRef = useRef<HTMLElement | null>(null); const itemRefs = useRef<Record<string, HTMLElement | null>>({}); const [indicator, setIndicator] = useState({ left: 0, width: 0, top: 0 });
const { i18n, t } = useTranslation();
const currentLanguage = i18n.resolvedLanguage === "en" ? "en" : "ar";

const toggleLanguage = (language: "en" | "ar") => {
  void i18n.changeLanguage(language);
};
const headerScrollTarget = useRef<string | null>(null);

useLayoutEffect(() => {
  if (!snapshot || history.state?.hpcHeaderHeight === headerHeight) return;
  try {
    history.replaceState({ ...history.state, hpcHeaderHeight: headerHeight }, "");
  } catch {
    // The header still works when history state is unavailable.
  }
}, [snapshot, headerHeight, location]);

const navigationTranslations: Record<string, string> = {
  "#hero": t("navigation.home"),
  "#about": t("navigation.about"),
  "#pathways": t("navigation.pathways"),
  "#resources": t("navigation.venue"),
  "#assistant": t("navigation.assistant"),
};

const links = (snapshot?.shell.header.links ?? [])
  .filter((item) => item.visible)
  .sort((a, b) => a.order - b.order)
  .map((item) => {
    const sectionHref = item.href.startsWith("/#")
      ? item.href.slice(1)
      : item.href;

    return {
      ...item,
      href: item.kind === "section" ? sectionHref : item.href,
      label:
        currentLanguage === "en"
          ? navigationTranslations[sectionHref] ?? item.label
          : item.label,
    };
  });



useEffect(() => {
  if (!isHome) return;

  const updateActiveSection = () => {
    const headerHeight =
      document.querySelector(".site-header")
        ?.getBoundingClientRect().height ?? 0;


const pendingId = headerScrollTarget.current;

if (pendingId) {
  const target = document.getElementById(pendingId);

  const reached =
    pendingId === "hero"
      ? window.scrollY <= 4
      : target !== null &&
        Math.abs(
          target.getBoundingClientRect().top - headerHeight
        ) <= 5;

  if (!reached) return;

  headerScrollTarget.current = null;
}

    const threshold = headerHeight + 30;

    const sectionIds = shell.header.links
      .filter((item) => item.kind === "section")
      .map((item) => item.href.replace(/^\/?#/, ""));

    let currentSection = "hero";

    for (const id of sectionIds) {
      const element = document.getElementById(id);

      if (
        element &&
        element.getBoundingClientRect().top <= threshold
      ) {
        currentSection = id;
      }
    }

    setActiveSection(currentSection);
  };

  window.addEventListener("scroll", updateActiveSection, {
    passive: true,
  });


const handleScrollEnd = () => {
  headerScrollTarget.current = null;
  updateActiveSection();
};

window.addEventListener("scrollend", handleScrollEnd);

  updateActiveSection();

  return () => {
    window.removeEventListener(
      "scroll",
      updateActiveSection
    );
     window.removeEventListener(
    "scrollend",
    handleScrollEnd
    );
  };


}, [isHome, shell.header.links, contentReady]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const item = itemRefs.current[`#${activeSection}`];
    if (!isHome || !nav || !item || !nav.getClientRects().length) {
      setIndicator(current => current.width ? { left: 0, top: 0, width: 0 } : current);
      return;
    }

    const updateIndicator = () => {
      const navRect = nav.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const width = window.innerWidth <= 900 ? 24 : 54;
      const next = {
        left: itemRect.left + (itemRect.width - width) / 2 - navRect.left,
        top: itemRect.bottom - navRect.top - 1,
        width,
      };
      setIndicator(current =>
        current.left === next.left && current.top === next.top && current.width === next.width
          ? current
          : next
      );
    };
    updateIndicator();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(updateIndicator) : null;
    observer?.observe(nav);
    observer?.observe(item);
    window.addEventListener("resize", updateIndicator);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeSection, menuOpen, isHome, snapshot, currentLanguage]);


const goToHomeAnchor = (hash: string) => {
  const intent: HomeIntent =
    hash && hash !== "#hero" ? "section" : "top";

  const search = isHome ? window.location.search : "";

  setActiveSection(hash.slice(1) || "hero");


if (isHome) {
  const id = hash.replace(/^#/, "") || "hero";
  const section = document.getElementById(id);

  if (!section) return;

  const headerHeight =
    document.querySelector(".site-header")
      ?.getBoundingClientRect().height ?? 0;

  const top =
    window.scrollY +
    section.getBoundingClientRect().top -
    headerHeight;

  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${window.location.search}${hash || "#hero"}`
  );


headerScrollTarget.current =
  Math.abs(window.scrollY - Math.max(0, top)) > 2
    ? id
    : null;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: "smooth",
  });

  return;
}

 
const performNavigation = () => {
  navigate(`/${search}${hash}`, {
    replace: isHome && window.location.hash === hash,
    state: {
      hpcHomeIntent: intent,
      hpcHeaderEntrance: intent === "top",
    },
  });
};

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if (
  !isHome &&
  !reducedMotion &&
  typeof document.startViewTransition === "function"
) {
  document.documentElement.classList.add(
    "hpc-route-transition"
  );

  const transition = document.startViewTransition(() => {
    flushSync(() => {
      performNavigation();
    });
  });

  void transition.finished.finally(() => {
    document.documentElement.classList.remove(
      "hpc-route-transition"
    );
  });
} else {
  performNavigation();
}

if (isHome) {
  window.dispatchEvent(
    new CustomEvent<HomeNavigation>("hpc:home-navigation", {
      detail: {
        hash,
        intent,
        headerEntrance: intent === "top",
      },
    })
  );
}
};
useEffect(() => {
  if (!isHome || !contentReady) return;

  let frame1 = 0;
  let frame2 = 0;
  frame1 = requestAnimationFrame(() => {
    frame2 = requestAnimationFrame(() => {
      const targetId = sessionStorage.getItem(
        HEADER_ANIMATION_KEY
      );

      if (!targetId) return;
      if (!document.getElementById(targetId)) return;

      sessionStorage.removeItem(HEADER_ANIMATION_KEY);

      playHeaderAnimation(targetId);
    });
  });

  return () => {
    cancelAnimationFrame(frame1);
    cancelAnimationFrame(frame2);
  };
}, [isHome, contentReady]);


  const goToSection = (link: ShellLink) => {
    if (link.href === "#assistant") {
      window.dispatchEvent(new CustomEvent("hpc:open-assistant"));
      return;
    }
    goToHomeAnchor(link.href);
  };

  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    setMenuOpen(false);
    goToHomeAnchor("");
  };

  const logoUrl = resolveShellLogoUrl(shell.header.logoUrl || defaultShell.header.logoUrl);
  return <header className={`site-header shell-header--${shell.header.background} shell-header-text--${shell.header.textColor} shell-header-height--${headerHeight} shell-header-logo--${shell.header.logoSize}`}><div className="header-inner">{snapshot && <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="فتح القائمة">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>}{snapshot ? <a className="header-logo" href={import.meta.env.BASE_URL} aria-label="العودة للرئيسية" onClick={goHome}><div className="brand-mark brand-mark--compact"><HeaderLogo key={logoUrl} url={logoUrl} /></div></a> : <span className="header-logo" aria-hidden="true" />}<nav ref={navRef} className={menuOpen ? "nav-links nav-links--open" : "nav-links"} aria-label="التنقل الرئيسي">{links.map((item) => { const href = !isHome && item.kind === "section"
  ? import.meta.env.BASE_URL + item.href
  : item.href; return <a ref={(node) => { itemRefs.current[item.href] = node; }} key={`${item.order}-${item.href}`} href={href}
onClick={(event) => {
  if (item.kind !== "section") {
    setMenuOpen(false);
    return;
  }
  if (!isPlainClick(event)) return;
  event.preventDefault();
  setMenuOpen(false);
  goToSection(item);
}}
 className={isHome && activeSection === item.href.replace(/^#/, "") ? "active" : ""}>{item.label}</a>; })}
{isHome && snapshot && indicator.width > 0 && (
  <span
    className="nav-indicator"
    style={{
      left: indicator.left,
      width: indicator.width,
      top: indicator.top,
    }}
    aria-hidden="true"
  />
)}
</nav>{snapshot?.shell.header.buttons.filter((button) => button.visible).sort((a, b) => a.order - b.order).map((button) => <a className="header-chat" key={button.order} href={button.href}>{button.label}</a>)}
<div
  className="site-language-switch"
  role="group"
  aria-label="Language / اللغة"
  dir="ltr"
  data-language={currentLanguage}
  onKeyDown={(event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const language = event.key === "ArrowLeft" || event.key === "Home" ? "en" : "ar";
    toggleLanguage(language);
    event.currentTarget.querySelector<HTMLButtonElement>(`button[lang="${language}"]`)?.focus();
  }}
>
  <button type="button" lang="en" aria-label="Switch to English" aria-pressed={currentLanguage === "en"} onClick={() => toggleLanguage("en")}>EN</button>
  <button type="button" lang="ar" aria-label="التبديل إلى العربية" aria-pressed={currentLanguage === "ar"} onClick={() => toggleLanguage("ar")}>AR</button>
</div>
</div></header>;

}
