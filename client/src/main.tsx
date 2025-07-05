import { createRoot } from "react-dom/client";
import "./index.css";

// Simple test component to debug white screen
function TestApp() {
  console.log("TestApp rendering");
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-4">TEST APP WORKING</h1>
        <p className="text-xl">If you see this, React is rendering correctly</p>
        <div className="mt-4 p-4 bg-white text-black rounded">
          Current time: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

// Suppress cross-origin error overlays in development
window.addEventListener('error', (event) => {
  console.log("Error caught:", event.message);
  if (event.message === 'Script error.' || event.message.includes('cross-origin')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.log("Unhandled rejection:", event.reason);
  if (event.reason?.message?.includes('cross-origin')) {
    event.preventDefault();
    return false;
  }
});

console.log("main.tsx loaded, creating root");
const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);

if (rootElement) {
  const root = createRoot(rootElement);
  console.log("Root created, rendering TestApp");
  root.render(<TestApp />);
  console.log("TestApp rendered");
} else {
  console.error("Root element not found!");
}
