import { FlaskConical, FileText, Pill } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useClinic } from "@/lib/clinic-store";
import { cn } from "@/lib/utils";
import type { ConsultSession } from "@/lib/clinic-types";

export function ClinicalPanel({ session }: { session: ConsultSession }) {
  const {
    setDiagnosisNotes,
    toggleLabTest,
    endWithPrescription,
    endWithReferral,
  } = useClinic();

  const [rx, setRx] = useState({ medication: "", dosage: "", duration: "" });
  const [referral, setReferral] = useState({ destination: "", reason: "" });
  const ended = session.status === "completed";

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-4 shadow-card">
        <Label htmlFor="notes" className="text-sm font-semibold">
          Diagnosis notes
        </Label>
        <Textarea
          id="notes"
          rows={4}
          className="mt-2"
          disabled={ended}
          value={session.diagnosis_notes}
          onChange={(e) => setDiagnosisNotes(session.id, e.target.value)}
          placeholder="Working diagnosis, observations, advice given…"
        />
      </section>

      <section className="rounded-xl border bg-card p-4 shadow-card">
        <button
          type="button"
          disabled={ended}
          onClick={() => toggleLabTest(session.id)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors disabled:opacity-60",
            session.lab_test_requested
              ? "border-warning bg-warning/15"
              : "hover:border-primary/40",
          )}
        >
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              session.lab_test_requested
                ? "bg-warning/25 text-warning-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            <FlaskConical className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Request lab test</span>
            <span className="block text-xs text-muted-foreground">
              {session.lab_test_requested
                ? "Flagged: Needs Sample Collection"
                : "Flag this patient file for sample collection"}
            </span>
          </span>
        </button>
      </section>

      <section className="rounded-xl border bg-card p-4 shadow-card">
        <p className="text-sm font-semibold">Close the consultation</p>
        <Tabs defaultValue="rx" className="mt-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rx">
              <Pill className="size-3.5" /> Prescription
            </TabsTrigger>
            <TabsTrigger value="ref">
              <FileText className="size-3.5" /> Referral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rx" className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="med">Medication name</Label>
              <Input
                id="med"
                disabled={ended}
                value={rx.medication}
                onChange={(e) => setRx({ ...rx, medication: e.target.value })}
                placeholder="e.g. Amoxicillin 500mg"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  disabled={ended}
                  value={rx.dosage}
                  onChange={(e) => setRx({ ...rx, dosage: e.target.value })}
                  placeholder="1 tablet, 3x daily"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  disabled={ended}
                  value={rx.duration}
                  onChange={(e) => setRx({ ...rx, duration: e.target.value })}
                  placeholder="5 days"
                />
              </div>
            </div>
            <Button
              className="w-full"
              disabled={ended || !rx.medication.trim() || !rx.dosage.trim() || !rx.duration.trim()}
              onClick={() => endWithPrescription(session.id, rx)}
            >
              End Session &amp; Send Prescription
            </Button>
          </TabsContent>

          <TabsContent value="ref" className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="dest">Destination hospital</Label>
              <Input
                id="dest"
                disabled={ended}
                value={referral.destination}
                onChange={(e) => setReferral({ ...referral, destination: e.target.value })}
                placeholder="e.g. Kenyatta National Hospital — OPD"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason for referral</Label>
              <Textarea
                id="reason"
                rows={4}
                disabled={ended}
                value={referral.reason}
                onChange={(e) => setReferral({ ...referral, reason: e.target.value })}
                placeholder="Clinical summary and what the receiving facility should assess."
              />
            </div>
            <Button
              className="w-full"
              disabled={ended || !referral.destination.trim() || !referral.reason.trim()}
              onClick={() => endWithReferral(session.id, referral)}
            >
              End Session &amp; Send Referral Letter
            </Button>
          </TabsContent>
        </Tabs>

        {ended && (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            This session is closed and archived under Completed.
          </p>
        )}
      </section>
    </div>
  );
}
