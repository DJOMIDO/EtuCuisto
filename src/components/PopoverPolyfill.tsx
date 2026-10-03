"use client";

import { useEffect } from "react";

// Popover API : Baseline depuis 2025. Polyfill chargé seulement si le navigateur ne l'a pas.
export function PopoverPolyfill() {
  useEffect(() => {
    if (!("popover" in HTMLElement.prototype)) import("@oddbird/popover-polyfill");
  }, []);
  return null;
}
