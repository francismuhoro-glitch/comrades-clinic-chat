import { useCallback, useEffect, useState } from "react";

export const IOS_PWA_DISMISS_KEY = "ios_pwa_prompt_dismissed_until";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+ reports a desktop Mac user-agent but exposes touch points.
  const isMac = /Macintosh|Mac OS X/i.test(ua);
  const touchPoints = typeof navigator.maxTouchPoints === "number" ? navigator.maxTouchPoints : 0;
  return isMac && touchPoints > 1;
}

function isSafariBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isWebkit = /AppleWebKit/i.test(ua);
  // Chrome/Firefox/Edge/Opera on iOS cannot add to home screen the same way.
  const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\//i.test(ua);
  const looksSafari = /Safari/i.test(ua) && !/Chrome|Chromium|Android/i.test(ua);
  return isWebkit && looksSafari && !isOtherBrowser;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mediaStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return mediaStandalone || iosStandalone;
}

function isDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(IOS_PWA_DISMISS_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) return false;
    return Date.now() < until;
  } catch {
    return false;
  }
}

export type IosPwaPrompt = {
  showPrompt: boolean;
  dismissPrompt: () => void;
};

export function useIosPwaPrompt(): IosPwaPrompt {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!isIosDevice()) return;
    if (!isSafariBrowser()) return;
    if (isStandalone()) return;
    if (isDismissed()) return;
    setShowPrompt(true);
  }, []);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    try {
      window.localStorage.setItem(IOS_PWA_DISMISS_KEY, String(Date.now() + SEVEN_DAYS_MS));
    } catch {
      // Private mode / storage disabled — dismissal is session-only.
    }
  }, []);

  return { showPrompt, dismissPrompt };
}
