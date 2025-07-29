// ba-worldcup/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import NotFoundPage from "./NotFoundPage.jsx";

// This line tells React to take control of the 'root' div.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Route path="/" element={<App />} />
    <Route path="*" element={<NotFoundPage />} />
  </React.StrictMode>
);
