import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { defaultShell, loadPublishedShell, ShellLink } from "@/lib/siteShell";
import { supabase } from "@/lib/supabase";
export default function SiteHeader() {
  const [location, navigate] = useLocation(); const isHome = location === "/"; const [menuOpen, setMenuOpen] = useState(false); const [activeSection, setActiveSection] = useState("hero"); const [shell, setShell] = useState(defaultShell);
  const [shellReady, setShellReady] = useState(!supabase);
   const navRef = useRef<HTMLElement | null>(null); const itemRefs = useRef<Record<string, HTMLElement | null>>({}); const [indicator, setIndicator] = useState({ left: 0, width: 0, top: 0 });


useEffect(() => {
  let cancelled = false;

  const loadHeader = async () => {
    try {
      const published = await loadPublishedShell();

      if (!cancelled) {
        setShell(published);
      }
    } catch (error) {
      console.error("Header loading error:", error);
    } finally {
      if (!cancelled) {
        setShellReady(true);
      }
    }
  };

  void loadHeader();

  return () => {
    cancelled = true;
  };
}, []);

  const links = shell.header.links.filter((item) => item.visible).sort((a, b) => a.order - b.order);


useEffect(() => {
  if (window.location.pathname !== "/") return;

  const sectionId = window.location.hash.replace("#", "");
  if (!sectionId) return;

  let attempts = 0;

  const interval = window.setInterval(() => {
    const section = document.getElementById(sectionId);
    attempts++;

    if (section && section.getBoundingClientRect().height > 0) {
      const headerHeight =
        document.querySelector(".site-header")
          ?.getBoundingClientRect().height ?? 0;


const top =
  section.getBoundingClientRect().top +
  window.scrollY -
  headerHeight +
  120;


      window.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });
      setActiveSection(sectionId);

      window.clearInterval(interval);
    }

    if (attempts >= 40) {
      window.clearInterval(interval);
    }
  }, 200);

  return () => window.clearInterval(interval);
}, [isHome]);



useEffect(() => {
  if (!isHome) return;

  const updateActiveSection = () => {
    const headerHeight =
      document.querySelector(".site-header")
        ?.getBoundingClientRect().height ?? 0;

    const threshold = headerHeight + 30;

    const sectionIds = shell.header.links
      .filter((item) => item.kind === "section")
      .map((item) => item.href.replace(/^#/, ""));

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

  updateActiveSection();

  return () => {
    window.removeEventListener(
      "scroll",
      updateActiveSection
    );
  };
}, [isHome, shell.header.links]);

  useLayoutEffect(() => { const updateIndicator = () => { const nav = navRef.current; const item = itemRefs.current[activeSection]; if (!nav || !item) return; const navRect = nav.getBoundingClientRect(); const itemRect = item.getBoundingClientRect(); const width = window.innerWidth <= 900 ? 24 : 54; setIndicator({ left: itemRect.left - navRect.left + (itemRect.width - width) / 2, width, top: itemRect.bottom - navRect.top - 1 }); }; updateIndicator(); window.addEventListener("resize", updateIndicator); return () => window.removeEventListener("resize", updateIndicator); }, [activeSection, menuOpen, isHome, links.length]);

const goToSection = (link: ShellLink) => {
  const id = link.href.replace(/^#/, "");

  setActiveSection(id);
  setMenuOpen(false);

  if (link.href === "#assistant") {
    window.dispatchEvent(
      new CustomEvent("hpc:open-assistant")
    );
    return;
  }

  if (link.kind !== "section") return;

  if (isHome) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  } else {
    navigate(`/#${id}`);
  }
};

if (!shellReady) {
  return (
    <header className="site-header" aria-busy="true">
      <div className="header-inner" />
    </header>
  );
}

  const logo = <img src={shell.header.logoUrl || defaultShell.header.logoUrl} alt="مؤتمر التخصصات الصحية" />;
  return <header className={`site-header shell-header--${shell.header.background} shell-header-text--${shell.header.textColor} shell-header-height--${shell.header.height} shell-header-logo--${shell.header.logoSize}`}><div className="header-inner"><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="فتح القائمة">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button><a className="header-logo" href={import.meta.env.BASE_URL} aria-label="العودة للرئيسية" onClick={() => setActiveSection("hero")}><div className="brand-mark brand-mark--compact">{logo}</div></a><nav ref={navRef} className={menuOpen ? "nav-links nav-links--open" : "nav-links"} aria-label="التنقل الرئيسي">{links.map((item) => { const href = !isHome && item.kind === "section" ? `/#${item.href.replace(/^#/, "")}` : item.href; return isHome && item.kind === "section" ? <button ref={(node) => { itemRefs.current[item.href] = node; }} key={`${item.order}-${item.label}`} onClick={() => goToSection(item)} className={isHome && activeSection === item.href.slice(1) ? "active" : ""}>{item.label}</button> : <a ref={(node) => { itemRefs.current[item.href] = node; }} key={`${item.order}-${item.label}`} href={href}
onClick={(event) => {
  if (item.kind === "section") {
    event.preventDefault();
    goToSection(item);
  } else {
    setMenuOpen(false);
  }
}}
 className={isHome && activeSection === item.href.replace(/^#/, "") ? "active" : ""}>{item.label}</a>; })}
{isHome && (
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
</nav>{shell.header.buttons.filter((button) => button.visible).sort((a, b) => a.order - b.order).map((button) => <a className="header-chat" key={button.order} href={button.href}>{button.label}</a>)}</div></header>;
}
