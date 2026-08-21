import { createFileRoute } from "@tanstack/react-router";

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
          "Affordable telemedicine for Kenyan university students. Pay KSh 150 via M-Pesa, talk to a real doctor, get digital prescriptions, lab orders, or referral letters.",
      },
      {
        property: "og:title",
        content: "Lovable Student Clinic — KSh 150 Doctor Chat for Comrades",
      },
      {
        property: "og:description",
        content:
          "Kenyan comrades clinic: fast intake, transparent triage, M-Pesa payment, and live doctor chat.",
      },
    ],
  }),
  component: PatientRouteComponent,
});

function PatientRouteComponent() {
  const {
    doctorOnline,
    studentSessionId,
    setStudentSessionId,
    getSession,
    messagesFor,
    createSession,
    simulatePayment,
    sendMessage,
  } = useClinic();

  const session = getSession(studentSessionId);

  if (!session) {
    return (
      <StudentLayout subtitle="Affordable care for comrades across Kenyan campuses">
        <IntakeForm onSubmit={(input) => createSession(input)} />
      </StudentLayout>
    );
  }

  if (session.status === "awaiting_payment" && !session.paid) {
    return (
      <StudentLayout subtitle="Pochi la Biashara Consultation Payment" compact>
        <MpesaProcessing
          phone={session.phone}
          onSimulateSuccess={() => simulatePayment(session.id)}
          onCancel={() => setStudentSessionId(null)}
        />
      </StudentLayout>
    );
  }

  const msgs = messagesFor(session.id);
  const assessment = triage(session.symptom_codes);

  return (
    <StudentLayout subtitle={`${session.campus} · ${session.phone}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold sm:text-xl">Consultation · {session.full_name}</h2>
          <StatusBadge status={session.status} paid={session.paid} />
        </div>

        {assessment.emergency && (
          <div className="rounded-xl border border-destructive bg-destructive/10 p-3.5 text-xs text-destructive">
            <strong className="block font-semibold">Emergency Guidance</strong>
            {EMERGENCY_NOTICE}
          </div>
        )}

        {session.status === "waiting" && (
          <div className="rounded-xl border bg-card p-4 text-center shadow-card">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="size-2 rounded-full bg-primary animate-ping" />
            </div>
            <h3 className="mt-2 font-semibold text-sm">You are in the queue</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {doctorOnline
                ? "The doctor will accept your consultation shortly. Please keep this screen open."
                : "The doctor is currently offline. You will be attended as soon as clinic hours resume."}
            </p>
          </div>
        )}

        <div className="h-[480px] overflow-hidden rounded-2xl border bg-card shadow-card">
          <ChatWindow
            messages={msgs}
            viewer="student"
            onSend={(body) => sendMessage(session.id, "student", body)}
            disabled={session.status === "completed"}
          />
        </div>

        {session.status === "completed" && (
          <div className="space-y-4 pt-2">
            {session.prescription && <PrescriptionTemplate session={session} />}
            {session.referral && <ReferralTemplate session={session} />}
            <DocumentActions label={session.prescription ? "prescription" : "referral"} />
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
