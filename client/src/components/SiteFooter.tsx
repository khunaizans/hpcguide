import { useEffect, useState } from "react";
import { defaultShell, loadPublishedShell } from "@/lib/siteShell";
import { supabase } from "@/lib/supabase";
const footerCredits = (
  <div className="footer-credits">
    <strong>عمل وإشراف:</strong>
    <span>عبدالإله الهويشل، ساره القصيّر</span>
    <span>سليمان الخنيزان، رهف الحربي، دانه العتيبي</span>
  </div>
);
export default function SiteFooter() {
   const [shell, setShell] = useState(defaultShell);
  const [customized, setCustomized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadFooter = async () => {
      try {
        if (!supabase) return;

        const { data, error } = await supabase
          .from("site_settings")
          .select("setting_value")
          .eq("setting_key", "shell_header_footer_published")
          .maybeSingle();

        if (error) throw error;

        if (data?.setting_value) {
          const publishedShell = await loadPublishedShell();

          if (active) {
            setShell(publishedShell);
            setCustomized(true);
          }
        }
      } catch (error) {
        console.error("Footer loading error:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadFooter();

    return () => {
      active = false;
    };
  }, []);

  if (loading) return null;
  if (!customized) return <footer className="site-footer"><div className="container footer-inner"><a href="/" className="footer-logo" aria-label="العودة للرئيسية"><img src="/images/hpc-logo_739bab33.png" alt="مؤتمر التخصصات الصحية" /></a><p>نلتقي لنحوّل المعرفة إلى أثر.</p><div className="footer-meta">
  <div className="footer-copyright">
    <span>مؤتمر التخصصات الصحية</span>
    <span>© HPC 2027</span>
  </div>
  {footerCredits}
</div></div></footer>;
  const footer = shell.footer; const links = footer.links.filter((item) => item.visible).sort((a, b) => a.order - b.order); const socials = footer.socials.filter((item) => item.visible).sort((a, b) => a.order - b.order);
  const partners = footer.partners.filter((item) => item.visible).sort((a, b) => a.order - b.order);
  return <footer className={`site-footer shell-footer--${footer.background} shell-footer-text--${footer.textColor}`}><div className="container footer-inner"><a href="/" className="footer-logo" aria-label="العودة للرئيسية"><img src={footer.logoUrl || defaultShell.footer.logoUrl} alt="مؤتمر التخصصات الصحية" /></a><div className="shell-footer-copy"><b>{footer.title}</b><p>{footer.description}</p>{links.length > 0 && <nav aria-label="روابط الفوتر">{links.map((item) => <a key={`${item.order}-${item.label}`} href={item.href}>{item.label}</a>)}</nav>}{socials.length > 0 && <div className="shell-footer-socials hpc-footer-socials">{socials.map((item) => <a key={`${item.order}-${item.label}`} href={item.href} aria-label={item.label} target="_blank"
rel="noopener noreferrer" >{item.icon}</a>)}</div>}{partners.length > 0 && <div className="shell-footer-partners">{partners.map((item) => <a key={`${item.order}-${item.name}`} href={item.href || "#"}><img src={item.imageUrl} alt={item.name} /></a>)}</div>}</div><div className="footer-meta">
  <div className="footer-copyright">
    <span>{footer.title}</span>
    <span>{footer.copyright}</span>
  </div>
  {footerCredits}
</div></div></footer>;
}
