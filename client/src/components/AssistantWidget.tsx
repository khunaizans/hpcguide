import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "./AssistantWidget.css";
import { ArrowRight, Bot, BotMessageSquare, ChevronLeft, FileText, Image as ImageIcon, X } from "lucide-react";
import { AssistantContent, AssistantQuestion, AnswerBlock, fallbackAssistant, loadAssistant } from "@/lib/assistant";
import {
  loadRouteRecords,
  loadPublishedRouteRecords,
  routeToPathway,
} from "@/lib/routesCms";




function Block({ block, localize }: { block: AnswerBlock; localize: (text?: string) => string }) { if (block.type === "image" && block.url) return <img className="assistant-answer-image" src={block.url} alt={localize(block.alt || "صورة من المساعد")} />; if (block.type === "file" && block.url) return <a className="assistant-answer-file" href={block.url} target="_blank" rel="noreferrer"><FileText size={17} />{localize(block.label || "فتح الملف")}</a>; if (block.type === "link" && block.url) return <a className="assistant-answer-link" href={block.url} target="_blank" rel="noreferrer">{localize(block.label || "فتح الرابط")}<ChevronLeft size={16} /></a>; return <p>{localize(block.text)}</p>; }
export default function AssistantWidget() {
const { i18n, ready, t } = useTranslation();
const widgetRef = useRef<HTMLDivElement | null>(null);
const closeTimerRef = useRef<number | null>(null);
const isEnglish = i18n.resolvedLanguage === "en";
const resources = i18n.getResourceBundle("en", "translation");
const contactArabic = i18n.getResourceBundle("ar", "translation").chatbotContact.response;
const translatedCopy = { ...resources.chatbot.copy, ...resources.chatbotUI, [contactArabic]: resources.chatbotContact.response } as Record<string, string>;
const normalizeCopy = (text: string) => text.normalize("NFKC").replace(/[\u0640\u064b-\u065f\u0670]/g, "").trim().replace(/\s+/g, " ");
const localize = (text = "") => isEnglish ? Object.entries(translatedCopy).find(([original]) => normalizeCopy(original) === normalizeCopy(text))?.[1] ?? text : text;
const [content, setContent] = useState<AssistantContent>(fallbackAssistant);
const [contentLoading, setContentLoading] = useState(true);
const [open, setOpen] = useState(false);
const [closing, setClosing] = useState(false); const [selected, setSelected] = useState<AssistantQuestion | null>(null);
const contactLinkIndex = selected && normalizeCopy(selected.question) === normalizeCopy("سؤالي غير موجود")
  ? selected.answer.findIndex(block => block.type === "link" && block.label?.trim() === "X" && block.url)
  : -1;
const emailHref = `mailto:Hpconf@ksau-hs.edu.sa?subject=${encodeURIComponent(t("chatbotContact.subject"))}`;

const [chatPage, setChatPage] = useState<
  "main" | "pathways" | "questions"
>("main");

const [activePathway, setActivePathway] = useState<{
  slug: string;
  title: string;
} | null>(null);

const [pathways, setPathways] = useState<
  { slug: string; title: string }[]
>([]);

useEffect(() => {
  let active = true;

  const loadRoutes = import.meta.env.DEV
    ? loadRouteRecords
    : loadPublishedRouteRecords;

  void loadRoutes()
    .then((records) => {
      if (!active) return;

      setPathways(
        records.map(routeToPathway).map((route) => ({
          slug: route.slug,
          title: route.title,
        }))
      );
    })
    .catch((error) => {
      console.error("Failed to load chatbot pathways:", error);
    });

  return () => {
    active = false;
  };
}, []);

const closeAssistant = useCallback((resetConversation = false) => {
  if (closeTimerRef.current !== null) return;

  setClosing(true);

  closeTimerRef.current = window.setTimeout(() => {
    closeTimerRef.current = null;
    setOpen(false);

    // Reset only when ending the conversation
    if (resetConversation) {
  setSelected(null);
  setChatPage("main");
  setActivePathway(null);
}

    setClosing(false);
  }, 240);
}, []);


const toggleAssistant = () => {
  if (closeTimerRef.current !== null) return;
  if (open) {
    closeAssistant();
    return;
  }

  setClosing(false);
  setOpen(true);
};

/* Dismiss only for interactions outside the window and launcher. */
useEffect(() => {
  if (!open || closing) return;
  const isInside = (target: EventTarget | null) =>
    target instanceof Node && Boolean(widgetRef.current?.contains(target));
  const onOutsideInteraction = (event: Event) => {
    if (!isInside(event.target)) closeAssistant();
  };
  // Capture catches page/element scrolling, while message scrolling stays inside the widget.
  document.addEventListener("pointerdown", onOutsideInteraction, { capture: true, passive: true });
  document.addEventListener("wheel", onOutsideInteraction, { capture: true, passive: true });
  document.addEventListener("focusin", onOutsideInteraction, true);
  window.addEventListener("scroll", onOutsideInteraction, { capture: true, passive: true });
  return () => {
    document.removeEventListener("pointerdown", onOutsideInteraction, true);
    document.removeEventListener("wheel", onOutsideInteraction, true);
    document.removeEventListener("focusin", onOutsideInteraction, true);
    window.removeEventListener("scroll", onOutsideInteraction, true);
  };
}, [open, closing, closeAssistant]);

useEffect(() => {
  let active = true;
  void loadAssistant()
    .then(value => { if (active) setContent(value); })
    .catch(error => console.error("Assistant loading error:", error))
    .finally(() => { if (active) setContentLoading(false); });
  const resetWindow = () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    setOpen(false);
    setClosing(false);
  };
  window.addEventListener("pagehide", resetWindow);
  window.addEventListener("pageshow", resetWindow);
  return () => {
    active = false;
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    window.removeEventListener("pagehide", resetWindow);
    window.removeEventListener("pageshow", resetWindow);
  };
}, []);

