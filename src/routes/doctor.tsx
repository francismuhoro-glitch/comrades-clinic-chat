import { createFileRoute, useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { ChatWindow } from "@/components/clinic/ChatWindow";
import { ClinicalPanel } from "@/components/clinic/ClinicalPanel";
import { DoctorLogin } from "@/components/clinic/DoctorLogin";
import { PatientQueue } from "@/components/clinic/PatientQueue";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClinic } from "@/lib/clinic-store";
import { getCurrentDoctor, logoutDoctor, type AuthenticatedDoctor } from "@/lib/doctor-auth";
import { DOCTOR } from "@/lib/clinic-types";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Doctor Portal — Lovable Student Clinic" },
      {
        name: "description",
        content:
          "Doctor dashboard for Lovable Student Clinic: manage the student queue, chat live, and issue prescriptions, referrals or lab requests.",
      },
      { property: "og:title", content: "Doctor Portal — Lovable Student Clinic" },
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
    sessionsByStatus,
    getSession,
    messagesFor,
    activateSession,
    sendMessage,
  } = useClinic();

  const [selectedId, setSelectedId] = useState<string | null>("seed-2");
  const selected = getSession(selectedId);

  const select = (id: string) => {
    setSelectedId(id);
    activateSession(id);
  };

  const signOut = async () => {
    setSigningOut(true);

    try {
      await logoutDoctor();
      await router.invalidate();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print bg-gradient-medical px-4 py-4 text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold leading-tight">{DOCTOR.name}</h1>
            <p className="text-xs opacity-90">
              {DOCTOR.title} · {DOCTOR.kmpdc_license}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="hidden text-right text-[11px] opacity-80 sm:block">
              Signed in as
              <strong className="ml-1 font-semibold text-primary-foreground">
                {authenticatedDoctor.email}
              </strong>
            </span>
            <label className="flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold">
              <Switch checked={doctorOnline} onCheckedChange={setDoctorOnline} />
              {doctorOnline ? "Available" : "Unavailable"}
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={signOut}
              disabled={signingOut}
              className="rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-5 lg:grid-cols-[320px_1fr]">
        <section className="no-print">
          <Tabs defaultValue="waiting">
            <TabsList className="w-full">
              <TabsTrigger className="flex-1" value="waiting">
                Waiting
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="active">
                Active
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="completed">
                Done
              </TabsTrigger>
            </TabsList>
            <TabsContent value="waiting" className="mt-3">
              <PatientQueue
                sessions={sessionsByStatus("waiting")}
                selectedId={selectedId}
                onSelect={select}
                emptyLabel="No comrades waiting right now."
                actionLabel="Start consultation"
              />
            </TabsContent>
            <TabsContent value="active" className="mt-3">
              <PatientQueue
                sessions={sessionsByStatus("active")}
                selectedId={selectedId}
                onSelect={setSelectedId}
                emptyLabel="No active consultations."
                actionLabel="Open chat"
              />
            </TabsContent>
            <TabsContent value="completed" className="mt-3">
              <PatientQueue
                sessions={sessionsByStatus("completed")}
                selectedId={selectedId}
                onSelect={setSelectedId}
                emptyLabel="No completed files yet."
                actionLabel="View file"
              />
            </TabsContent>
          </Tabs>
        </section>

        {selected ? (
          <section className="grid gap-4 xl:grid-cols-2">
            <ChatWindow
              messages={messagesFor(selected.id)}
              viewer="doctor"
              onSend={(body) => sendMessage(selected.id, "doctor", body)}
              disabled={selected.status === "completed"}
              emptyHint={`Greet ${selected.full_name.split(" ")[0]} and ask about their symptoms.`}
            />
            <ClinicalPanel session={selected} />
          </section>
        ) : (
          <section className="flex items-center justify-center rounded-xl border border-dashed bg-card p-10 text-sm text-muted-foreground">
            Select a patient from the queue to begin.
          </section>
        )}
      </div>
    </div>
  );
}
