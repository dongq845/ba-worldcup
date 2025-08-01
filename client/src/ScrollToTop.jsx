// client/src/ScrollToTop.jsx

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// This component will scroll the window to the top on every route change.
const ScrollToTop = () => {
  // Extracts the pathname from the current location.
  const { pathname } = useLocation();

  // The useEffect hook will run every time the `pathname` changes.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // This component does not render any visible UI.
  return null;
};

export default ScrollToTop;
