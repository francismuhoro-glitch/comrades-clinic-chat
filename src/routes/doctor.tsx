import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  CalendarCheck,
  Check,
  Clock,
  CreditCard,
  LogOut,
  Settings,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ChatWindow } from "@/components/clinic/ChatWindow";
import { ClinicalPanel } from "@/components/clinic/ClinicalPanel";
import { DoctorLogin } from "@/components/clinic/DoctorLogin";
import { EmergencyContactsBar } from "@/components/clinic/EmergencyContacts";
import { PatientQueue } from "@/components/clinic/PatientQueue";
import { VideoCall } from "@/components/clinic/VideoCall";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationBell } from "@/components/clinic/NotificationBell";
import {
  appointmentWhen,
  setAppointmentStatus,
  useAppointments,
  type Appointment,
} from "@/lib/appointments";
import { useClinic } from "@/lib/clinic-store";
import { DOCTOR } from "@/lib/clinic-types";
import { getCurrentDoctor, logoutDoctor, type AuthenticatedDoctor } from "@/lib/doctor-auth";
import { useInstallPrompt } from "@/lib/push-client";
import { cn } from "@/lib/utils";

type QueueRange = "today" | "7d" | "30d" | "all";

const QUEUE_RANGES: readonly { value: QueueRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Doctor Portal — COMRACARE Student Clinic" },
      {
        name: "description",
        content:
          "Doctor dashboard for COMRACARE Student Clinic: manage the student queue, chat live, and issue prescriptions, referrals or lab requests.",
      },
      {
        property: "og:title",
        content: "Doctor Portal — COMRACARE Student Clinic",
      },
      {
        property: "og:description",
        content:
          "Manage the student consultation queue, chat in real time, and issue digital prescriptions and referrals.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: () => getCurrentDoctor(),
  component: DoctorPortalRoute,
});

function DoctorPortalRoute() {
  const authenticatedDoctor = Route.useLoaderData();

  if (!authenticatedDoctor) return <DoctorLogin />;

  return <DoctorPortal authenticatedDoctor={authenticatedDoctor} />;
}

