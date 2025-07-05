import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress cross-origin error overlays in development
window.addEventListener('error', (event) => {
  if (event.message === 'Script error.' || event.message.includes('cross-origin')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('cross-origin')) {
    event.preventDefault();
    return false;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
