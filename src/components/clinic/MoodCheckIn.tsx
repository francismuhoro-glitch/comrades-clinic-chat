import { Brain, HeartHandshake, LifeBuoy, Lock, Phone, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { primeIntakeSymptoms } from "@/lib/wellness";
import { cn } from "@/lib/utils";

/**
 * Discreet, clinically-grounded mood check-in for the landing page.
 *
 * Four questions from validated ultra-short screens (PHQ-2 for depression,
 * GAD-2 for anxiety). Everything stays on the device — nothing is stored or
 * sent unless the student chooses to start a consultation. It is a self-check,
 * not a diagnosis.
 */

const QUESTION_SCALE = [
  { label: "Not at all", score: 0 },
  { label: "Several days", score: 1 },
  { label: "More than half the days", score: 2 },
  { label: "Nearly every day", score: 3 },
] as const;

const QUESTIONS = [
  "Little interest or pleasure in things you usually enjoy",
  "Feeling down, depressed, or hopeless",
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
] as const;

function primeMentalIntake() {
  primeIntakeSymptoms(["mental"]);
  document.getElementById("start-consult")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function MoodCheckIn() {
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null, null]);
  const answered = answers.filter((a): a is number => a !== null);
  const complete = answered.length === QUESTIONS.length;
  const score = answered.reduce((sum, a) => sum + a, 0);

  const band =
    score >= 7
      ? {
          emoji: "💙",
          title: "Please don't carry this alone.",
          body: "That score suggests things have been genuinely heavy lately. Talking to a doctor can help — privately, from your room, for KSh 150. And if it ever feels like too much, the lines below are free and answer 24/7.",
        }
      : score >= 3
        ? {
            emoji: "💛",
            title: "That sounds like a lot to hold.",
            body: "You're not the only one — about 1 in 3 comrades on Kenyan campuses feel this way in a given year. A short, private chat with a doctor can take the weight off. No lectures, no judgement.",
          }
        : {
            emoji: "💚",
            title: "Sounds like you're holding up okay.",
            body: "Nice. Keep your routines going — sleep, people, movement. If things shift, this check-in will be here, and so will we.",
          };

  return (
    <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/5 via-card to-accent/40 p-5 shadow-card">
      <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative space-y-4">
        <header className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Brain className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold leading-tight">How have you really been?</h2>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              A 30-second self-check, adapted from clinical screening questions used worldwide.
            </p>
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success-foreground">
              <Lock className="size-3" />
              Private — stays on your device
            </p>
          </div>
        </header>

        <div className="space-y-3">
          {QUESTIONS.map((question, qi) => (
            <div key={question} className="space-y-1.5">
              <p className="text-xs font-bold leading-snug">
                <span className="mr-1 text-muted-foreground">{qi + 1}.</span>
                {question}
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {QUESTION_SCALE.map((option) => {
                  const active = answers[qi] === option.score;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => prev.map((a, i) => (i === qi ? option.score : a)))
                      }
                      className={cn(
                        "rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {complete ? (
          <div className="space-y-3 rounded-2xl border bg-card/90 p-4">
            <p className="text-sm font-extrabold">
              {band.emoji} {band.title}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">{band.body}</p>

            {score >= 7 && (
              <div className="space-y-1.5 rounded-xl border border-warning/40 bg-warning/10 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-warning-foreground">
                  <LifeBuoy className="size-3.5" />
                  Free, confidential, 24/7
                </p>
                <a
                  href="tel:1199"
                  className="flex items-center gap-2 text-xs font-bold text-foreground hover:text-primary"
                >
                  <Phone className="size-3.5 text-primary" /> 1199 — Kenya Red Cross counselling
                  (toll-free)
                </a>
                <a
                  href="tel:+254722178177"
                  className="flex items-center gap-2 text-xs font-bold text-foreground hover:text-primary"
                >
                  <Phone className="size-3.5 text-primary" /> 0722 178 177 — Befrienders Kenya
                </a>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="gap-1.5 text-xs font-bold" onClick={primeMentalIntake}>
                <HeartHandshake className="size-3.5" />
                Talk to a doctor privately — KSh 150
              </Button>
              <a href="/wellness" className="text-xs font-bold text-primary hover:underline">
                Wellness Hub →
              </a>
              <button
                type="button"
                onClick={() => setAnswers([null, null, null, null])}
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3" /> Retake
              </button>
            </div>
            <p className="text-[10px] leading-snug text-muted-foreground/80">
              This self-check is a screening aid, not a diagnosis.
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            {answered.length}/{QUESTIONS.length} answered — no right or wrong answers.
          </p>
        )}
      </div>
    </section>
  );
}
