// Web push fan-out — SERVER side.
//
// `dispatchWebPush` is a server function: it reads push subscriptions matching
// an in-app notification and delivers the payload through the browser vendors'
// push endpoints using VAPID (implemented with node:crypto only — no extra
// dependency, no external push service).
//
// Environment:
//   VITE_VAPID_PUBLIC_KEY — the subscription application server key (public;
//     a deployed default is built in below, so clients can subscribe even
//     before this env is set).
//   VAPID_PRIVATE_KEY     — REQUIRED for sending. Without it, pushes are
//     skipped silently and only the in-app bell works.
//   VAPID_SUBJECT         — optional mailto: contact embedded in the VAPID JWT.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabase } from "./supabase";

/**
 * Deployed default application server key (public by design — safe to embed).
 * Rotating: set VITE_VAPID_PUBLIC_KEY (server + client) and regenerate.
 */
const FALLBACK_VAPID_PUBLIC_KEY =
  "BKbrW0fUXuICa04fyJFKeAeZ5iCMNrXFi8i-n-Dd3T4SoX_LxzW5FeebmxoXNJl8zklswuPE-1R8LUpuSY_YPGs";

const dispatchInput = z.object({
  audience: z.enum(["patient", "doctor"]),
  recipientId: z.string().uuid().nullish(),
  title: z.string().min(1).max(150),
  body: z.string().max(400).optional(),
  url: z.string().max(200).optional(),
});

export const dispatchWebPush = createServerFn({ method: "POST" })
  .validator(dispatchInput)
  .handler(async ({ data }): Promise<{ sent: number }> => {
    try {
      const publicKey = process.env["VITE_VAPID_PUBLIC_KEY"]?.trim() || FALLBACK_VAPID_PUBLIC_KEY;
      const privateKey = process.env["VAPID_PRIVATE_KEY"]?.trim();
      if (!privateKey) return { sent: 0 };

      let query = supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("role", data.audience);
      if (data.audience === "patient") {
        if (data.recipientId) {
          query = query.eq("recipient_id", data.recipientId);
        } else {
          // Guests can't be addressed — only push to account-linked devices.
          query = query.not("recipient_id", "is", null);
        }
      }
      const { data: subscriptions, error } = await query;
      if (error || !subscriptions || subscriptions.length === 0) return { sent: 0 };

      // Loaded only inside the server handler (node:crypto stays client-free).
      const { sendWebPushMessage } = await import("./web-push-crypto");

      const payload = Buffer.from(
        JSON.stringify({
          title: data.title,
          body: data.body ?? "",
          url: data.url ?? (data.audience === "doctor" ? "/doctor" : "/visits"),
        }),
      );
      const subject = process.env["VAPID_SUBJECT"]?.trim() || "mailto:alerts@comracare.co.ke";

      let sent = 0;
      for (const subscription of subscriptions) {
        const status = await sendWebPushMessage({
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          payload,
          vapid: { publicKey, privateKey },
          subject,
        });
        if (status >= 200 && status < 300) {
          sent += 1;
        } else if (status === 404 || status === 410) {
          // Subscription expired on the push service — clean it up.
          await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        }
      }
      return { sent };
    } catch (err) {
      console.warn("Web push dispatch notice:", err);
      return { sent: 0 };
    }
  });
