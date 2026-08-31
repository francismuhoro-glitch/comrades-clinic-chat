import { useRouter } from "@tanstack/react-router";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck, Stethoscope } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmergencyContactsBar } from "@/components/clinic/EmergencyContacts";
import { loginDoctor } from "@/lib/doctor-auth";

export function DoctorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await loginDoctor({ data: { email, password } });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      await router.invalidate();
    } catch {
      setError("We could not sign you in. Check the portal configuration and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <EmergencyContactsBar variant="banner" />
      <div className="relative min-h-[calc(100vh-49px)] overflow-hidden bg-gradient-surface px-4 py-10 sm:py-16">
        <div className="pointer-events-none absolute -left-24 top-12 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-12 size-72 rounded-full bg-success/10 blur-3xl" />

        <div className="relative mx-auto max-w-md space-y-4">
          <div className="mb-6 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-medical text-primary-foreground shadow-float">
              <Stethoscope className="size-7" aria-hidden="true" />
            </span>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Clinician access
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Welcome back, doctor</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Sign in before viewing patient consultations and clinical records.
            </p>
          </div>

          <Card className="border-border/80 shadow-float">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <LockKeyhole className="size-4 text-primary" aria-hidden="true" />
                Doctor portal login
              </CardTitle>
              <CardDescription>Use your clinic-issued account details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doctor-email">Email address</Label>
                  <Input
                    id="doctor-email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    placeholder="doctor@clinic.co.ke"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="doctor-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pr-11"
                      required
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {error ? (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="size-4" aria-hidden="true" />
                  )}
                  {submitting ? "Signing in…" : "Secure sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <EmergencyContactsBar variant="card" />

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
            Protected by an encrypted, HTTP-only session cookie
          </p>
        </div>
      </div>
    </main>
  );
}
