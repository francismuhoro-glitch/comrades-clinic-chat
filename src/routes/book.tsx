import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Info,
  Mail,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import { StudentLayout } from "@/components/clinic/StudentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  appointmentWhen,
  bookAppointment,
  generateBookingDays,
  useAppointments,
} from "@/lib/appointments";
import { KENYAN_INSTITUTIONS } from "@/lib/kenya-institutions";
import { usePatientAuth } from "@/lib/patient-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book an appointment — COMRACARE Student Clinic" },
      {
        name: "description",
        content:
          "Schedule a private online consultation with a KMPDC-licensed Kenyan doctor at a time that fits your timetable.",
      },
    ],
  }),
  component: BookAppointmentPage,
});

function BookAppointmentPage() {
  const { appointments } = useAppointments();
  const { patient } = usePatientAuth();

  const [dayIndex, setDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [campus, setCampus] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);

  const takenSlotStarts = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "pending" || a.status === "confirmed")
        .map((a) => a.slot_start),
    [appointments],
  );

  const days = useMemo(() => generateBookingDays(takenSlotStarts), [takenSlotStarts]);
  const day = days[Math.min(dayIndex, days.length - 1)];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !campus || !selectedSlot) {
      setError("Fill in your details, pick a day and a time, then send the request.");
      return;
    }
    if (!/^(?:\+?254|0)7\d{8}$|^(?:\+?254|0)1\d{8}$/.test(phone.replace(/\s/g, ""))) {
      setError("Enter a valid Kenyan phone number, e.g. 0712345678.");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("That email doesn't look right — check it or leave it blank.");
      return;
    }

    setSubmitting(true);
    const result = await bookAppointment({
      patientName: fullName.trim(),
      patientPhone: phone.trim(),
      patientEmail: email.trim() || null,
      campus,
      reason: reason.trim() || null,
      slotStart: selectedSlot.start,
      slotEnd: selectedSlot.end,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBookedSlot(selectedSlot.start);
  };

  if (bookedSlot) {
    return (
      <StudentLayout subtitle="Appointment request sent">
        <div className="space-y-4 rounded-2xl border bg-card p-6 text-center shadow-card">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-success/15 text-success">
            <CheckCircle2 className="size-6" />
          </span>
          <div className="space-y-1">
            <h1 className="text-base font-extrabold">Request sent 🎉</h1>
            <p className="text-sm font-bold text-primary">
              {appointmentWhen({ slot_start: bookedSlot })}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              The doctor will confirm shortly — if you signed in, the confirmation lands in your 🔔
              bell and your email.
            </p>
          </div>
          <div className="rounded-xl bg-primary/5 p-3 text-left">
            <p className="flex items-start gap-1.5 text-[11px] leading-snug text-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Booking reserves your time — the KSh 150 consultation fee is paid through the normal
              flow when your session starts.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <ArrowLeft className="size-3.5" /> Back to clinic
            </Link>
            <button
              type="button"
              onClick={() => {
                setBookedSlot(null);
                setSelectedSlot(null);
              }}
              className="text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Book another slot
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout subtitle="Pick a time that fits your timetable — no queues">
      <form onSubmit={submit} className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-success p-5 text-primary-foreground shadow-card">
          <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/10" />
          <div className="relative space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm">
              <CalendarDays className="size-3.5" /> Scheduled consult
            </span>
            <h1 className="text-xl font-extrabold leading-tight">Book the doctor for later</h1>
            <p className="text-[11px] leading-snug text-primary-foreground/85">
              Private online consult · KSh 150 · all times shown in Nairobi time.
            </p>
          </div>
        </div>

        {/* Step 1 — pick a slot */}
        <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
          <header className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <CalendarDays className="size-4 text-primary" />
            <h2 className="text-sm font-bold">Pick a day &amp; time</h2>
          </header>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {days.map((d, i) => (
              <button
                key={d.key}
                type="button"
                onClick={() => {
                  setDayIndex(i);
                  setSelectedSlot(null);
                }}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-center transition-colors",
                  i === dayIndex
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                <span className="block text-[11px] font-extrabold leading-tight">{d.weekday}</span>
                <span className="block text-[10px] font-medium opacity-80">{d.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {day?.slots.map((slot) => {
              const disabled = slot.taken || slot.past;
              const active = selectedSlot?.start === slot.start;
              return (
                <button
                  key={slot.start}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedSlot({ start: slot.start, end: slot.end })}
                  className={cn(
                    "rounded-xl border px-1 py-2 text-[11px] font-bold transition-colors",
                    disabled
                      ? "cursor-not-allowed border-dashed bg-muted/40 text-muted-foreground/50 line-through"
                      : active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "bg-card text-foreground hover:border-primary/40",
                  )}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Struck-through slots are already requested or confirmed.
          </p>
        </section>

        {/* Step 2 — your details */}
        <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
          <header className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <UserRound className="size-4 text-primary" />
            <h2 className="text-sm font-bold">Your details</h2>
          </header>

          <div className="space-y-1.5">
            <Label htmlFor="book_name">Full name *</Label>
            <Input
              id="book_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Brian Otieno"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="book_phone">Phone (M-Pesa) *</Label>
            <Input
              id="book_phone"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712345678"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="book_email">
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3" /> Email (optional)
              </span>
            </Label>
            <Input
              id="book_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={patient?.email ?? "you@campus.ac.ke"}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="book_campus">Institution *</Label>
            <Select value={campus} onValueChange={setCampus}>
              <SelectTrigger id="book_campus" className="w-full">
                <SelectValue placeholder="Select your institution…" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectGroup>
                  {KENYAN_INSTITUTIONS.map((u) => (
                    <SelectItem key={u.name} value={u.name}>
                      {u.name} ({u.region})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="book_reason">What's it about? (optional)</Label>
            <Textarea
              id="book_reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="A line or two — helps the doctor prepare."
              rows={2}
            />
          </div>
        </section>

        {error && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={submitting || !selectedSlot}
          className="h-13 w-full rounded-xl gap-2 text-sm font-bold"
        >
          <CalendarCheck className="size-4" />
          {submitting ? "Sending request…" : "Request this slot"}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <Clock className="size-3" /> The doctor confirms from the portal — usually within the hour
          during working hours.
        </p>
      </form>
    </StudentLayout>
  );
}