const starterQuestions = [
  {
    id: "pathways",
    question: "المسارات",
    answer: [
      {
        type: "text",
        text: "تعرّف على مسارات المؤتمر وتفاصيل المشاركة في كل مسار."
      },
      {
        type: "link",
        label: "استعراض المسارات",
        url: "/#pathways"
      }
    ]
  },

{
  id: "registration",
  question: "التسجيل",
  answer: [
    {
      type: "text",
      text: "يفتح التسجيل يوم 27 ديسمبر 2026، وينتهي يوم 2 مارس 2027"
    }
  ]
},


].map((item) =>
  content.questions.find(
    (question) => question.question.trim() === item.question
  ) ?? item
) as AssistantQuestion[];

/* Dynamic Chat Height */

const popupRef = useRef<HTMLElement | null>(null);
const bodyContentRef = useRef<HTMLDivElement | null>(null);
const [chatHeight, setChatHeight] = useState(240);


useLayoutEffect(() => {
  if (!open) return;

  const popup = popupRef.current;
  const content = bodyContentRef.current;
  const header = popup?.querySelector("header");
  const body = popup?.querySelector(".assistant-popup-body");

  if (!popup || !content || !header || !body) return;

  let frameId = 0;

  const updateHeight = () => {
    cancelAnimationFrame(frameId);

    frameId = requestAnimationFrame(() => {
      const styles = getComputedStyle(body);

      const paddingY =
        parseFloat(styles.paddingTop) +
        parseFloat(styles.paddingBottom);

      const naturalHeight = Math.ceil(
        header.getBoundingClientRect().height +
        content.getBoundingClientRect().height +
        paddingY +
        2
      );

      const maximum = Math.max(225, window.innerHeight - 120);

      const nextHeight = Math.min(
        maximum,
        Math.max(225, naturalHeight)
      );

      setChatHeight((current) =>
        current === nextHeight ? current : nextHeight
      );
    });
  };

  const observer = new ResizeObserver(updateHeight);

  observer.observe(content);
  updateHeight();

  window.addEventListener("resize", updateHeight);

  return () => {
    observer.disconnect();
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", updateHeight);
  };
}, [
  open,
  selected,
  chatPage,
  activePathway?.slug,
  pathways.length,
  content.questions.length,
  isEnglish,
]);


const isContactQuestion = (question: AssistantQuestion) => normalizeCopy(question.question) === normalizeCopy("سؤالي غير موجود");
const existingContact = content.questions.find(isContactQuestion);
const contactX = existingContact?.answer.find(block => block.type === "link" && block.label?.trim() === "X" && block.url)
  ?? { type: "link" as const, label: "X", url: "https://x.com/ksau_events" };
