import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Gift } from "lucide-react";
import { EmergencyContactsBar } from "@/components/clinic/EmergencyContacts";

export const Route = createFileRoute("/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — COMRACARE Student Clinic" },
      {
        name: "description",
        content: "Referral program — coming soon.",
      },
    ],
  }),
  component: ReferralsRoute,
});

function ReferralsRoute() {
  return (
    <main className="min-h-screen bg-background">
      <EmergencyContactsBar variant="banner" />
      <div className="p-4">
        <div className="mx-auto max-w-md space-y-4">
          <EmergencyContactsBar variant="card" />
          <div className="space-y-4 rounded-2xl border bg-card p-6 text-center shadow-card">
            <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Gift className="size-5" />
            </span>
            <h1 className="text-sm font-bold">Referral program — coming soon</h1>
            <p className="text-xs leading-relaxed text-muted-foreground">
              We&apos;re building invite codes, KSh 50 off for friends, KSh 30 credit for you, and
              campus ambassador leaderboards. The database is ready — UI will be activated later.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back home
              </Link>
              <Link
                to="/visits"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                Go to My Visits
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
