import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import styles from "./styles.module.css";

const Dialog = ({ open, onClose, title, description, children, size = "medium" }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    const focusTarget = dialogRef.current?.querySelector("[data-dialog-cancel]")
      || dialogRef.current?.querySelector("button, input, select, textarea, [href]");
    focusTarget?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-describedby={description ? "proof-dialog-description" : undefined}
        aria-labelledby="proof-dialog-title"
        aria-modal="true"
        className={`${styles.dialog} ${styles[size] || ""}`}
        ref={dialogRef}
        role="dialog"
      >
        <header className={styles.header}>
          <div>
            <h2 id="proof-dialog-title">{title}</h2>
            {description && <p id="proof-dialog-description">{description}</p>}
          </div>
          <button aria-label="Close dialog" className={styles.closeButton} onClick={onClose} type="button">
            <FiX aria-hidden="true" />
          </button>
        </header>
        <div className={styles.content}>{children}</div>
      </section>
    </div>,
    document.body,
  );
};

export default Dialog;
