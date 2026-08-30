import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768) {
  const checkIsMobile = () => {
    const isSmallWidth = window.innerWidth < breakpoint;
    
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;

    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    return isSmallWidth || (isTouchDevice && (isPortrait || window.innerHeight < breakpoint));
  };

  const [isMobile, setIsMobile] = useState(checkIsMobile);

  useEffect(() => {
    const handleResize = () => setIsMobile(checkIsMobile());
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}