import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Copy,
  Gift,
  Share2,
  Trophy,
  Users,
  Wallet,
  Megaphone,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePatientAuth } from "@/lib/patient-auth";
import {
  ensureMyReferralCode,
  getMyReferralProfile,
  getMyReferrals,
  REFERRAL_DISCOUNT_KES,
  REFERRAL_REWARD_KES,
  type ReferralRow,
  type ReferralProfile,
} from "@/lib/referrals";

export const Route = createFileRoute("/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — COMRACARE Student Clinic" },
      {
        name: "description",
        content:
          "Invite comrades to COMRACARE with your referral code. They get KSh 50 off their first consult, you earn KSh 30 credit when they complete.",
      },
    ],
  }),
  component: ReferralsRoute,
});

function ReferralsRoute() {
  const { patient, loading: authLoading } = usePatientAuth();
  const [profile, setProfile] = useState<ReferralProfile | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [ensuring, setEnsuring] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, rRes] = await Promise.all([getMyReferralProfile(), getMyReferrals()]);
      if (!pRes.ok) {
        setError(pRes.error);
      } else {
        setProfile(pRes.profile);
      }
      if (rRes.ok) {
        setReferrals(rRes.referrals);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load referrals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading]);

  const ensureCode = async () => {
    setEnsuring(true);
    const res = await ensureMyReferralCode();
    setEnsuring(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    void load();
  };

  const referralLink =
    typeof window !== "undefined" && profile?.referral_code
      ? `${window.location.origin}/?ref=${profile.referral_code}`
      : "";

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    if (!profile?.referral_code) return;
    const msg = `Habari! Get affordable doctor care on COMRACARE Student Clinic — KSh 150 chat with a licensed doctor. Use my code ${profile.referral_code} for KSh ${REFERRAL_DISCOUNT_KES} OFF your first consult (pay KSh 100). Link: ${referralLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          <p className="py-10 text-center text-xs text-muted-foreground">Loading referrals…</p>
        </div>
      </main>
    );
  }

  if (!patient) {
    return (
      <main className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-md space-y-4 rounded-2xl border bg-card p-6 text-center shadow-card">
          <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Gift className="size-5" />
          </span>
          <h1 className="text-sm font-bold">Sign in to get your referral code</h1>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Your referral code lives with your account. Sign in via My Visits (email code), then
            return here to invite comrades. They get KSh {REFERRAL_DISCOUNT_KES} off, you earn KSh{" "}
            {REFERRAL_REWARD_KES} credit when they complete their first consult.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to="/visits"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
            >
              Go to My Visits to sign in
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <ArrowLeft className="size-3.5" /> Back home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const total = referrals.length;
  const completed = referrals.filter(
    (r) => r.status === "completed" || r.status === "rewarded",
  ).length;
  const credits = profile?.referral_credits_kes ?? 0;

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Gift className="size-4" />
            </span>
            <div>
              <h1 className="text-sm font-bold leading-tight">Referrals</h1>
              <p className="text-[11px] text-muted-foreground">
                Invite comrades · KSh {REFERRAL_DISCOUNT_KES} off for them, KSh{" "}
                {REFERRAL_REWARD_KES} credit for you
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold hover:bg-muted/50"
          >
            <ArrowLeft className="size-3.5" /> Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-5 p-4">
        {error && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {error}
          </p>
        )}

        {/* Code card */}
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          {profile?.referral_code ? (
            <>
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <Star className="size-4 text-primary" /> Your referral code
              </h2>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  value={profile.referral_code}
                  readOnly
                  className="font-mono text-sm font-bold tracking-widest"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  onClick={() => void copy(profile.referral_code!)}
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>

              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  Shareable link (auto-applies code):
                </p>
                <div className="flex items-center gap-2">
                  <Input value={referralLink} readOnly className="text-[11px]" />
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => void copy(referralLink)}
                  >
                    Copy link
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button size="sm" className="gap-1.5" onClick={shareWhatsApp}>
                  <Share2 className="size-3.5" /> Share on WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => void copy(referralLink)}
                >
                  <Copy className="size-3.5" /> Copy invite
                </Button>
              </div>

              {profile.is_ambassador && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                  <Megaphone className="size-3.5" /> Campus Ambassador — your referrals count double
                  in leaderboards
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="text-sm font-bold">Get your referral code</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Generate a unique code like BRI7X2A. Share it — when a comrade uses it, they get KSh{" "}
                {REFERRAL_DISCOUNT_KES} off (pay KSh 100), you get KSh {REFERRAL_REWARD_KES} credit
                after their first completed consult.
              </p>
              <Button
                size="sm"
                className="mt-3 gap-1.5"
                onClick={() => void ensureCode()}
                disabled={ensuring}
              >
                <Gift className="size-3.5" />
                {ensuring ? "Creating…" : "Create my code"}
              </Button>
            </>
          )}
        </section>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-card p-4 shadow-card">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-4" />
            </span>
            <p className="mt-2 text-xl font-extrabold tabular-nums">{total}</p>
            <p className="text-[11px] text-muted-foreground">Total invited</p>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-card">
            <span className="flex size-8 items-center justify-center rounded-lg bg-success/15 text-success-foreground">
              <Trophy className="size-4" />
            </span>
            <p className="mt-2 text-xl font-extrabold tabular-nums">{completed}</p>
            <p className="text-[11px] text-muted-foreground">Completed</p>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-card">
            <span className="flex size-8 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground">
              <Wallet className="size-4" />
            </span>
            <p className="mt-2 text-xl font-extrabold tabular-nums">KSh {credits}</p>
            <p className="text-[11px] text-muted-foreground">Credits earned</p>
          </div>
        </div>

        {/* How it works */}
        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h3 className="text-xs font-bold">How it works</h3>
          <ol className="mt-3 space-y-2 text-[11px] leading-relaxed">
            <li className="flex gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                1
              </span>
              <span>Share your code or link with comrades on your campus.</span>
            </li>
            <li className="flex gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                2
              </span>
              <span>
                They enter it at intake — KSh {REFERRAL_DISCOUNT_KES} off instantly (KSh 100 vs
                150).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                3
              </span>
              <span>
                When they complete their first consult, you get KSh {REFERRAL_REWARD_KES} credit
                toward your next visit. Campus ambassadors get leaderboard boosts.
              </span>
            </li>
          </ol>
        </section>

        {/* Referrals list */}
        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <h3 className="text-xs font-bold">Your referrals ({total})</h3>
          {total === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed px-4 py-8 text-center text-xs text-muted-foreground">
              No referrals yet — share your code to get started. Your link auto-fills the code at
              intake.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {referrals.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-xl border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">
                      Code {r.code} · KSh {r.discount_kes} off
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-KE")} ·{" "}
                      {r.referred_consultation_id ? "Consult linked" : "No consult yet"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.status === "completed" || r.status === "rewarded"
                        ? "bg-success/15 text-success-foreground"
                        : "bg-warning/15 text-warning-foreground"
                    }`}
                  >
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="text-center">
          <Link
            to="/admin"
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            Are you a campus ambassador? Ask an admin to enable ambassador status in /admin
          </Link>
        </div>
      </div>
    </main>
  );
}
