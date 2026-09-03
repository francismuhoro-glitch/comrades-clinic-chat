import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  FlaskConical,
  Ambulance,
  History,
  MessageSquare,
  Stethoscope,
  RotateCcw,
  ShieldCheck,
  UserRound,
  Video,
  Wallet,
  XCircle,
  Brain,
} from "lucide-react";
import { useEffect, useState } from "react";

import { ChatWindow } from "@/components/clinic/ChatWindow";
import {
  DocumentActions,
  PrescriptionTemplate,
  ReferralTemplate,
} from "@/components/clinic/DocumentTemplates";
import { EmergencyContactsBar } from "@/components/clinic/EmergencyContacts";
import { IntakeForm } from "@/components/clinic/IntakeForm";
import { LabOrderChoice } from "@/components/clinic/LabOrderChoice";
import { LabResultsTracker } from "@/components/clinic/LabResultsTracker";
import { MpesaProcessing } from "@/components/clinic/MpesaProcessing";
import { MoodCheckIn } from "@/components/clinic/MoodCheckIn";
import { StatusBadge, StudentLayout } from "@/components/clinic/StudentLayout";
import { VideoCall } from "@/components/clinic/VideoCall";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useClinic } from "@/lib/clinic-store";
import {
  CONSULT_FEE_KES,
  THERAPY_FEE_KES,
  DOCTOR,
  LAB_ORDER_STATUS_LABELS,
  type LabResult,
} from "@/lib/clinic-types";
import { supabase } from "@/lib/supabase";
import { EMERGENCY_NOTICE, triage } from "@/lib/triage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Comrades Clinic — KSh 150 – 250 Doctor Chat for Students" },
      {
        name: "description",
        content:
          "Affordable telemedicine for Kenyan university students. Pay from KSh 150 via Pochi la Biashara, talk to a real doctor or psychiatrist, get digital prescriptions, doorstep lab orders, or hospital referrals.",
      },
    ],
  }),
  component: PatientRouteComponent,
});

function LandingPage({ onAcceptTerms }: { onAcceptTerms: () => void }) {
  const [agreed, setAgreed] = useState(false);

  const trustChips = [
    "KMPDC-licensed doctors & psychiatrists",
    "From KSh 150 — no hidden costs",
    "Encrypted & confidential",
  ];

  const services = [
    {
      icon: MessageSquare,
      title: "Live text chat",
      text: "Encrypted, real-time messaging with the doctor.",
    },
    {
      icon: Video,
      title: "Voice & video calls",
      text: "Audio-first calls when typing isn't enough.",
    },
    {
      icon: FileText,
      title: "Digital prescriptions",
      text: "Signed prescriptions sent straight to your phone.",
    },
    {
      icon: FlaskConical,
      title: "Doorstep lab tests",
      text: "Sample collection at your hostel or a partner lab.",
    },
    {
      icon: Brain,
      title: "Therapy & mental health",
      text: "Confidential sessions with a psychiatrist for KSh 250.",
    },
    {
      icon: Ambulance,
      title: "Hospital referrals",
      text: "Official referral letters when you need a hospital.",
    },
  ];

  const steps = [
    {
      icon: Wallet,
      title: `Pay from KSh ${CONSULT_FEE_KES} via M-Pesa`,
      text: `General consult KSh ${CONSULT_FEE_KES}, therapy KSh ${THERAPY_FEE_KES}. Via Pochi la Biashara.`,
    },
    {
      icon: Stethoscope,
      title: "Talk to a clinician",
      text: "Start in encrypted chat — switch to a voice or video call any time.",
    },
    {
      icon: FileText,
      title: "Get your documents",
      text: "Prescription, lab order or referral letter — signed and delivered digitally.",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-success p-6 text-primary-foreground shadow-card">
        <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 size-40 rounded-full bg-white/10" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {trustChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm"
              >
                {chip}
              </span>
            ))}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
              Talk to a real doctor in minutes — right from your hostel.
            </h1>
            <p className="max-w-md text-xs leading-relaxed text-primary-foreground/85 sm:text-sm">
              COMRACARE connects university students with licensed clinicians: encrypted chat, voice
              &amp; video calls, digital prescriptions, doorstep labs and hospital referrals.
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-primary-foreground/90">
            <ShieldCheck className="size-3.5" />
            Registered clinician · KMPDC {DOCTOR.kmpdc_license}
          </p>
        </div>
      </div>

      <MoodCheckIn />

      <EmergencyContactsBar variant="card" />

      {/* What you get */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold">Everything in one place</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {services.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="space-y-1.5 rounded-2xl border bg-card p-3.5 shadow-card transition-colors hover:border-primary/40"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <p className="text-xs font-bold leading-tight">{title}</p>
              <p className="text-[11px] leading-snug text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-2.5 rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="text-sm font-bold">How it works</h2>
        <ol className="space-y-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="flex items-center gap-1.5 text-xs font-bold">
                  <Icon className="size-3.5 text-primary" />
                  {title}
                </p>
                <p className="text-[11px] leading-snug text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Terms & Privacy Policy Confirmation Gate */}
      <div
        id="start-consult"
        className="space-y-4 rounded-2xl border bg-card p-5 shadow-card scroll-mt-24"
      >
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-secondary/40 p-3.5">
          <Checkbox
            checked={agreed}
            onCheckedChange={(v) => setAgreed(v === true)}
            className="mt-0.5"
          />
          <span className="text-xs leading-relaxed text-foreground">
            I confirm that I have read and agree to the{" "}
            <Link to="/terms" target="_blank" className="font-bold text-primary underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" target="_blank" className="font-bold text-primary underline">
              Privacy Policy
            </Link>
            . I understand this service is for non-emergency student telemedicine.
          </span>
        </label>

        <Button
          onClick={onAcceptTerms}
          disabled={!agreed}
          size="lg"
          className="h-13 w-full rounded-xl gap-2 text-sm font-bold"
        >
          Continue to Consultation Intake
          <ArrowRight className="size-4" />
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          Prefer a set time?{" "}
          <Link to="/book" className="font-bold text-primary hover:underline">
            Book a scheduled appointment →
          </Link>
        </p>
      </div>
    </div>
  );
}

