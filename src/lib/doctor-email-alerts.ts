// Email alerts to the clinic doctor — SERVER side.
//
// When a patient lands in the queue or submits a payment for verification,
// the doctor (every profiles row with role 'doctor'/'admin' and an email,
// falling back to the DOCTOR_EMAIL env) gets a short email via Brevo — the
// same provider that already delivers visit reports (BREVO_API_KEY +
// BREVO_SENDER_EMAIL). Alerts are fire-and-forget: they never block or break
// the patient flow, and they silently no-op when Brevo isn't configured.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabase } from "./supabase";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Fetch email addresses for profiles with any of the specified roles.
 */
async function recipientsByRole(roles: string[]): Promise<string[]> {
  const recipients: string[] = [];
  try {
    const { data } = await supabase
      .from("profiles")
      .select("email, role")
      .in("role", roles)
      .not("email", "is", null);
    for (const row of (data ?? []) as { email: string | null }[]) {
      const email = row.email?.trim().toLowerCase();
      if (email && email.includes("@")) recipients.push(email);
    }
  } catch {
    // Fall through to the env fallback.
  }
  if (recipients.length === 0) {
    const fallback = process.env["DOCTOR_EMAIL"]?.trim().toLowerCase();
    if (fallback && fallback.includes("@")) recipients.push(fallback);
  }
  return [...new Set(recipients)];
}

/**
 * Recipients for general doctor notifications (doctors + admins).
 */
async function doctorRecipients(): Promise<string[]> {
  return recipientsByRole(["doctor", "admin"]);
}

/**
 * Recipients for therapy/psychiatrist notifications (psychiatrists + admins).
 */
async function psychiatristRecipients(): Promise<string[]> {
  return recipientsByRole(["psychiatrist", "admin"]);
}

function wrapEmail(title: string, bodyHtml: string): string {
  const siteUrl = process.env["SITE_URL"]?.trim().replace(/\/$/, "");
  const cta = siteUrl
    ? `<a href="${siteUrl}/doctor" style="display:inline-block;background:#17828b;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 18px;border-radius:10px;">Open the doctor portal</a>`
    : "";
  return `<div style="margin:0;padding:24px;background:#f4fafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #dbe9ea;overflow:hidden;">
    <div style="background:#17828b;color:#ffffff;padding:20px 24px;">
      <div style="font-size:20px;font-weight:800;">COMRACARE</div>
      <div style="font-size:13px;opacity:.9;margin-top:2px;">${escapeHtml(title)}</div>
    </div>
    <div style="padding:24px;color:#134e4a;font-size:14px;line-height:1.6;">${bodyHtml}</div>
    ${cta ? `<div style="padding:0 24px 24px;">${cta}</div>` : ""}
    <div style="background:#eef6f6;padding:14px 24px;text-align:center;font-size:11px;color:#5b7470;">
      Automated alert from COMRACARE Student Clinic · the in-app bell has the same info.
    </div>
  </div>
</div>`;
}

async function sendDoctorEmail(subject: string, html: string, recipients?: string[]): Promise<boolean> {
  const apiKey = process.env["BREVO_API_KEY"]?.trim();
  const sender = process.env["BREVO_SENDER_EMAIL"]?.trim();
  if (!apiKey || !sender) return false;

  const emailRecipients = recipients ?? await doctorRecipients();
  if (emailRecipients.length === 0) return false;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: sender, name: "COMRACARE Student Clinic" },
        to: emailRecipients.map((email) => ({ email })),
        subject,
        htmlContent: html,
      }),
    });
    return response.ok;
  } catch (err) {
    console.warn("Doctor email alert notice:", err);
    return false;
  }
}

const newPatientInput = z.object({
  patientName: z.string().min(1).max(120),
  campus: z.string().max(120).optional(),
  triage: z.enum(["routine", "urgent", "emergency"]),
  mode: z.enum(["chat", "video"]),
  consultationType: z.enum(["general", "therapy"]).optional().default("general"),
});

