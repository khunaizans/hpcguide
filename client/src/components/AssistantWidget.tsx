import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, Bot, BotMessageSquare, ChevronLeft, FileText, Image as ImageIcon, X } from "lucide-react";
import { AssistantContent, AssistantQuestion, AnswerBlock, fallbackAssistant, loadAssistant } from "@/lib/assistant";

function Block({ block }: { block: AnswerBlock }) { if (block.type === "image" && block.url) return <img className="assistant-answer-image" src={block.url} alt={block.alt || "صورة من المساعد"} />; if (block.type === "file" && block.url) return <a className="assistant-answer-file" href={block.url} target="_blank" rel="noreferrer"><FileText size={17} />{block.label || "فتح الملف"}</a>; if (block.type === "link" && block.url) return <a className="assistant-answer-link" href={block.url} target="_blank" rel="noreferrer">{block.label || "فتح الرابط"}<ChevronLeft size={16} /></a>; return <p>{block.text}</p>; }
export default function AssistantWidget() { const [content, setContent] = useState<AssistantContent>(fallbackAssistant); const [open, setOpen] = useState(false);
const [closing, setClosing] = useState(false); const [selected, setSelected] = useState<AssistantQuestion | null>(null);

const closeAssistant = (resetConversation = false) => {
  if (closing) return;

  setClosing(true);

  window.setTimeout(() => {
    setOpen(false);

    // Reset only when ending the conversation
    if (resetConversation) {
      setSelected(null);
    }

    setClosing(false);
  }, 240);
};


const toggleAssistant = () => {
  if (open) {
    closeAssistant();
    return;
  }

  setClosing(false);
  setOpen(true);
};

/* Close chatbot when scrolling the page */

useEffect(() => {
  if (!open || closing) return;

  const handlePageScroll = () => {
    closeAssistant();
  };

  window.addEventListener("scroll", handlePageScroll, {
    passive: true
  });

  return () => {
    window.removeEventListener("scroll", handlePageScroll);
  };
}, [open, closing, closeAssistant]);

 useEffect(() => { let active = true; void loadAssistant().then((value) => { if (active) setContent(value); }); const openAssistant = () => { setOpen(true); setSelected(null); }; window.addEventListener("hpc:open-assistant", openAssistant); return () => { active = false; window.removeEventListener("hpc:open-assistant", openAssistant); }; }, []);
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
      text: "يفتح التسجيل يوم 27 ديسمبر2026، وينتهي يوم 18مارس 2027"
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
const [chatHeight, setChatHeight] = useState(240);

useLayoutEffect(() => {
  if (!open) return;

  const popup = popupRef.current;
  if (!popup) return;

  const header = popup.querySelector("header");
  const body = popup.querySelector(".assistant-popup-body");

  if (!header || !body) return;

  const updateHeight = () => {
    const maximum = Math.max(220, window.innerHeight - 120);

    const contentHeight =
      header.offsetHeight +
      body.scrollHeight +
      2;

    setChatHeight(
      Math.round(
        Math.min(maximum, Math.max(225, contentHeight))
      )
    );
  };

  updateHeight();

  const observer = new ResizeObserver(updateHeight);
  observer.observe(body);

  window.addEventListener("resize", updateHeight);

  return () => {
    observer.disconnect();
    window.removeEventListener("resize", updateHeight);
  };
}, [open, selected]);

 if (!content.enabled) return null; return <><button className="assistant-fab" onClick={toggleAssistant} aria-label="فتح المساعد"><Bot size={22} /><span>{content.icon}</span></button>{open && <div className={`assistant-popup-backdrop ${closing ? "is-closing" : ""}`} onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>

<section
  ref={popupRef}
  className={`assistant-popup ${selected ? "has-answer" : ""}`}
  style={{
    "--hpc-chat-height": `${chatHeight}px`
  } as React.CSSProperties}
  dir="rtl"
>

<header><div className="assistant-popup-brand"><span><BotMessageSquare size={23} /></span><div><b>{content.name}</b><small>دليلك لكل ما يخص المؤتمر</small></div></div><button onClick={() => closeAssistant()} aria-label="إغلاق">
  <X size={18} />
</button></header><div className="assistant-popup-body">{selected ? <><div className="assistant-question-selected">{selected.question}</div><div className="assistant-answer">{selected.answer.map((block, index) => <Block key={`${block.type}-${index}`} block={block} />)} </div>
<div className="assistant-action-buttons">
  <button
    type="button"
    className="assistant-back"
    onClick={() => setSelected(null)}
  >
    <ArrowRight size={16} />
    العودة للأسئلة
  </button>

  <button
    type="button"
    className="assistant-end"
    onClick={() => closeAssistant(true)}
  >
    <X size={16} />
    إنهاء المحادثة
  </button>
</div>
</> : <><h2>{content.welcome}</h2><div className="assistant-question-list">{starterQuestions.map((question, index) => <button key={String(question.id ?? index)} onClick={() => setSelected(question)}>{question.question}<ChevronLeft size={16} /></button>)}</div></>}</div></section></div>}</>; }