function PatientRouteComponent() {
  const {
    doctorOnline,
    studentSessionId,
    clearActiveSession,
    resumeSessionByPhone,
    getSession,
    messagesFor,
    createSession,
    simulatePayment,
    sendMessage,
    reopenLabChoice,
    labResultsFor,
  } = useClinic();

  const [view, setView] = useState<"landing" | "intake" | "resume">("landing");

  const [resumePhone, setResumePhone] = useState("");
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  const [activeLabResults, setActiveLabResults] = useState<LabResult[]>([]);

  const [videoCallOpen, setVideoCallOpen] = useState(false);

  const session = getSession(studentSessionId);

  // Ending the consultation always tears down an open video call.
  useEffect(() => {
    if (session?.status === "completed") {
      setVideoCallOpen(false);
    }
  }, [session?.status]);

  // Sync lab results for active session
  useEffect(() => {
    if (!session?.id) {
      setActiveLabResults([]);
      return;
    }
    const storeResults = labResultsFor(session.id);
    if (storeResults.length > 0) {
      setActiveLabResults(storeResults);
    } else {
      supabase
        .from("lab_results")
        .select("*")
        .eq("consultation_id", session.id)
        .order("created_at", { ascending: true })
        .then(({ data }) => {
          if (data) setActiveLabResults(data as LabResult[]);
        });
    }
  }, [session?.id, labResultsFor]);

  const handleResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResumeError(null);
    setResuming(true);
    const found = await resumeSessionByPhone(resumePhone);
    setResuming(false);
    if (!found) {
      setResumeError(
        "No active consultation found for this phone number or email. Please submit a new intake.",
      );
    }
  };

  // Case 1: No active session -> Landing Page by default, or Intake Form / Resume by phone
  if (!session) {
    if (view === "resume") {
      return (
        <StudentLayout subtitle="Affordable care for comrades across Kenyan campuses">
          <form
            onSubmit={handleResumeSubmit}
            className="space-y-4 rounded-2xl border bg-card p-5 shadow-card"
          >
            <div className="space-y-1">
              <h3 className="text-base font-bold">Resume Ongoing Consultation</h3>
              <p className="text-xs text-muted-foreground">
                Enter the phone number or email you used during intake to restore your active chat.
              </p>
            </div>

            <div className="space-y-1.5">
              <Input
                type="text"
                placeholder="Phone (e.g. 0712345678) or Email"
                value={resumePhone}
                onChange={(e) => setResumePhone(e.target.value)}
                required
              />
            </div>

            {resumeError && <p className="text-xs font-medium text-destructive">{resumeError}</p>}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setView("intake")}
              >
                Back to Intake
              </Button>
              <Button type="submit" className="flex-1 text-xs" disabled={resuming}>
                {resuming ? "Finding chat…" : "Restore My Consultation"}
              </Button>
            </div>
          </form>
        </StudentLayout>
      );
    }

    if (view === "intake") {
      return (
        <StudentLayout subtitle="Affordable care for comrades across Kenyan campuses">
          <div className="space-y-4">
            <IntakeForm onSubmit={(input) => createSession(input)} />
            <div className="border-t pt-3 text-center space-y-2">
              <button
                type="button"
                onClick={() => setView("resume")}
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                <History className="size-3.5" />
                Already have an ongoing consultation? Resume here
              </button>
              <div>
                <Link
                  to="/visits"
                  className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  <UserRound className="size-3.5" />
                  Sign in to view your past visits
                </Link>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setView("landing")}
                  className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  <RotateCcw className="size-3.5" />
                  Back to home
                </button>
              </div>
            </div>
          </div>
        </StudentLayout>
      );
    }

    return (
      <StudentLayout subtitle="Affordable care for comrades across Kenyan campuses">
        <LandingPage onAcceptTerms={() => setView("intake")} />
        <div className="mt-4 border-t pt-3 text-center space-y-2">
          <button
            type="button"
            onClick={() => setView("resume")}
            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            <History className="size-3.5" />
            Already have an ongoing consultation? Resume here
          </button>
          <div>
            <Link
              to="/visits"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              <UserRound className="size-3.5" />
              Sign in to view your past visits
            </Link>
          </div>
        </div>
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
    <StudentLayout subtitle={`${session.campus} · ${session.phone}`}>
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
            {session.consultation_mode === "video" && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                <Video className="size-3" />
                You requested a voice/video call — the doctor will call you once accepted
              </p>
            )}
          </div>
        )}

        {/* On-request voice/video call (active consultations only) */}
        {session.status === "active" && (
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4 shadow-card",
              session.consultation_mode === "video" ? "border-primary/40 bg-primary/5" : "bg-card",
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Video className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Voice / video call</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {session.video_room_name
                  ? "Call in progress — tap join to enter the room."
                  : session.consultation_mode === "video"
                    ? "You registered for a call. Start whenever you're ready — audio first."
                    : "Optional: talk to the doctor by voice, add video if needed."}
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0 gap-1.5 text-xs font-bold"
              onClick={() => setVideoCallOpen(true)}
            >
              <Video className="size-3.5" />
              {session.video_room_name ? "Join call" : "Start call"}
            </Button>
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

        {session.lab_order && session.lab_order.status === "declined" && !isCompleted && (
          <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs space-y-2">
            <p className="font-semibold flex items-center gap-1.5 text-muted-foreground">
              <XCircle className="size-3.5" />
              You declined the lab test
              {session.lab_order.decline_reason ? `: "${session.lab_order.decline_reason}"` : "."}
            </p>
            <p className="text-muted-foreground">
              The doctor has been notified. If you change your mind, you can choose a collection
              option again.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              onClick={() => reopenLabChoice(session.id)}
            >
              I've changed my mind — show options again
            </Button>
          </div>
        )}

        {session.lab_order && session.lab_order.status !== "declined" && !isCompleted && (
          <div className="rounded-xl border border-success/30 bg-success/5 p-3.5 text-xs text-success-foreground space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              Lab Order Active: {session.lab_order.panels.join(", ")}
            </p>
            {session.lab_order.collection_method === "doorstep" && (
              <p className="text-muted-foreground">
                Doorstep sample collection on <strong>{session.lab_order.scheduled_date}</strong> (
                {session.lab_order.scheduled_time}) at {session.lab_order.collection_address}.
              </p>
            )}
            <p className="text-muted-foreground">
              Status: <strong>{LAB_ORDER_STATUS_LABELS[session.lab_order.status]}</strong>
            </p>
          </div>
        )}

        {/* Live Lab Results Tracker (if any results present) */}
        {activeLabResults.length > 0 && <LabResultsTracker results={activeLabResults} />}

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
              <Button className="w-full gap-2 rounded-xl" onClick={() => clearActiveSession()}>
                <RotateCcw className="size-4" />
                Done · Start New Consultation
              </Button>
              <Link
                to="/visits"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <UserRound className="size-3.5" />
                View all your past visits
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Voice/video call overlay (auto-closed once the consultation completes) */}
      {!isCompleted && videoCallOpen && (
        <VideoCall
          consultation={session}
          viewer="patient"
          displayName={session.full_name}
          onClose={() => setVideoCallOpen(false)}
        />
      )}
    </StudentLayout>
  );
}
