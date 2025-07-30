// ba-worldcup/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import AboutPage from "./AboutPage.jsx";
import ScrollToTop from "./ScrollToTop.jsx";

// This line tells React to take control of the 'root' div.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Route 1: The Homepage */}
        <Route path="/" element={<App />} />

        {/* --- MODIFICATION: Add the new route for the About page --- */}
        <Route path="/about" element={<AboutPage />} />

        {/* Route 3: The "Catch-All" or "Not Found" Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
