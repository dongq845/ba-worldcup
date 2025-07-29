// ba-worldcup/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import NotFoundPage from "./NotFoundPage.jsx";

// This line tells React to take control of the 'root' div.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Route 1: The Homepage */}
        {/* If the URL path is exactly "/", render the main App component. */}
        <Route path="/" element={<App />} />

        {/* Route 2: The "Catch-All" or "Not Found" Route */}
        {/* The path="*" is a wildcard that matches ANY other URL. */}
        {/* If no other route matches, this one will be rendered. */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
