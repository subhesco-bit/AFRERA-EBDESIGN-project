import { useEffect, useRef } from 'react';

/**
 * Accessible drop-in replacement for the hand-rolled
 * `fixed inset-0 bg-black bg-opacity-50 ...` overlay pattern repeated across
 * 26 modals in this codebase (25 pages + ResourceManager.jsx), none of which
 * had role="dialog", a focus trap, or Escape-to-close (FIXES.md C2,
 * 2026-08-28 audit). Drop-in: same outer wrapper class/positioning, so
 * existing inner markup (the white card + its content) does not need to
 * change - only the outer wrapper and its `onClose` need swapping in.
 *
 * Handles: role="dialog" + aria-modal, Escape closes, focus moves into the
 * modal on open and is trapped (Tab/Shift+Tab wrap within it), focus
 * returns to the trigger element on close.
 */
function Modal({ onClose, children, className = '' }) {
  const overlayRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;

    const focusable = overlayRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    )
    ;(focusable?.[0] || overlayRef.current)?.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = overlayRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal ${className}`}
    >
      {children}
    </div>
  );
}

export default Modal;
