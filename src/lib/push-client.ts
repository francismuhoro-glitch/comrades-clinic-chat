// Web push — CLIENT side.
//
// Registers the service worker (/sw.js) and manages push subscriptions.
// Permission is ONLY requested from an explicit user action (the "Turn on
// background alerts" button in the notification bell) — never on page load.

import { supabase } from "./supabase";

/**
 * Deployed default application server key (public by design). Matches the
 * fallback in push-server.ts; override with VITE_VAPID_PUBLIC_KEY.
 */
const FALLBACK_VAPID_PUBLIC_KEY =
  "BKbrW0fUXuICa04fyJFKeAeZ5iCMNrXFi8i-n-Dd3T4SoX_LxzW5FeebmxoXNJl8zklswuPE-1R8LUpuSY_YPGs";

export function vapidPublicKey(): string {
  const envKey = import.meta.env["VITE_VAPID_PUBLIC_KEY"]?.trim();
  return envKey || FALLBACK_VAPID_PUBLIC_KEY;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function isPushSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Register /sw.js. Safe to call repeatedly; returns null when unavailable. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    if (!("serviceWorker" in navigator)) return null;
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!registration) return null;
    if (Notification.permission !== "granted") return null;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  return (await currentSubscription()) !== null;
}

/**
 * Ask permission, subscribe, and store the subscription server-side.
 * `role` decides which fan-out stream receives pushes for this browser.
 */
export async function subscribeToPush(
  role: "patient" | "doctor",
  recipientId?: string | null | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isPushSupported()) {
    return { ok: false, error: "This browser doesn't support background notifications." };
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Notification permission wasn't granted." };
  }
  const registration = await registerServiceWorker();
  if (!registration) {
    return { ok: false, error: "Service worker couldn't start." };
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey()),
    }));

  const json = subscription.toJSON();
  const keys = (json.keys ?? {}) as { p256dh?: string; auth?: string };
  if (!keys.p256dh || !keys.auth) {
    return { ok: false, error: "Subscription keys were missing — try again." };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      role,
      ...(recipientId ? { recipient_id: recipientId } : {}),
      user_agent: navigator.userAgent.slice(0, 200),
    },
    { onConflict: "endpoint" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
