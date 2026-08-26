import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DoctorLogin } from "@/components/clinic/DoctorLogin";
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
import { getCurrentDoctor, type AuthenticatedDoctor } from "@/lib/doctor-auth";
import { createDoctor, listProfiles, updateProfile, type ProfileRow } from "@/lib/admin-users";

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
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
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
    </main>
  );
}

const ROLE_OPTIONS = ["patient", "doctor", "admin"] as const;

function AdminConsole({ authenticatedDoctor }: { authenticatedDoctor: AuthenticatedDoctor }) {
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
      patient: profiles.filter((p) => p.role === "patient").length,
    }),
    [profiles],
  );

  const handleRoleChange = async (id: string, role: string) => {
    const result = await updateProfile({
      data: { id, role: role as "patient" | "doctor" | "admin" },
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
      <header className="sticky top-0 z-30 border-b bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h1 className="text-base font-bold leading-tight">Admin Console</h1>
              <p className="text-xs text-muted-foreground">
                {authenticatedDoctor.name} · manage clinic users &amp; doctors
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

      <div className="mx-auto max-w-5xl space-y-5 p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { label: "Doctors", value: counts.doctor, icon: Stethoscope },
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
                <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
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
      </div>
    </main>
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
      },
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCreated(`${fullName.trim()} (${email.trim()}) can now sign in on the doctor portal.`);
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
          Add a doctor
        </h2>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs font-bold"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-3.5" />
          New doctor account
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
            <DialogTitle>New doctor account</DialogTitle>
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
                placeholder="Share securely with the doctor"
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
                {saving ? "Creating…" : "Create doctor account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
