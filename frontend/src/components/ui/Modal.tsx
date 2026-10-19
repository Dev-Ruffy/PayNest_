"use client";

import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Popup dialog. It deliberately changes nothing outside itself: no scroll-lock
 * on <html>/<body> and no blur, because both force the browser to redraw the
 * whole page and showed up as a flicker. Scrolling is kept inside the popup
 * with `overscroll-contain`, and the fade/slide is plain CSS (see globals.css).
 */
export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  // Keep the latest onClose without re-running the effect below on every parent redraw.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="scrollbar-thin fixed inset-0 z-50 overflow-y-auto overscroll-contain" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-overlay fixed inset-0 bg-ink/60" aria-hidden="true" />
      <div
        className="relative flex min-h-full items-center justify-center p-4"
        onMouseDown={(e) => {
          // Only a click on the dim area closes it (not a drag that ends there).
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className={cn("modal-card w-full max-w-md rounded-xl2 bg-white p-5 shadow-cardHover sm:p-6", className)}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {title && <h3 className="font-display text-lg text-ink sm:text-xl">{title}</h3>}
              {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-ink"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
