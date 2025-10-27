import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";

/**
 * Application Initialization
 * This file serves as the entry point, responsible for mounting the React application
 * to the DOM root element and wrapping the main App component with BrowserRouter
 * to enable routing across the application.
 */
const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