const sharedContactQuestion: AssistantQuestion = {
  id: "shared-track-contact",
  question: "سؤالي غير موجود",
  pathwaySlug: activePathway?.slug,
  answer: [{ type: "text", text: contactArabic }, contactX],
};
const pathwayQuestions = activePathway
  ? [...content.questions.filter(question => question.pathwaySlug === activePathway.slug && !isContactQuestion(question)), sharedContactQuestion]
  : [];

 if (!ready || !i18n.isInitialized || !i18n.resolvedLanguage || contentLoading || !content.enabled) return null; return createPortal(<div ref={widgetRef} className="assistant-widget" dir={isEnglish ? "ltr" : "rtl"}><button className="assistant-fab" onClick={toggleAssistant} aria-label={localize("فتح المساعد")}><Bot size={22} /><span className="assistant-launcher-badge">{isEnglish && content.icon === "؟" ? "?" : content.icon}</span></button>{open && <div className={`assistant-popup-backdrop ${closing ? "is-closing" : ""}`}>

<section
  ref={popupRef}
  className={`assistant-popup ${selected ? "has-answer" : ""}`}
  style={{
    "--hpc-chat-height": `${chatHeight}px`
  } as React.CSSProperties}
  dir={isEnglish ? "ltr" : "rtl"}
>

<header><div className="assistant-popup-brand"><span><BotMessageSquare size={23} /></span><div><b>{localize(content.name)}</b><small>{localize("دليلك لكل ما يخص المؤتمر")}</small></div></div><button onClick={() => closeAssistant()} aria-label={localize("إغلاق")}>
  <X size={18} />
</button></header><div className="assistant-popup-body">
  <div ref={bodyContentRef} className="assistant-popup-content">{selected ? <><div className="assistant-question-selected">{localize(selected.question)}</div><div className="assistant-answer">{selected.answer.map((block, index) => index === contactLinkIndex ? <div className="assistant-contact-buttons" key={`${block.type}-${index}`}><Block block={block} localize={localize} /><a className="assistant-answer-link" href={emailHref}>{t("chatbotContact.email")}<ChevronLeft size={16} /></a></div> : <Block key={`${block.type}-${index}`} block={block} localize={localize} />)} </div>
<div className="assistant-action-buttons">
  
{chatPage === "questions" && (
  <button
    type="button"
    className="assistant-back"
    onClick={() => setSelected(null)}
  >
    <ArrowRight size={16} />{localize("العودة للأسئلة")}</button>
)}

  <button
    type="button"
    className="assistant-back"
    onClick={() => {
  setSelected(null);

  if (chatPage === "questions") {
    setChatPage("pathways");
    setActivePathway(null);
  } else {
    setChatPage("main");
  }
}}
  >
    <ArrowRight size={16} />
    {chatPage === "questions"
  ? localize("العودة للمسارات")
  : localize("العودة للرئيسية")}
  </button>

  <button
    type="button"
    className="assistant-end"
    onClick={() => closeAssistant(true)}
  >
    <X size={16} />{localize("إنهاء المحادثة")}</button>
</div>

</> : <>
  <h2>
    {chatPage === "main"
      ? localize(content.welcome)
      : chatPage === "pathways"
        ? localize("اختر المسار")
        : isEnglish ? `${resources.chatbot.faq} – ${localize(activePathway?.title ?? "")}` : `الأسئلة الشائعة – ${activePathway?.title ?? ""}`}
  </h2>

  <div
  key={chatPage}
  className={`assistant-question-list ${
    chatPage === "pathways" ? "is-pathways-list" : ""
  }`}
>
    {chatPage === "main" ? (
      starterQuestions.map((question, index) => (
        <button
          key={String(question.id ?? index)}
          onClick={() => {
            if (question.id === "pathways" || question.question === "المسارات") {
              setChatPage("pathways");
            } else {
              setSelected(question);
            }
          }}
        >
          {localize(question.question)}
          <ChevronLeft size={16} />
        </button>
      ))
    ) : chatPage === "pathways" ? (
      pathways.map((pathway) => (
        <button
          key={pathway.slug}
          onClick={() => {
            setActivePathway(pathway);
            setChatPage("questions");
          }}
        >
          {localize(pathway.title)}
          <ChevronLeft size={16} />
        </button>
      ))
    ) : pathwayQuestions.length > 0 ? (
  pathwayQuestions.map((question, index) => (
    <button
      key={String(question.id ?? index)}
      onClick={() => setSelected(question)}
    >
      {localize(question.question)}
      <ChevronLeft size={16} />
    </button>
  ))
) : (
  <p>{localize("لم تتم إضافة أسئلة شائعة لهذا المسار بعد.")}</p>
)}
  </div>

  
{chatPage !== "main" && (
  <div className="assistant-action-buttons">
    <button
      type="button"
      className="assistant-back"
      onClick={() => {
        if (chatPage === "questions") {
          setChatPage("pathways");
          setActivePathway(null);
        } else {
          setChatPage("main");
        }
      }}
    >
      <ArrowRight size={16} />
      {chatPage === "questions"
  ? localize("العودة للمسارات")
  : localize("العودة للرئيسية")}
    </button>

    <button
      type="button"
      className="assistant-end"
      onClick={() => {
        setChatPage("main");
        setActivePathway(null);
        closeAssistant(true);
      }}
    >
      <X size={16} />{localize("إنهاء المحادثة")}</button>
  </div>
)}

</>}</div></div></section></div>}</div>, document.body); }

