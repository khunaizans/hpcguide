
import i18n from "./lib/i18n";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./admin.css";

void i18n;

createRoot(document.getElementById("root")!).render(<App />);