function DoctorPortal({ authenticatedDoctor }: { authenticatedDoctor: AuthenticatedDoctor }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const {
    doctorOnline,
    setDoctorOnline,
    settings,
    updateSettings,
    pendingPayments,
    confirmPayment,
    rejectPayment,
    sessions,
    sessionsByStatus,
    getSession,
    messagesFor,
    sendMessage,
    activateSession,
  } = useClinic();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pochiPhone, setPochiPhone] = useState(settings.pochi_phone);
  const [pochiName, setPochiName] = useState(settings.pochi_name);
  const [helpline, setHelpline] = useState(settings.helpline_phone);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [queueRange, setQueueRange] = useState<QueueRange>("today");
  const { canInstall, installed, promptInstall } = useInstallPrompt();

  // Only Admin may confirm/reject M-Pesa payments. Doctors & psychiatrists see a read-only badge.
  const isAdmin = authenticatedDoctor.role === "admin";

  // Scheduled appointment requests (live).
  const { appointments: appointmentList, loading: appointmentsLoading } = useAppointments();
  const pendingBookings = appointmentList.filter((a) => a.status === "pending");

  const selectedSession = getSession(selectedId);

  // Queue date filter — keeps long patient lists manageable.
  const inRange = useCallback(
    (iso: string) => {
      if (queueRange === "all") return true;
      const created = new Date(iso).getTime();
      if (queueRange === "today") {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return created >= startOfToday.getTime();
      }
      const days = queueRange === "7d" ? 7 : 30;
      return Date.now() - created < days * 86_400_000;
    },
    [queueRange],
  );

  // Filter sessions by role: general doctors see general therapy; psychiatrists see therapy only; admins see all
  const filterByRole = useCallback(
    (sessionList: typeof sessions) => {
      const role = authenticatedDoctor.role;
      if (role === "admin") return sessionList;
      if (role === "psychiatrist") {
        return sessionList.filter((s) => s.consultation_type === "therapy");
      }
      // role === "doctor" - see general consultations (including null/legacy consultation_type)
      return sessionList.filter((s) => !s.consultation_type || s.consultation_type === "general");
    },
    [authenticatedDoctor.role],
  );

  // Switching patients always leaves the previous patient's call.
  useEffect(() => {
    setVideoCallOpen(false);
  }, [selectedId]);

  // Ending the consultation always tears down an open video call.
  useEffect(() => {
    if (selectedSession?.status === "completed") {
      setVideoCallOpen(false);
    }
  }, [selectedSession?.status]);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await logoutDoctor();
      await router.invalidate();
    } finally {
      setSigningOut(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    await updateSettings({
      pochi_phone: pochiPhone,
      pochi_name: pochiName,
      helpline_phone: helpline,
    });
    setSavingSettings(false);
    setSettingsOpen(false);
  };

  return (
    <main className="min-h-screen bg-background">
      <EmergencyContactsBar variant="banner" />
      {/* Clinician Portal Header */}
      <header className="sticky top-0 z-30 border-b bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Stethoscope className="size-5" />
            </span>
            <div>
              <h1 className="text-base font-bold leading-tight">
                Comrades Clinic · {authenticatedDoctor.role === "psychiatrist" ? "Psychiatrist Portal" : authenticatedDoctor.role === "admin" ? "Admin Portal" : "Doctor Portal"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {authenticatedDoctor.name} · KMPDC {DOCTOR.kmpdc_license}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canInstall && !installed && (
              <button
                type="button"
                onClick={() => void promptInstall()}
                aria-label="Install the COMRACARE portal app"
                title="Install the COMRACARE portal app"
                className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Smartphone className="size-4" />
              </button>
            )}
            {/* Notification bell — live clinic alerts */}
            <NotificationBell audience="doctor" />

            {/* Admin console (admins only) */}
            {authenticatedDoctor.role === "admin" && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted/50"
              >
                <ShieldCheck className="size-3.5 text-primary" />
                Admin
              </Link>
            )}

            {/* Availability Toggle */}
            <div className="flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs">
              <span
                className={`size-2 rounded-full ${doctorOnline ? "bg-success animate-pulse" : "bg-muted-foreground"}`}
              />
              <span className="font-medium">{doctorOnline ? "Online (Accepting)" : "Offline"}</span>
              <Switch checked={doctorOnline} onCheckedChange={setDoctorOnline} />
            </div>

            {/* Super Doctor Clinic Settings */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Settings className="size-3.5" />
                  Clinic Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSaveSettings}>
                  <DialogHeader>
                    <DialogTitle>Pochi la Biashara & Helpline Settings</DialogTitle>
                    <DialogDescription>
                      Update the Pochi payment number, business name, and helpline displayed to
                      students.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="pochi-phone">Pochi Phone Number</Label>
                      <Input
                        id="pochi-phone"
                        value={pochiPhone}
                        onChange={(e) => setPochiPhone(e.target.value)}
                        placeholder="07XX XXX XXX"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pochi-name">Recipient / Account Name</Label>
                      <Input
                        id="pochi-name"
                        value={pochiName}
                        onChange={(e) => setPochiName(e.target.value)}
                        placeholder="COMRADES CLINIC"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="helpline-phone">Helpline / Support Phone</Label>
                      <Input
                        id="helpline-phone"
                        value={helpline}
                        onChange={(e) => setHelpline(e.target.value)}
                        placeholder="+254 7XX XXX XXX"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={savingSettings}>
                      {savingSettings ? "Saving…" : "Save Clinic Settings"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Sign out */}
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              disabled={signingOut}
              className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-3.5" />
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[340px_1fr]">
        {/* Left Column: Patient Queues & Payment Verifications */}
        <section className="space-y-4">
          {/* Date filter — keeps the queue uncluttered */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-card px-3 py-2 shadow-card">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Show
            </span>
            {QUEUE_RANGES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setQueueRange(value)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
                  queueRange === value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <Tabs defaultValue={pendingPayments.length > 0 ? "payments" : "waiting"}>
            <TabsList className="w-full">
              <TabsTrigger className="flex-1 relative" value="payments">
                <CreditCard className="size-3.5 mr-1" />
                Payments
                {pendingPayments.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-warning px-1.5 py-0.2 text-[10px] font-bold text-warning-foreground">
                    {pendingPayments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="waiting">
                Waiting
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="active">
                Active
              </TabsTrigger>
              <TabsTrigger className="flex-1 relative" value="completed">
                Done
              </TabsTrigger>
              <TabsTrigger className="flex-1 relative" value="bookings">
                <CalendarCheck className="size-3.5 mr-1" />
                Bookings
                {pendingBookings.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-warning px-1.5 py-0.2 text-[10px] font-bold text-warning-foreground">
                    {pendingBookings.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Payments Tab Content */}
            <TabsContent value="payments" className="mt-3 space-y-2.5">
              {pendingPayments.length === 0 ? (
                <p className="rounded-xl border border-dashed bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                  No pending payment verifications.
                </p>
              ) : (
                pendingPayments.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border bg-card p-3.5 shadow-card space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.campus} · {p.phone}
                        </p>
                      </div>
                      <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning-foreground uppercase">
                        KSh {p.fee_kes}
                      </span>
                    </div>

                    <div className="rounded-lg bg-muted/60 p-2.5 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">M-Pesa Ref:</span>
                        <strong className="text-foreground font-mono select-all uppercase">
                          {p.mpesa_code || "Pending Code"}
                        </strong>
                      </div>
                      {p.payment_phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Paid via:</span>
                          <span>{p.payment_phone}</span>
                        </div>
                      )}
                    </div>

                    {isAdmin ? (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1 bg-success hover:bg-success/90 text-success-foreground h-8 text-xs gap-1"
                          onClick={() => confirmPayment(p.id, authenticatedDoctor.role)}
                        >
                          <Check className="size-3.5" />
                          Confirm Payment
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10 h-8 text-xs gap-1"
                          onClick={() => rejectPayment(p.id, authenticatedDoctor.role)}
                        >
                          <X className="size-3.5" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-[10px] font-bold uppercase text-warning-foreground">
                          <Clock className="size-3" />
                          Payment Pending Admin Verification
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            {/* Waiting Queue Tab Content */}
            <TabsContent value="waiting" className="mt-3">
              <PatientQueue
                sessions={filterByRole(sessionsByStatus("waiting")).filter((s) => inRange(s.created_at))}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
                emptyLabel="No comrades waiting in queue right now."
                actionLabel="Start consultation"
              />
            </TabsContent>

            {/* Active Consultations Tab Content */}
            <TabsContent value="active" className="mt-3">
              <PatientQueue
                sessions={filterByRole(sessionsByStatus("active")).filter((s) => inRange(s.created_at))}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
                emptyLabel="No active consultations in progress."
                actionLabel="Open workspace"
              />
            </TabsContent>

            {/* Completed Consultations Tab Content */}
            <TabsContent value="completed" className="mt-3">
              <PatientQueue
                sessions={filterByRole(sessionsByStatus("completed")).filter((s) => inRange(s.created_at))}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
                emptyLabel="No completed records yet."
                actionLabel="View record"
              />
            </TabsContent>

            {/* Scheduled Appointments Tab Content */}
            <TabsContent value="bookings" className="mt-3">
              <BookingsTab
                appointments={appointmentList}
                loading={appointmentsLoading}
                pendingCount={pendingBookings.length}
              />
            </TabsContent>
          </Tabs>
        </section>

        {/* Right Column: Selected Patient Workspace */}
        <section>
          {selectedSession ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex h-[650px] flex-col overflow-hidden rounded-xl border bg-card shadow-card">
                <div className="flex items-center justify-between gap-2 border-b px-3.5 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-xs font-bold">{selectedSession.full_name}</p>
                    {selectedSession.consultation_mode === "video" && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        <Video className="size-2.5" /> wants voice/video
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {selectedSession.status === "waiting" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 border-primary/50 px-3 text-xs font-bold text-primary hover:bg-primary/10"
                        onClick={() => activateSession(selectedSession.id)}
                      >
                        <Stethoscope className="size-3.5" />
                        Start consultation
                      </Button>
                    )}
                    {(selectedSession.status === "active" ||
                      selectedSession.status === "waiting") && (
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 px-3 text-xs font-bold"
                        onClick={() => {
                          if (selectedSession.status === "waiting") {
                            activateSession(selectedSession.id);
                          }
                          setVideoCallOpen(true);
                        }}
                      >
                        <Video className="size-3.5" />
                        {selectedSession.video_room_name
                          ? "Join call"
                          : selectedSession.consultation_mode === "video"
                            ? "Start video call"
                            : "Start call"}
                      </Button>
                    )}
                  </div>
                </div>
                <ChatWindow
                  className="min-h-0 flex-1"
                  messages={messagesFor(selectedSession.id)}
                  viewer="doctor"
                  onSend={(body) => sendMessage(selectedSession.id, "doctor", body)}
                  disabled={selectedSession.status === "completed"}
                />
              </div>
              <div>
                <ClinicalPanel session={selectedSession} />
              </div>
            </div>
          ) : (
            <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-6 text-center text-muted-foreground">
              <Stethoscope className="size-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold text-foreground">No patient selected</p>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Select a waiting comrade from the left panel to begin consultation and review notes.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Voice/video call overlay (auto-closed when the consultation completes) */}
      {videoCallOpen && selectedSession && selectedSession.status !== "completed" && (
        <VideoCall
          consultation={selectedSession}
          viewer="doctor"
          displayName={authenticatedDoctor.name}
          onClose={() => setVideoCallOpen(false)}
        />
      )}
    </main>
  );
}

/** Doctor-side scheduled appointment manager (Bookings tab). */
function BookingsTab({
  appointments,
  loading,
  pendingCount,
}: {
  appointments: Appointment[];
  loading: boolean;
  pendingCount: number;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pending = appointments.filter((a) => a.status === "pending");
  const confirmed = appointments.filter((a) => a.status === "confirmed");
  const settled = appointments.filter((a) => a.status === "completed" || a.status === "declined");

  const act = async (appointment: Appointment, status: "confirmed" | "declined" | "completed") => {
    setBusyId(appointment.id);
    setActionError(null);
    const result = await setAppointmentStatus(appointment, status);
    setBusyId(null);
    if (!result.ok) setActionError(result.error);
  };

  const row = (a: Appointment, actions: React.ReactNode) => (
    <div key={a.id} className="rounded-xl border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold">
            {a.patient_name}
            <span className="ml-1.5 font-medium text-primary">{appointmentWhen(a)}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            {a.campus || "Campus not set"} · {a.patient_phone}
          </p>
          {a.reason && (
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-foreground/80">
              {a.reason}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
      </div>
    </div>
  );

  const btn = (label: string, status: "confirmed" | "declined" | "completed", a: Appointment) => (
    <button
      type="button"
      disabled={busyId === a.id}
      onClick={() => void act(a, status)}
      className={cn(
        "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors disabled:opacity-50",
        status === "declined"
          ? "border border-destructive/40 text-destructive hover:bg-destructive/10"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
      )}
    >
      {busyId === a.id ? "…" : label}
    </button>
  );

  if (loading) {
    return <p className="py-6 text-center text-xs text-muted-foreground">Loading bookings…</p>;
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          {actionError}
        </p>
      )}

      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Requests ({pendingCount})
        </p>
        {pending.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-xs text-muted-foreground">
            No new appointment requests.
          </p>
        ) : (
          pending.map((a) =>
            row(
              a,
              <>
                {btn("Confirm", "confirmed", a)}
                {btn("Decline", "declined", a)}
              </>,
            ),
          )
        )}
      </div>

      {confirmed.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Confirmed upcoming
          </p>
          {confirmed.map((a) =>
            row(
              a,
              <>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Confirmed
                </span>
                {btn("Done", "completed", a)}
              </>,
            ),
          )}
        </div>
      )}

      {settled.length > 0 && (
        <details className="rounded-xl border bg-card p-3">
          <summary className="cursor-pointer text-[11px] font-bold text-muted-foreground">
            Past bookings ({settled.length})
          </summary>
          <div className="mt-2 space-y-2">
            {settled.map((a) =>
              row(
                a,
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {a.status}
                </span>,
              ),
            )}
          </div>
        </details>
      )}
    </div>
  );
}
