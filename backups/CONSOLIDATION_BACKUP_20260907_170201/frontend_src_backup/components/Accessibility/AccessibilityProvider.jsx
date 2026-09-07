/**
 * AccessibilityProvider — the v42 A11Y model {simple, kiosk, voice, sms}
 * made real.
 *
 * WHY THIS IS NOT A THEME SWITCHER
 * These four modes describe genuinely different access situations, not taste:
 *
 *   simple  the full interface is overwhelming — larger type, fewer competing
 *           signals, decorative motion removed.
 *   kiosk   a shared village or CSC terminal. Nobody's personal device, so
 *           the session must not persist and payment details must never be
 *           stored. Larger targets for standing use at arm's length.
 *   voice   screen content is read aloud; the focus ring is the user's
 *           position in the document when they cannot see it.
 *   sms     a feature phone with no data connection. For many farmers this
 *           is the only channel that exists.
 *
 * Mirrors the backend `accessibility_modes` table (migration 992), so the API
 * can adapt its payload — not just the CSS. A user in SMS mode should not be
 * sent a 200-item catalogue.
 */

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'afrera.a11y';

export const A11Y_MODES = Object.freeze({
  SIMPLE: 'simple',
  KIOSK: 'kiosk',
  VOICE: 'voice',
  SMS: 'sms',
});

/** Kiosk is a shared device: nothing personal may outlive the session. */
const SHARED_DEVICE_MODES = [A11Y_MODES.KIOSK];
/** Bandwidth-constrained: the API should send less, not just render less. */
const LOW_BANDWIDTH_MODES = [A11Y_MODES.SMS];

const AccessibilityContext = createContext(null);

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    // A corrupt or unavailable preference must never prevent the app loading.
    return {};
  }
}

export function AccessibilityProvider({ children }) {
  const [modes, setModes] = useState(() => {
    const s = readStored();
    return {
      simple: Boolean(s.simple),
      kiosk: Boolean(s.kiosk),
      voice: Boolean(s.voice),
      // SMS defaults to true, matching v42. It is a capability the platform
      // always offers, not something the user must discover and enable.
      sms: s.sms === undefined ? true : Boolean(s.sms),
    };
  });

  const isSharedDevice = SHARED_DEVICE_MODES.some((m) => modes[m]);
  const isLowBandwidth = LOW_BANDWIDTH_MODES.some((m) => modes[m]);

  // Apply as classes on <html> so CSS can respond without prop-drilling
  // through 45 components.
  useEffect(() => {
    const root = document.documentElement;
    Object.values(A11Y_MODES).forEach((m) => {
      root.classList.toggle(`a11y-${m}`, Boolean(modes[m]));
    });
  }, [modes]);

  // Persist — except on a shared device, where persisting a preference would
  // leak one user's setting onto the next person to walk up to the terminal.
  useEffect(() => {
    try {
      if (isSharedDevice) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(modes));
    } catch {
      /* storage unavailable (private mode, quota) — the app still works */
    }
  }, [modes, isSharedDevice]);

  const toggleMode = useCallback((mode) => {
    if (!Object.values(A11Y_MODES).includes(mode)) {
      throw new Error(`Unknown accessibility mode "${mode}"`);
    }
    setModes((prev) => ({ ...prev, [mode]: !prev[mode] }));
  }, []);

  const setMode = useCallback((mode, enabled) => {
    if (!Object.values(A11Y_MODES).includes(mode)) {
      throw new Error(`Unknown accessibility mode "${mode}"`);
    }
    setModes((prev) => ({ ...prev, [mode]: Boolean(enabled) }));
  }, []);

  const value = useMemo(() => ({
    modes,
    toggleMode,
    setMode,
    isSharedDevice,
    isLowBandwidth,
    /**
     * Headers for the API layer, so the backend can trim its response rather
     * than the client downloading a payload it will not render.
     */
    requestHeaders: {
      'X-A11y-Modes': Object.entries(modes).filter(([, on]) => on).map(([m]) => m).join(',') || 'none',
      'X-Low-Bandwidth': isLowBandwidth ? '1' : '0',
    },
    /** Page size hint — an SMS-mode user should not receive 200 rows. */
    pageSize: isLowBandwidth ? 10 : modes.simple || modes.kiosk ? 20 : 50,
  }), [modes, toggleMode, setMode, isSharedDevice, isLowBandwidth]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return ctx;
}

export default AccessibilityProvider;
