import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Clock3,
  CreditCard,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  Video,
  MessageCircle,
  Brain,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DoctorLogin } from "@/components/clinic/DoctorLogin";
import { EmergencyContactsBar } from "@/components/clinic/EmergencyContacts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentDoctor, type AuthenticatedDoctor } from "@/lib/doctor-auth";
import { createDoctor, listProfiles, updateProfile, type ProfileRow } from "@/lib/admin-users";
import {
  ANALYTICS_RANGES,
  computeAnalytics,
  fetchConsultationsForAnalytics,
  type AnalyticsRange,
  type AnalyticsSummary,
  type ConsultationAnalyticsRow,
} from "@/lib/analytics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — COMRACARE Student Clinic" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: () => getCurrentDoctor(),
  component: AdminRouteComponent,
});

function AdminRouteComponent() {
  const authenticatedDoctor = Route.useLoaderData();

  if (!authenticatedDoctor) return <DoctorLogin />;
  if (authenticatedDoctor.role !== "admin") return <AdminAccessDenied />;
  return <AdminConsole authenticatedDoctor={authenticatedDoctor} />;
}

function AdminAccessDenied() {
  return (
    <main className="min-h-screen bg-background">
      <EmergencyContactsBar variant="banner" />
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="max-w-sm space-y-3 rounded-2xl border bg-card p-6 text-center shadow-card">
          <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-warning/15 text-warning-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <h1 className="text-sm font-bold">Admin access required</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This console is restricted to clinic administrators. Ask an existing admin to set your
            profile role to <strong>admin</strong>, then sign in again.
          </p>
          <Link
            to="/doctor"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" /> Back to doctor portal
          </Link>
        </div>
      </div>
    </main>
  );
}

const ROLE_OPTIONS = ["patient", "doctor", "admin", "psychiatrist"] as const;

