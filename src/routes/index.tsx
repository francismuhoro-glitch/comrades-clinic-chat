import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, History, RotateCcw } from "lucide-react";
import { useState } from "react";

import { ChatWindow } from "@/components/clinic/ChatWindow";
import {
  DocumentActions,
  PrescriptionTemplate,
  ReferralTemplate,
} from "@/components/clinic/DocumentTemplates";
import { IntakeForm } from "@/components/clinic/IntakeForm";
import { LabOrderChoice } from "@/components/clinic/LabOrderChoice";
import { MpesaProcessing } from "@/components/clinic/MpesaProcessing";
import { StatusBadge, StudentLayout } from "@/components/clinic/StudentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClinic } from "@/lib/clinic-store";
import { EMERGENCY_NOTICE, triage } from "@/lib/triage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Comrades Clinic — KSh 150 Doctor Chat for Students" },
      {
        name: "description",
        content:
          "Affordable telemedicine for Kenyan university students. Pay KSh 150 via Pochi la Biashara, talk to a real doctor, get digital prescriptions, doorstep lab orders, or hospital referrals.",
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
    clearActiveSession,
    resumeSessionByPhone,
    getSession,
    messagesFor,
    createSession,
    simulatePayment,
    sendMessage,
  } = useClinic();

  const [resumePhone, setResumePhone] = useState("");
  const [showResume, setShowResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  const session = getSession(studentSessionId);

  const handleResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResumeError(null);
    setResuming(true);
    const found = await resumeSessionByPhone(resumePhone);
    setResuming(false);
    if (!found) {
      setResumeError("No active consultation found for this phone number. Please submit a new intake.");
    }
  };

  // Case 1: No active session -> Show Intake Form + Resume Option
  if (!session) {
    return (
      <StudentLayout subtitle="Affordable care for comrades across Kenyan campuses">
        {!showResume ? (
          <div className="space-y-4">
            <IntakeForm onSubmit={(input) => createSession(input)} />
            <div className="border-t pt-3 text-center">
              <button
                type="button"
                onClick={() => setShowResume(true)}
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                <History className="size-3.5" />
                Already have an ongoing consultation? Resume here
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleResumeSubmit} className="space-y-4 rounded-2xl border bg-card p-5 shadow-card">
            <div className="space-y-1">
              <h3 className="text-base font-bold">Resume Ongoing Consultation</h3>
              <p className="text-xs text-muted-foreground">
                Enter the phone number you used during intake to restore your active chat.
              </p>
            </div>

            <div className="space-y-1.5">
              <Input
                type="tel"
                placeholder="e.g. 0712345678"
                value={resumePhone}
                onChange={(e) => setResumePhone(e.target.value)}
                required
              />
            </div>

            {resumeError && (
              <p className="text-xs font-medium text-destructive">{resumeError}</p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setShowResume(false)}
              >
                Back to Intake
              </Button>
              <Button type="submit" className="flex-1 text-xs" disabled={resuming}>
                {resuming ? "Finding chat…" : "Restore My Consultation"}
              </Button>
            </div>
          </form>
        )}
      </StudentLayout>
    );
  }

  // Case 2: Awaiting payment verification
  if (session.status === "awaiting_payment" && !session.paid) {
    return (
      <StudentLayout subtitle="Pochi la Biashara Consultation Payment" compact>
        <MpesaProcessing
          phone={session.phone}
          onSimulateSuccess={() => simulatePayment(session.id)}
          onCancel={() => clearActiveSession()}
        />
      </StudentLayout>
    );
  }

  const msgs = messagesFor(session.id);
  const assessment = triage(session.symptom_codes);
  const isCompleted = session.status === "completed";

  // Case 3: In Queue, In Consultation, or Completed
  return (
    <StudentLayout
      subtitle={`${session.campus} · ${session.phone}`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold sm:text-xl">
            {isCompleted ? "Completed Consultation" : "Active Consultation"} · {session.full_name}
          </h2>
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

        {/* Live / Historic Consultation Chat */}
        <div className="h-[460px] overflow-hidden rounded-2xl border bg-card shadow-card">
          <ChatWindow
            messages={msgs}
            viewer="student"
            onSend={(body) => sendMessage(session.id, "student", body)}
            disabled={isCompleted}
            disabledLabel="This consultation has concluded"
          />
        </div>

        {/* Doorstep vs Lab Referral Choice */}
        {session.lab_test_requested && !session.lab_order && !isCompleted && (
          <LabOrderChoice session={session} />
        )}

        {session.lab_order && !isCompleted && (
          <div className="rounded-xl border border-success/30 bg-success/5 p-3.5 text-xs text-success-foreground space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              Lab Order Active: {session.lab_order.panels.join(", ")}
            </p>
            {session.lab_order.collection_method === "doorstep" && (
              <p className="text-muted-foreground">
                Doorstep sample collection on <strong>{session.lab_order.scheduled_date}</strong> ({session.lab_order.scheduled_time}) at {session.lab_order.collection_address}.
              </p>
            )}
          </div>
        )}

        {/* Closed Consultation Artifacts (Prescription OR Referral) */}
        {isCompleted && (
          <div className="space-y-4 pt-2">
            {session.prescription && <PrescriptionTemplate session={session} />}
            {session.referral && <ReferralTemplate session={session} />}
            <DocumentActions label={session.prescription ? "prescription" : "referral"} />

            {/* Exit Gate: Clear completed session & start a fresh one */}
            <div className="rounded-2xl border bg-card p-4 text-center shadow-card space-y-2">
              <p className="text-xs text-muted-foreground">
                Your consultation is completed and your records are archived.
              </p>
              <Button
                className="w-full gap-2 rounded-xl"
                onClick={() => clearActiveSession()}
              >
                <RotateCcw className="size-4" />
                Done · Start New Consultation
              </Button>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}