/** Fired when a patient completes intake and lands awaiting payment. */
export const notifyDoctorNewPatient = createServerFn({ method: "POST" })
  .validator(newPatientInput)
  .handler(async ({ data }): Promise<{ sent: boolean }> => {
    const consultationType = data.consultationType ?? "general";
    const triageBadge =
      data.triage === "emergency"
        ? '<span style="background:#fee2e2;color:#b91c1c;font-weight:700;font-size:11px;padding:2px 8px;border-radius:10px;">EMERGENCY TRIAGE</span>'
        : data.triage === "urgent"
          ? '<span style="background:#fef3c7;color:#b45309;font-weight:700;font-size:11px;padding:2px 8px;border-radius:10px;">URGENT</span>'
          : '<span style="background:#dcfce7;color:#15803d;font-weight:700;font-size:11px;padding:2px 8px;border-radius:10px;">ROUTINE</span>';

    const when = new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });
    const subject =
      consultationType === "therapy"
        ? `🧠 New Therapy Session: ${data.patientName} (KSh 250)`
        : `New patient: ${data.patientName} (${data.triage} triage)`;
    const serviceType = consultationType === "therapy" ? "Therapy / Mental Health Session" : "General Consultation";
    const fee = consultationType === "therapy" ? "KSh 250" : "KSh 150";
    
    // Route to psychiatrist for therapy, doctor for general
    const recipients =
      consultationType === "therapy"
        ? await psychiatristRecipients()
        : await doctorRecipients();

    const sent = await sendDoctorEmail(
      subject,
      wrapEmail(
        consultationType === "therapy" ? "New therapy session in the queue" : "New patient in the queue",
        `<p><strong>${escapeHtml(data.patientName)}</strong> just completed intake and is completing payment.</p>
         <p>${triageBadge}&nbsp; <strong>${data.mode === "video" ? "Prefers a voice/video call" : "Text chat"}</strong></p>
         <p><strong>Service:</strong> ${serviceType} · ${fee}</p>
         <p style="color:#5b7470;font-size:13px;">Campus: ${escapeHtml(data.campus || "Not set")}<br/>Time: ${escapeHtml(when)} (EAT)</p>`,
      ),
      recipients,
    );
    return { sent };
  });

const paymentInput = z.object({
  patientName: z.string().min(1).max(120),
  mpesaCode: z.string().min(3).max(40),
  phone: z.string().max(20).optional(),
  amountKes: z.number().int().positive().max(1_000_000),
  consultationType: z.enum(["general", "therapy"]).optional().default("general"),
});

/** Fired when a patient submits an M-Pesa code for the doctor to verify. */
export const notifyDoctorPaymentClaim = createServerFn({ method: "POST" })
  .validator(paymentInput)
  .handler(async ({ data }): Promise<{ sent: boolean }> => {
    const consultationType = data.consultationType ?? "general";
    const when = new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });
    
    // Route to psychiatrist for therapy, doctor for general
    const recipients =
      consultationType === "therapy"
        ? await psychiatristRecipients()
        : await doctorRecipients();

    const sent = await sendDoctorEmail(
      `Payment to verify: ${data.patientName} — KSh ${data.amountKes}`,
      wrapEmail(
        "Payment awaiting your verification",
        `<p><strong>${escapeHtml(data.patientName)}</strong> submitted an M-Pesa payment claim.</p>
         <p style="font-size:15px;"><strong>Code: <span style="color:#17828b;">${escapeHtml(data.mpesaCode)}</span> · KSh ${data.amountKes}</strong></p>
         <p><strong>Consultation type:</strong> ${consultationType === "therapy" ? "Therapy / Mental Health (KSh 250)" : "General Consultation (KSh 150)"}</p>
         <p style="color:#5b7470;font-size:13px;">Phone: ${escapeHtml(data.phone || "Not set")}<br/>Time: ${escapeHtml(when)} (EAT)</p>
         <p>Verify it in the portal's <strong>Payments</strong> tab to move them into the queue.</p>`,
      ),
      recipients,
    );
    return { sent };
  });
