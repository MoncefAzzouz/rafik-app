"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Renders its children into <body>, escaping any ancestor with a transform/filter/
// overflow that would otherwise trap a position:fixed overlay and cut the modal
// off-screen. Use this to wrap any full-screen modal overlay.
export default function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Lock background scroll while a modal is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
