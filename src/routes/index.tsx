import { createFileRoute } from "@tanstack/react-router";
import { Siren } from "lucide-react";

import { ChatWindow } from "@/components/clinic/ChatWindow";
import {
  DocumentActions,
  PrescriptionTemplate,
  ReferralTemplate,
} from "@/components/clinic/DocumentTemplates";
import { IntakeForm } from "@/components/clinic/IntakeForm";
import { MpesaProcessing } from "@/components/clinic/MpesaProcessing";
import { StatusBadge, StudentLayout } from "@/components/clinic/StudentLayout";
import { useClinic } from "@/lib/clinic-store";
import { EMERGENCY_NOTICE, triage } from "@/lib/triage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lovable Student Clinic — KSh 150 Doctor Chat for Comrades" },
      {
        name: "description",
        content:
          "Pay KSh 150 via M-Pesa and chat with a licensed Kenyan doctor in minutes. Get digital prescriptions, referrals and lab requests on your phone.",
      },
      { property: "og:title", content: "Lovable Student Clinic — Doctor chat for KSh 150" },
      {
        property: "og:description",
        content:
          "Affordable telemedicine for Kenyan university students. M-Pesa consultation, live chat with a doctor, digital prescription.",
      },
    ],
  }),
  component: StudentApp,
});

function StudentApp() {
  const {
    studentSessionId,
    getSession,
    messagesFor,
    createSession,
    simulatePayment,
    sendMessage,
    setStudentSessionId,
  } = useClinic();

  const session = getSession(studentSessionId);

  if (!session) {
    return (
      <StudentLayout>
        <div className="mt-4 flex justify-center">
          <StatusBadge />
        </div>
        <IntakeForm onSubmit={(input) => createSession(input)} />
      </StudentLayout>
    );
  }

  if (session.status === "awaiting_payment") {
    return (
      <StudentLayout subtitle="Confirm your M-Pesa payment" compact>
        <MpesaProcessing
          phone={session.phone}
          onSimulateSuccess={() => simulatePayment(session.id)}
          onCancel={() => setStudentSessionId(null)}
        />
      </StudentLayout>
    );
  }

  if (session.status === "completed") {
    return (
      <StudentLayout subtitle="Consultation complete" compact>
        <div className="mt-4 space-y-4">
          {session.prescription ? (
            <>
              <PrescriptionTemplate session={session} />
              <DocumentActions label="prescription" />
            </>
          ) : null}
          {session.referral ? (
            <>
              <ReferralTemplate session={session} />
              <DocumentActions label="referral letter" />
            </>
          ) : null}
          {session.lab_test_requested ? (
            <p className="rounded-xl border border-dashed bg-card px-4 py-3 text-sm text-muted-foreground">
              You have been flagged for a lab test. Visit your campus clinic lab with your student
              ID.
            </p>
          ) : null}
          <button
            onClick={() => setStudentSessionId(null)}
            className="no-print w-full rounded-xl border px-4 py-3 text-sm font-semibold"
          >
            Start a new consultation
          </button>
        </div>
      </StudentLayout>
    );
  }

  const waiting = session.status === "waiting";
  const assessment = triage(session.symptom_codes);

  return (
    <StudentLayout subtitle={waiting ? "Waiting for the doctor…" : "In consultation"} compact>
      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusBadge />
        <span className="text-xs text-muted-foreground">
          Receipt {session.mpesa_receipt ?? "—"}
        </span>
      </div>
      {session.emergency_flag && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive bg-destructive/10 p-3 text-xs font-medium text-destructive">
          <Siren className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong className="block">Emergency flag</strong>
            {EMERGENCY_NOTICE}
          </span>
        </div>
      )}

      {!session.emergency_flag && session.lab_test_requested && (
        <p className="mt-3 rounded-xl border border-warning bg-warning/12 p-3 text-xs text-warning-foreground">
          Based on your symptoms you have been flagged for a lab test
          {assessment.labPanels.length ? `: ${assessment.labPanels.join("; ")}` : ""}. The doctor
          will confirm during the chat.
        </p>
      )}

      <ChatWindow
        className="mt-3"
        messages={messagesFor(session.id)}
        viewer="student"
        onSend={(body) => sendMessage(session.id, "student", body)}
        emptyHint={
          waiting
            ? "You are in the queue. The doctor will join shortly."
            : "Describe how you are feeling."
        }
      />
    </StudentLayout>
  );
}
