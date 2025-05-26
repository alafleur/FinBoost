import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Minimal test component to verify React is working
function TestApp() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">React Test</h1>
        <p className="text-gray-600">If you see this, React is working!</p>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TestApp />
  </StrictMode>
);