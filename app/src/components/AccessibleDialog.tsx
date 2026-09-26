import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { AppController } from "../state/AppController";

interface AccessibleDialogProps {
  controller: AppController;
  labelledBy: string;
  className: string;
  children: ReactNode;
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function AccessibleDialog({ controller, labelledBy, className, children }: AccessibleDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const heading = [...dialog.querySelectorAll<HTMLElement>("[id]")]
      .find((element) => element.id === labelledBy);
    const opener = controller.getDialogTrigger();
    (heading ?? dialog).focus({ preventScroll: true });

    const visibleFocusable = () => [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)]
      .filter((element) => element.getClientRects().length > 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        controller.back();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = visibleFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        (heading ?? dialog).focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === heading)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) (heading ?? dialog).focus();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      if (opener?.isConnected) requestAnimationFrame(() => {
        if (opener.isConnected && !opener.closest("[inert]")) opener.focus({ preventScroll: true });
      });
    };
  }, [controller, labelledBy]);

  return <section ref={dialogRef} className={className} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
    {children}
  </section>;
}
