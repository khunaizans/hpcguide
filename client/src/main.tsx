
import i18n from "./lib/i18n";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./admin.css";

void i18n;

// Network requests and media decoding must never gate the first React render.
createRoot(document.getElementById("root")!).render(<App />);
