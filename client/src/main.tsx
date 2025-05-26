import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add custom styles for the gradient text and reward pool
const style = document.createElement('style');
style.textContent = `
  .gradient-text {
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    background-image: linear-gradient(90deg, #3B82F6, #10B981);
  }
  .reward-pool {
    height: 30px;
    transition: width 1.5s ease-in-out;
    background: linear-gradient(90deg, #3B82F6, #10B981);
    border-radius: 15px;
  }
  .step-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  }
  
  body {
    font-family: 'Inter', sans-serif;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Montserrat', sans-serif;
  }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);