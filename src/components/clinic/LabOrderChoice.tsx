import { useState } from "react";
import { Calendar, CheckCircle2, Clock, FlaskConical, MapPin, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClinic } from "@/lib/clinic-store";
import type { ConsultSession, LabCollectionMethod } from "@/lib/clinic-types";
import { FALLBACK_FACILITIES, getGoogleMapsDirectionsUrl } from "@/lib/facilities";

const TIME_SLOTS: readonly string[] = [
  "7:00 AM - 9:00 AM",
  "9:00 AM - 11:00 AM",
  "11:00 AM - 1:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
];

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0] || "";
}

export function LabOrderChoice({ session }: { session: ConsultSession }) {
  const { submitLabOrder, declineLabOrder } = useClinic();
  const [choice, setChoice] = useState<LabCollectionMethod | "decline" | null>(null);
  const [date, setDate] = useState<string>(getTomorrowDate());
  const [timeSlot, setTimeSlot] = useState<string>("9:00 AM - 11:00 AM");
  const [address, setAddress] = useState<string>("");
  const [phone, setPhone] = useState<string>(session.phone);
  const [declineReason, setDeclineReason] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const labPanels =
    session.suggested_labs.length > 0
      ? session.suggested_labs
      : ["Full Blood Count", "Urinalysis", "Malaria Smear"];

  const nearestLabs = FALLBACK_FACILITIES.slice(0, 3);

  const handleDoorstepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    await submitLabOrder(session.id, {
      panels: labPanels,
      collection_method: "doorstep",
      scheduled_date: date,
      scheduled_time: timeSlot,
      collection_address: address,
      collection_phone: phone,
      status: "pending",
    });
    setSubmitted(true);
  };

  const handleVisitLab = async () => {
    await submitLabOrder(session.id, {
      panels: labPanels,
      collection_method: "visit_lab",
      status: "pending",
    });
    setSubmitted(true);
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    await declineLabOrder(session.id, declineReason);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border bg-card p-5 shadow-card text-center space-y-3">
        <span
          className={`mx-auto flex size-12 items-center justify-center rounded-full ${
            choice === "decline" ? "bg-muted text-muted-foreground" : "bg-success/15 text-success"
          }`}
        >
          {choice === "decline" ? (
            <XCircle className="size-6" />
          ) : (
            <CheckCircle2 className="size-6" />
          )}
        </span>
        <h3 className="text-base font-bold">
          {choice === "decline" ? "Lab Test Declined" : "Lab Order Confirmed"}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {choice === "decline"
            ? "The doctor has been notified of your decision. You can discuss it further in the chat."
            : choice === "doorstep"
              ? `A certified phlebotomist will visit you on ${date} between ${timeSlot} at ${address}. Please keep your phone on.`
              : "Your lab referral is active. Present this order at the health center or laboratory."}
        </p>
      </div>
    );
  }

  if (!choice) {
    return (
      <div className="rounded-2xl border bg-card p-5 shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-5 text-warning" />
          <h3 className="text-base font-bold">Lab Test Requested by Doctor</h3>
        </div>

        <div className="rounded-lg bg-warning/10 p-3 text-xs text-warning-foreground">
          <strong>Recommended panels:</strong> {labPanels.join(", ")}
        </div>

        <p className="text-xs text-muted-foreground">
          How would you like to have your sample collected? The choice is yours — you can also
          decline and discuss it with the doctor first.
        </p>

        <div className="grid gap-3">
          {/* Option A: Visit Lab */}
          <button
            type="button"
            onClick={() => setChoice("visit_lab")}
            className="flex items-start gap-3 rounded-xl border border-border p-3.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Option A: Visit a Nearby Lab / Hospital</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get a referral slip and directions to the nearest facility.
              </p>
            </div>
          </button>

          {/* Option B: Doorstep Collection */}
          <button
            type="button"
            onClick={() => setChoice("doorstep")}
            className="flex items-start gap-3 rounded-xl border border-border p-3.5 text-left transition-colors hover:border-success/50 hover:bg-success/5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
              <Calendar className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-success-foreground">
                Option B: Doorstep Sample Collection
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                A certified phlebotomist visits your hostel, campus room, or home.
              </p>
              <p className="mt-1 text-[10px] font-semibold text-success">
                Available daily · 7:00 AM to 6:00 PM
              </p>
            </div>
          </button>

          {/* Option C: Decline */}
          <button
            type="button"
            onClick={() => setChoice("decline")}
            className="flex items-start gap-3 rounded-xl border border-border p-3.5 text-left transition-colors hover:border-destructive/40 hover:bg-destructive/5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <XCircle className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Option C: Decline the Lab Test</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Not ready for a test? Let the doctor know — you can talk it through in the chat.
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (choice === "decline") {
    return (
      <form
        onSubmit={handleDecline}
        className="rounded-2xl border bg-card p-5 shadow-card space-y-4"
      >
        <h3 className="text-base font-bold flex items-center gap-2">
          <XCircle className="size-4 text-destructive" />
          Decline Lab Test
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The doctor recommended: <strong>{labPanels.join(", ")}</strong>. If you decline, the
          doctor will be notified and may follow up in the chat. You can change your mind later.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="decline-reason">Reason (optional)</Label>
          <Textarea
            id="decline-reason"
            rows={3}
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="e.g. I can't afford it right now / I'd like to understand why it's needed first"
            className="text-xs"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => setChoice(null)}
          >
            Back
          </Button>
          <Button type="submit" variant="destructive" className="flex-1 text-xs">
            Decline Lab Test
          </Button>
        </div>
      </form>
    );
  }

  if (choice === "visit_lab") {
    return (
      <div className="rounded-2xl border bg-card p-5 shadow-card space-y-4">
        <h3 className="text-base font-bold flex items-center gap-2">
          <MapPin className="size-4 text-primary" />
          Recommended Facilities for Lab Tests
        </h3>

        <div className="space-y-2">
          {nearestLabs.map((lab, i) => {
            const mapsUrl = getGoogleMapsDirectionsUrl(lab.latitude, lab.longitude);
            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-3 bg-muted/30"
              >
                <div>
                  <p className="text-sm font-semibold">{lab.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {lab.level} · {lab.district}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-primary hover:underline"
                  >
                    Map ↗
                  </a>
                  <Button size="sm" className="h-7 text-[10px]" onClick={handleVisitLab}>
                    Confirm Facility
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setChoice(null)}
          className="w-full text-xs"
        >
          Back to Options
        </Button>
      </div>
    );
  }

  // Doorstep scheduling form
  return (
    <form
      onSubmit={handleDoorstepSubmit}
      className="rounded-2xl border bg-card p-5 shadow-card space-y-4"
    >
      <h3 className="text-base font-bold flex items-center gap-2">
        <Calendar className="size-4 text-success" />
        Schedule Doorstep Phlebotomy
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="lab-date">Date</Label>
          <Input
            id="lab-date"
            type="date"
            value={date}
            min={getTomorrowDate()}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lab-time">Time Slot</Label>
          <select
            id="lab-time"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground"
            required
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lab-address">Hostel / Campus Room / Location Address</Label>
        <Input
          id="lab-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. KU Ruiru Campus, Nyayo Hostel Block 4, Room 12B"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lab-phone">Phone Number</Label>
        <Input
          id="lab-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0712345678"
          required
        />
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Clock className="size-3 text-primary" />
        The phlebotomist calls 15 minutes before arrival for sample collection.
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          className="flex-1 text-xs"
          onClick={() => setChoice(null)}
        >
          Back
        </Button>
        <Button type="submit" className="flex-1 bg-success hover:bg-success/90 text-xs">
          Schedule Sample Collection
        </Button>
      </div>
    </form>
  );
}
