
import i18n from "./lib/i18n";
import { createRoot } from "react-dom/client";
import App from "./App";
import { getHomeLayoutFonts, readHomeNavigation } from "./lib/homeScroll";
import "./admin.css";

void i18n;

const render = () => createRoot(document.getElementById("root")!).render(<App />);
const restoringHome = document.documentElement.hasAttribute("data-home-boot")
  && (readHomeNavigation().scroll?.y ?? 0) > 0;
const layoutFonts = restoringHome ? getHomeLayoutFonts() : [];

// Measure a restored position with the same font metrics as the saved page.
if (layoutFonts.length) {
  void Promise.allSettled(layoutFonts.map(font => font.load())).then(render);
} else {
  render();
}
