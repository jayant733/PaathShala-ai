import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Traps keyboard focus within the returned element while `active`, moves focus
 * to the first focusable child on open, closes on Escape, and restores focus to
 * the previously-focused element when the trap deactivates (or the modal
 * unmounts).
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean, onEscape?: () => void) {
  const ref = useRef<T | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;

    // Remember what to return focus to once the trap closes.
    const activeEl = document.activeElement;
    restoreRef.current = activeEl instanceof HTMLElement ? activeEl : null;

    // Move focus into the dialog, to the first focusable control.
    const node = ref.current;
    if (node) {
      const first = node.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (first) {
        first.focus();
      } else {
        node.setAttribute('tabindex', '-1');
        node.focus();
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscapeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const el = ref.current;
      if (!el) return;
      const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeTarget = document.activeElement as HTMLElement | null;
      // Keep Tab/Shift+Tab cycling within the dialog.
      if (!activeTarget || !el.contains(activeTarget)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && activeTarget === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeTarget === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      restoreRef.current?.focus?.();
    };
  }, [active]);

  return ref;
}