function AdminConsole({ authenticatedDoctor }: { authenticatedDoctor: AuthenticatedDoctor }) {
  const [activeTab, setActiveTab] = useState<"analytics" | "users">("analytics");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const refresh = async () => {
    setLoading(true);
    setLoadError(null);
    const result = await listProfiles();
    if (result.ok) {
      setProfiles(result.profiles);
    } else {
      setLoadError(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        (p.full_name ?? "").toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q),
    );
  }, [profiles, search]);

  const counts = useMemo(
    () => ({
      admin: profiles.filter((p) => p.role === "admin").length,
      doctor: profiles.filter((p) => p.role === "doctor").length,
      psychiatrist: profiles.filter((p) => p.role === "psychiatrist").length,
      patient: profiles.filter((p) => p.role === "patient").length,
    }),
    [profiles],
  );

  const handleRoleChange = async (id: string, role: string) => {
    const result = await updateProfile({
      data: { id, role: role as "patient" | "doctor" | "admin" | "psychiatrist" },
    });
    if (!result.ok) {
      setLoadError(result.error);
      return;
    }
    setProfiles((rows) => rows.map((p) => (p.id === id ? { ...p, role } : p)));
  };

  const handleDetailsSave = async (id: string, full_name: string, kmpdc_license: string) => {
    const result = await updateProfile({
      data: { id, full_name, kmpdc_license: kmpdc_license.trim() || undefined },
    });
    if (!result.ok) {
      setLoadError(result.error);
      return false;
    }
    setProfiles((rows) =>
      rows.map((p) =>
        p.id === id ? { ...p, full_name, kmpdc_license: kmpdc_license.trim() || null } : p,
      ),
    );
    return true;
  };

  return (
    <main className="min-h-screen bg-background">
      <EmergencyContactsBar variant="banner" />
      <header className="sticky top-0 z-30 border-b bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h1 className="text-base font-bold leading-tight">Admin Console</h1>
              <p className="text-xs text-muted-foreground">
                {authenticatedDoctor.name} · clinic ops & analytics
              </p>
            </div>
          </div>
          <Link
            to="/doctor"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted/50"
          >
            <ArrowLeft className="size-3.5" />
            Doctor portal
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-5 p-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "analytics" | "users")}
          className="w-full"
        >
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="size-3.5" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="size-3.5" /> Users ({profiles.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-4 space-y-5">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="users" className="mt-4 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              {(
                [
                  { label: "Doctors", value: counts.doctor, icon: Stethoscope },
                  { label: "Psychiatrists", value: counts.psychiatrist, icon: Brain },
                  { label: "Patients", value: counts.patient, icon: UserRound },
                  { label: "Admins", value: counts.admin, icon: ShieldCheck },
                ] as const
              ).map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border bg-card p-4 shadow-card">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <p className="mt-2 text-xl font-extrabold tabular-nums">{value}</p>
                  <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            <AddDoctorCard onCreated={() => void refresh()} />

            {/* Users list */}
            <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <Users className="size-4 text-primary" />
                  Clinic users ({profiles.length})
                </h2>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or email…"
                    className="h-9 w-56 pl-9 text-xs"
                  />
                </div>
              </div>

              {loadError && (
                <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {loadError}
                </p>
              )}

              {loading ? (
                <p className="py-6 text-center text-xs text-muted-foreground">Loading users…</p>
              ) : filtered.length === 0 ? (
                <p className="rounded-xl border border-dashed px-4 py-8 text-center text-xs text-muted-foreground">
                  No users match your search.
                </p>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {(p.full_name || p.email || "?").slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold">
                          {p.full_name || "Unnamed user"}
                          {p.id === authenticatedDoctor.id && (
                            <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                              you
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {p.email || "no email"}
                          {p.kmpdc_license ? ` · KMPDC ${p.kmpdc_license}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Select
                          value={p.role ?? "patient"}
                          onValueChange={(role) => void handleRoleChange(p.id, role)}
                        >
                          <SelectTrigger className="h-8 w-[110px] text-xs">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role} value={role} className="capitalize">
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <ProfileEditDialog profile={p} onSave={handleDetailsSave} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Analytics Dashboard
// ---------------------------------------------------------------------------

function AnalyticsDashboard() {
  const [rows, setRows] = useState<ConsultationAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<AnalyticsRange>("30d");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const result = await fetchConsultationsForAnalytics();
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setRows(result.rows);
    setLoading(false);
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const summary: AnalyticsSummary | null = useMemo(() => {
    if (rows.length === 0) return null;
    return computeAnalytics(rows, range);
  }, [rows, range]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <p className="py-8 text-center text-xs text-muted-foreground">Loading clinic analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-card space-y-3">
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          {error}
        </p>
        <Button size="sm" variant="outline" onClick={() => void fetchData()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!summary || rows.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-8 shadow-card text-center">
        <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BarChart3 className="size-5" />
        </span>
        <h3 className="mt-3 text-sm font-bold">No consultations yet</h3>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Analytics will appear once students start booking. Revenue is KSh 150 × confirmed M-Pesa
          payments. Demo patients were removed so numbers are real.
        </p>
      </div>
    );
  }

  const maxDaily = Math.max(1, ...summary.daily.map((d) => d.count));
  const maxRevenue = Math.max(1, ...summary.daily.map((d) => d.revenue));
  const maxSymptom = Math.max(1, ...summary.topSymptoms.map((s) => s.count));

  return (
    <div className="space-y-5">
      {/* Range filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Range
        </span>
        {ANALYTICS_RANGES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setRange(value)}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-bold transition-colors",
              range === value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-muted-foreground">
          {summary.totalConsults} consults · KSh {summary.totalRevenue.toLocaleString()} revenue
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          icon={BarChart3}
          label="Consults"
          value={summary.totalConsults.toString()}
          sub={`${summary.daily.reduce((a, b) => a + b.count, 0)} in chart`}
        />
        <KpiCard
          icon={CreditCard}
          label="Revenue"
          value={`KSh ${summary.totalRevenue.toLocaleString()}`}
          sub="All confirmed payments"
        />
        <KpiCard
          icon={Stethoscope}
          label="General Revenue"
          value={`KSh ${summary.totalGeneralRevenue.toLocaleString()}`}
          sub="KSh 150 per consult"
        />
        <KpiCard
          icon={Brain}
          label="Therapy Revenue"
          value={`KSh ${summary.totalTherapyRevenue.toLocaleString()}`}
          sub="KSh 250 per session"
        />
        <KpiCard
          icon={Clock3}
          label="Avg response"
          value={summary.avgResponseMinutes !== null ? `${summary.avgResponseMinutes}m` : "—"}
          sub={
            summary.avgResponseMinutes !== null
              ? "created → doctor started"
              : "needs activated_at migration"
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Daily consults chart */}
        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h3 className="text-xs font-bold">Consults per day (EAT)</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {range === "today" ? "Today only" : `Last ${summary.daily.length} days`} · demo data
            removed
          </p>
          <div className="mt-4 space-y-2">
            {summary.daily.map((d) => (
              <div key={d.date} className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[11px] font-medium text-muted-foreground">
                  {d.label}
                </span>
                <div className="flex h-6 flex-1 items-center overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max(4, (d.count / maxDaily) * 100)}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-[11px] font-bold tabular-nums">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Revenue per day */}
        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h3 className="text-xs font-bold">Revenue per day</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">KSh 150 × confirmed payments</p>
          <div className="mt-4 space-y-2">
            {summary.daily.map((d) => (
              <div key={d.date} className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[11px] font-medium text-muted-foreground">
                  {d.label}
                </span>
                <div className="flex h-6 flex-1 items-center overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{ width: `${Math.max(4, (d.revenue / maxRevenue) * 100)}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-[11px] font-bold tabular-nums">
                  {d.revenue > 0 ? `KSh ${d.revenue}` : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Top symptoms */}
        <section className="rounded-2xl border bg-card p-4 shadow-card lg:col-span-2">
          <h3 className="text-xs font-bold">Top symptoms</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            From symptom_codes selected at intake
          </p>
          {summary.topSymptoms.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              No symptom data yet.
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {summary.topSymptoms.map((s) => (
                <div key={s.code} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 truncate text-[11px] font-bold">{s.label}</span>
                  <div className="flex h-5 flex-1 items-center overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all"
                      style={{ width: `${Math.max(6, (s.count / maxSymptom) * 100)}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-[11px] font-bold tabular-nums">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Triage mix + mode + status */}
        <div className="space-y-5">
          <section className="rounded-2xl border bg-card p-4 shadow-card">
            <h3 className="text-xs font-bold">Triage mix</h3>
            <div className="mt-3 space-y-2">
              {(
                [
                  { key: "routine", label: "Routine", color: "bg-success" },
                  { key: "urgent", label: "Urgent", color: "bg-warning" },
                  { key: "emergency", label: "Emergency", color: "bg-destructive" },
                ] as const
              ).map(({ key, label, color }) => {
                const count = summary.triageMix[key];
                const pct =
                  summary.totalConsults > 0 ? Math.round((count / summary.totalConsults) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className={cn("size-2.5 rounded-full", color)} />
                    <span className="w-16 text-[11px] font-medium">{label}</span>
                    <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted/60">
                      <div className={cn("h-full", color)} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right text-[11px] font-bold tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-4 shadow-card">
            <h3 className="text-xs font-bold">Consultation mode</h3>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-3.5 text-muted-foreground" />
                <span className="w-12 text-[11px]">Chat</span>
                <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${summary.totalConsults ? (summary.modeMix.chat / summary.totalConsults) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-6 text-right text-[11px] font-bold">{summary.modeMix.chat}</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="size-3.5 text-muted-foreground" />
                <span className="w-12 text-[11px]">Video</span>
                <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full bg-primary/60"
                    style={{
                      width: `${summary.totalConsults ? (summary.modeMix.video / summary.totalConsults) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-6 text-right text-[11px] font-bold">
                  {summary.modeMix.video}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-4 shadow-card">
            <h3 className="text-xs font-bold">Completion & timing</h3>
            <div className="mt-3 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg consult duration</span>
                <span className="font-bold">
                  {summary.avgConsultMinutes !== null ? `${summary.avgConsultMinutes}m` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg response time</span>
                <span className="font-bold">
                  {summary.avgResponseMinutes !== null ? `${summary.avgResponseMinutes}m` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion rate</span>
                <span className="font-bold">{summary.completionRate}%</span>
              </div>
              <div className="mt-2 rounded-lg bg-muted/50 p-2 text-[11px] leading-relaxed text-muted-foreground">
                Response = created → doctor started (activated_at). If you see "—", run the
                migration <code className="font-mono">20260828100000</code> in Supabase SQL editor,
                then new consults will track it.
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h3 className="text-xs font-bold">Top campuses</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Where comrades are booking from
          </p>
          <div className="mt-3 space-y-2">
            {summary.campusTop.length === 0 ? (
              <p className="text-xs text-muted-foreground">No campus data.</p>
            ) : (
              summary.campusTop.map((c) => (
                <div key={c.campus} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate font-medium">{c.campus}</span>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {c.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h3 className="text-xs font-bold">Status breakdown</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(summary.statusBreakdown).map(([status, count]) => (
              <span
                key={status}
                className="rounded-full border bg-muted/50 px-2.5 py-1 text-[11px] font-medium"
              >
                {status}: <strong className="font-bold">{count}</strong>
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-extrabold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{sub}</p>
    </div>
  );
}

function ProfileEditDialog({
  profile,
  onSave,
}: {
  profile: ProfileRow;
  onSave: (id: string, full_name: string, kmpdc_license: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.full_name ?? "");
  const [license, setLicense] = useState(profile.kmpdc_license ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const ok = await onSave(profile.id, name.trim(), license.trim());
    setSaving(false);
    if (ok) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="icon" className="size-8" onClick={() => setOpen(true)}>
        <Pencil className="size-3.5" />
      </Button>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Edit user details</DialogTitle>
          <DialogDescription>{profile.email || profile.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Full name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-license">KMPDC license (clinicians)</Label>
            <Input
              id="edit-license"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              placeholder="e.g. A.84920"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddDoctorCard({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [license, setLicense] = useState("");
  const [role, setRole] = useState<"doctor" | "psychiatrist">("doctor");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await createDoctor({
      data: {
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        kmpdc_license: license.trim() || undefined,
        role,
      },
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const roleLabel = role === "psychiatrist" ? "psychiatrist" : "doctor";
    setCreated(`${fullName.trim()} (${email.trim()}) can now sign in on the ${roleLabel} portal.`);
    setFullName("");
    setEmail("");
    setPassword("");
    setLicense("");
    onCreated();
  };

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Plus className="size-4 text-primary" />
          Add a clinician
        </h2>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs font-bold"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-3.5" />
          New clinician account
        </Button>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Creates an email + password account the doctor signs in with on the doctor portal. Requires
        the server to have <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> set.
        Alternatively: ask the doctor to sign up once via <strong>My Visits</strong> (email code),
        then switch their role to <strong>doctor</strong> in the list below.
      </p>

      {created && (
        <p className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-xs font-medium text-success-foreground">
          <Check className="size-3.5" /> {created}
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>New clinician account</DialogTitle>
            <DialogDescription>
              They will sign in on /doctor with this email and password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="doc-name">Full name</Label>
              <Input
                id="doc-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Mercy Kamau"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "doctor" | "psychiatrist")}>
                <SelectTrigger id="doc-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor (General Consultation)</SelectItem>
                  <SelectItem value="psychiatrist">Psychiatrist (Therapy Sessions)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-email">Email</Label>
              <Input
                id="doc-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@clinic.ac.ke"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-password">Password (min 8 characters)</Label>
              <Input
                id="doc-password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Share securely with the clinician"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-license">KMPDC license (optional)</Label>
              <Input
                id="doc-license"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="e.g. A.84920"
              />
            </div>
            {error && (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create clinician account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
