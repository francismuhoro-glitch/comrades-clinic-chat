import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { DOCTOR, type LabResult } from "./clinic-types";
import { supabase } from "./supabase";

const sendVisitReportSchema = z.object({
  consultationId: z.string().uuid(),
});

export interface SendVisitReportResult {
  ok: boolean;
  recipient?: string;
  error?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const sendVisitReportFn = createServerFn({ method: "POST" })
  .validator(sendVisitReportSchema)
  .handler(async ({ data }): Promise<SendVisitReportResult> => {
    const apiKey = process.env["BREVO_API_KEY"]?.trim();
    const senderEmail = process.env["BREVO_SENDER_EMAIL"]?.trim();

    if (!apiKey || !senderEmail) {
      return {
        ok: false,
        error:
          "Email delivery service is not configured on the server (BREVO_API_KEY or BREVO_SENDER_EMAIL missing).",
      };
    }

    // Fetch consultation row
    const { data: consultation, error: consultError } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", data.consultationId)
      .maybeSingle();

    if (consultError || !consultation) {
      return {
        ok: false,
        error: "Consultation record not found.",
      };
    }

    // Determine recipient email
    let targetEmail: string | null = consultation.patient_email?.trim() || null;

    if (!targetEmail && consultation.patient_id) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(consultation.patient_id);
        if (userData?.user?.email) {
          targetEmail = userData.user.email.trim();
        }
      } catch {
        // Ignore if admin user query fails
      }
    }

    if (!targetEmail) {
      return {
        ok: false,
        error:
          "No patient email address found for this visit. Please specify an email in the patient record.",
      };
    }

    // Fetch lab results
    const { data: labResultsRows } = await supabase
      .from("lab_results")
      .select("*")
      .eq("consultation_id", data.consultationId)
      .order("created_at", { ascending: true });

    const labResults = (labResultsRows || []) as LabResult[];

    const patientName = consultation.patient_name || "Patient";
    const campus = consultation.campus || "N/A";
    const visitDate = new Date(consultation.created_at || Date.now()).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const triageLevel = (consultation.triage_level || "routine").toUpperCase();
    const diagnosisNotes = consultation.diagnosis || "No specific diagnosis notes provided.";
    const prescription = consultation.prescription as {
      medication?: string;
      dosage?: string;
      duration?: string;
      notes?: string;
    } | null;
    const referral = consultation.referral as {
      destination?: string;
      reason?: string;
    } | null;

    // Compose HTML content
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Visit Report - Comrades Clinic</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: #0284c7; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 24px; }
    .section-title { font-size: 14px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; font-size: 13px; }
    .info-item { background: #f1f5f9; padding: 10px 14px; border-radius: 8px; }
    .info-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .info-value { font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-routine { background: #dcfce7; color: #15803d; }
    .badge-urgent { background: #fef3c7; color: #b45309; }
    .badge-emergency { background: #fee2e2; color: #b91c1c; }
    .badge-normal { background: #dcfce7; color: #15803d; }
    .badge-low, .badge-high { background: #fef3c7; color: #b45309; }
    .badge-critical { background: #fee2e2; color: #b91c1c; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-weight: 600; color: #475569; border-bottom: 1px solid #cbd5e1; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    .notes-box { background: #f8fafc; border-left: 4px solid #0284c7; padding: 12px; font-size: 13px; white-space: pre-line; border-radius: 0 8px 8px 0; }
    .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .doctor-sig { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; }
    .doctor-name { font-weight: 700; color: #0f172a; }
    .doctor-license { font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>COMRADES CLINIC</h1>
      <p>Official Patient Consultation &amp; Medical Visit Report</p>
    </div>
    <div class="content">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Patient Name</div>
          <div class="info-value">${escapeHtml(patientName)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Campus / Institution</div>
          <div class="info-value">${escapeHtml(campus)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Consultation Date</div>
          <div class="info-value">${escapeHtml(visitDate)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Triage Classification</div>
          <div class="info-value">
            <span class="badge ${triageLevel === "EMERGENCY" ? "badge-emergency" : triageLevel === "URGENT" ? "badge-urgent" : "badge-routine"}">
              ${triageLevel}
            </span>
          </div>
        </div>
      </div>

      <div class="section-title">Clinical Assessment &amp; Diagnosis</div>
      <div class="notes-box">${escapeHtml(diagnosisNotes)}</div>

      ${
        prescription && prescription.medication
          ? `
      <div class="section-title">Prescription Issued</div>
      <table>
        <thead>
          <tr>
            <th>Medication</th>
            <th>Dosage</th>
            <th>Duration</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${escapeHtml(prescription.medication)}</strong></td>
            <td>${escapeHtml(prescription.dosage || "As directed")}</td>
            <td>${escapeHtml(prescription.duration || "N/A")}</td>
            <td>${escapeHtml(prescription.notes || "-")}</td>
          </tr>
        </tbody>
      </table>
      `
          : ""
      }

      ${
        referral && referral.destination
          ? `
      <div class="section-title">Medical Referral</div>
      <div class="notes-box">
        <strong>Referred To:</strong> ${escapeHtml(referral.destination)}<br>
        <strong>Reason:</strong> ${escapeHtml(referral.reason || "Further physical clinical management")}
      </div>
      `
          : ""
      }

      ${
        labResults.length > 0
          ? `
      <div class="section-title">Laboratory Results</div>
      <table>
        <thead>
          <tr>
            <th>Test Panel</th>
            <th>LOINC</th>
            <th>Result Value</th>
            <th>Reference Range</th>
            <th>Flag</th>
            <th>Stage</th>
          </tr>
        </thead>
        <tbody>
          ${labResults
            .map(
              (r) => `
            <tr>
              <td><strong>${escapeHtml(r.panel || r.loinc_display || "Lab Test")}</strong></td>
              <td><small>${escapeHtml(r.loinc_code || "N/A")}</small></td>
              <td>${
                r.stage === "resulted" || r.stage === "reviewed"
                  ? `${escapeHtml(r.result_value)} ${escapeHtml(r.unit || "")}`
                  : "<em>Pending Result</em>"
              }</td>
              <td>${escapeHtml(r.reference_range || "N/A")}</td>
              <td><span class="badge badge-${escapeHtml(r.flag || "normal")}">${escapeHtml((r.flag || "normal").toUpperCase())}</span></td>
              <td>${escapeHtml(r.stage)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      `
          : ""
      }

      <div class="doctor-sig">
        <div class="doctor-name">${escapeHtml(DOCTOR.name)}</div>
        <div>${escapeHtml(DOCTOR.title)}</div>
        <div class="doctor-license">KMPDC Registration License No: ${escapeHtml(DOCTOR.kmpdc_license)}</div>
      </div>
    </div>
    <div class="footer">
      Comrades Clinic — Telemedicine Service for Kenyan University Students<br>
      This document is confidential and intended solely for the patient.
    </div>
  </div>
</body>
</html>
    `;

    // Send HTTP POST to Brevo API
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          sender: {
            name: "Comrades Clinic",
            email: senderEmail,
          },
          to: [
            {
              email: targetEmail,
              name: patientName,
            },
          ],
          subject: `Comrades Clinic — Visit Report for ${patientName}`,
          htmlContent,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Brevo API error response:", errText);
        return {
          ok: false,
          error: `Brevo API returned status ${response.status}: ${errText}`,
        };
      }

      return {
        ok: true,
        recipient: targetEmail,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Failed to send visit report email via Brevo:", msg);
      return {
        ok: false,
        error: `Email sending failed: ${msg}`,
      };
    }
  });
