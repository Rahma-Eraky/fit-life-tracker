import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle,
  Clock,
  Coffee,
  Timer as TimerIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStepTimer } from "@/hooks/use-step-timer";
import { parseStepDuration } from "@/lib/parse-step-duration";
import { useTranslation } from "@/lib/language-context";

interface StepTimerProps {
  steps: string[];
  /** Called once when the user finishes the final step. */
  onComplete?: () => void;
}

/**
 * Phase machine:
 *   exercise → (timer ends) → rest → (timer ends) → prep → exercise → …
 * Manual Start while phase === "exercise" goes through prep first:
 *   exercise (paused) → prep → exercise
 * Final exercise's natural end goes straight to "done" (no rest).
 *
 * `prep` is the 3-second pre-exercise countdown. Whether the prep is
 * triggered by the user pressing Start OR by the rest ending, it always
 * runs the same way: 3 seconds, then exercise auto-starts.
 */
type Phase = "exercise" | "prep" | "rest" | "done";

const PREP_DURATION_SECONDS = 3;
const REST_DURATION_SECONDS = 10;

/**
 * StepTimer — guided per-exercise player with prep, rest, and audio cues.
 *
 * Reuse: a single `useStepTimer` instance drives prep, exercise, AND
 * rest countdowns. The duration is swapped via `setSeconds` whenever
 * the phase flips. No second hook, no second interval.
 *
 * Audio: see SOUND palette below. All sounds route through a single
 * lazy-init shared AudioContext, created and resumed inside the first
 * user gesture (the Start button click). This is what fixes the
 * "first click is silent" bug — Safari keeps fresh AudioContexts in
 * `suspended` state until resume() runs from a gesture.
 */
export function StepTimer({ steps, onComplete }: StepTimerProps) {
  const { t } = useTranslation();

  // Compute exercise durations once so the random fallback inside
  // parseStepDuration stays stable across renders.
  const durations = useMemo(() => steps.map(parseStepDuration), [steps]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("exercise");

  const { remaining, running, start, pause, setSeconds } = useStepTimer(
    durations[0] ?? 30,
  );

  // Tracks the exercise's remaining-time when we duck out into prep,
  // so we can resume the exercise from where the user paused rather
  // than restarting it from the full duration after the prep ends.
  const savedExerciseRemainingRef = useRef<number | null>(null);

  // Phase / index watchers — keep effects from re-firing across
  // renders that didn't actually change anything meaningful.
  const lastPhaseRef = useRef<Phase>("exercise");
  const wasRunningRef = useRef(false);
  const prevRemainingRef = useRef(remaining);

  // ─── Phase change driver ───────────────────────────────────────
  // Fires whenever phase transitions. Configures the timer for the
  // new phase and (for prep / rest) auto-starts the countdown so the
  // user doesn't have to keep tapping Start between exercises.
  useEffect(() => {
    if (lastPhaseRef.current === phase) return;
    const prev = lastPhaseRef.current;
    lastPhaseRef.current = phase;
    if (phase === "prep") {
      setSeconds(PREP_DURATION_SECONDS);
      // Defer to the next frame so the setSeconds state-set commits
      // before start() reads it. Without this rAF, start() can fire
      // against a stale remaining and immediately tick to 0.
      requestAnimationFrame(() => start());
      return;
    }
    if (phase === "exercise") {
      // We always arrive at "exercise" from "prep" (either after the
      // user pressed Start, or after the rest auto-advanced through
      // prep). Restore the saved remaining; if there's none, fall
      // back to the full duration for the current index.
      const seconds =
        savedExerciseRemainingRef.current ?? durations[currentIdx] ?? 30;
      savedExerciseRemainingRef.current = null;
      setSeconds(seconds);
      // Auto-start when we arrived from prep (prep → exercise is the
      // hands-free transition the user expects). On the initial mount
      // there's no transition so we never reach this branch.
      if (prev === "prep") {
        requestAnimationFrame(() => start());
      }
      return;
    }
    if (phase === "rest") {
      setSeconds(REST_DURATION_SECONDS);
      requestAnimationFrame(() => start());
      return;
    }
    // phase === "done" — nothing to wire up; the done card handles it.
  }, [phase, currentIdx, durations, setSeconds, start]);

  // ─── Natural-finish detector ───────────────────────────────────
  // The hook flips running false + remaining 0 when the countdown
  // ends naturally. We watch that running→stopped@0 transition to
  // chain into the next phase. The wasRunningRef guard prevents
  // initial-mount false fires (where running starts as false).
  const handleNaturalFinish = useCallback(() => {
    if (phase === "prep") {
      // Prep silently transitions to exercise. The exercise countdown
      // visually taking over IS the cue.
      setPhase("exercise");
      return;
    }
    if (phase === "exercise") {
      const isLast = currentIdx >= steps.length - 1;
      if (isLast) {
        // Final exercise: skip rest, play completion chime, show done.
        playComplete();
        setPhase("done");
        onComplete?.();
        return;
      }
      // Bell for end-of-exercise, then auto-roll into the rest period.
      playBeep(SOUND.bell);
      setPhase("rest");
      return;
    }
    if (phase === "rest") {
      // End-of-rest bell, then start sound for the upcoming exercise,
      // then advance index and switch to prep so the 3s countdown
      // runs before the next exercise begins. The setTimeout sequences
      // the two pips so they're individually audible rather than
      // colliding.
      playBeep(SOUND.bell);
      window.setTimeout(() => {
        playBeep(SOUND.start);
        setCurrentIdx((i) => i + 1);
        setPhase("prep");
      }, 220);
    }
  }, [phase, currentIdx, steps.length, onComplete]);

  useEffect(() => {
    if (running) {
      wasRunningRef.current = true;
    } else if (
      remaining === 0 &&
      wasRunningRef.current &&
      phase !== "done"
    ) {
      wasRunningRef.current = false;
      handleNaturalFinish();
    }
  }, [running, remaining, phase, handleNaturalFinish]);

  // ─── Rest-period tick sound ────────────────────────────────────
  // While the rest countdown is running, play a soft tick on every
  // decrement. We compare to the previous remaining so we only tick
  // on the down-step (and skip the boundary at 0, which is owned by
  // the bell sound).
  useEffect(() => {
    if (
      phase === "rest" &&
      running &&
      remaining > 0 &&
      remaining < prevRemainingRef.current
    ) {
      playBeep(SOUND.tick);
    }
    prevRemainingRef.current = remaining;
  }, [remaining, running, phase]);

  // ─── User actions ──────────────────────────────────────────────
  const handleStart = () => {
    // Always-resume the shared AudioContext on every Start press.
    // Combined with playBeep() also calling resume(), this guarantees
    // the very first tap produces sound — fixing the bug where the
    // initial AudioContext was suspended on Safari.
    primeAudio();
    playBeep(SOUND.start);

    if (phase === "rest" || phase === "prep") {
      // Just resume the existing countdown; prep restart isn't useful
      // (the prep was already counting). The user can press Reset if
      // they want a fresh prep.
      start();
      return;
    }
    if (phase === "exercise") {
      // Save the current paused remaining (or fall back to the full
      // duration if the exercise hasn't started yet) so prep → exercise
      // resumes from the right spot.
      const saved = remaining > 0 ? remaining : durations[currentIdx] ?? 30;
      savedExerciseRemainingRef.current = saved;
      setPhase("prep");
    }
  };

  const handlePause = () => {
    playBeep(SOUND.pause);
    pause();
  };

  // Reset re-loads the CURRENT phase's full duration. During exercise
  // it also clears the saved-remaining ref so a subsequent prep run
  // starts fresh.
  const handleResetPhase = () => {
    if (phase === "prep") {
      setSeconds(PREP_DURATION_SECONDS);
    } else if (phase === "rest") {
      setSeconds(REST_DURATION_SECONDS);
    } else if (phase === "exercise") {
      savedExerciseRemainingRef.current = null;
      setSeconds(durations[currentIdx] ?? 30);
    }
  };

  // Skip is direction-aware: exercise → rest, rest → next exercise via
  // prep, prep → exercise. The advance pip acknowledges the user's
  // explicit request.
  const handleSkip = () => {
    pause();
    playBeep(SOUND.advance);
    if (phase === "exercise") {
      const isLast = currentIdx >= steps.length - 1;
      if (isLast) {
        playComplete();
        setPhase("done");
        onComplete?.();
        return;
      }
      setPhase("rest");
      return;
    }
    if (phase === "rest") {
      // Skip rest → straight to the next exercise via prep, matching
      // the natural-finish flow.
      setCurrentIdx((i) => i + 1);
      setPhase("prep");
      return;
    }
    if (phase === "prep") {
      // Skip prep → start the exercise immediately.
      setPhase("exercise");
    }
  };

  const handleRestartAll = () => {
    setPhase("exercise");
    setCurrentIdx(0);
    lastPhaseRef.current = "exercise";
    wasRunningRef.current = false;
    savedExerciseRemainingRef.current = null;
    setSeconds(durations[0] ?? 30);
  };

  // ─── Derived render values ─────────────────────────────────────
  const totalSecs =
    phase === "prep"
      ? PREP_DURATION_SECONDS
      : phase === "rest"
        ? REST_DURATION_SECONDS
        : durations[currentIdx] ?? 30;
  const progress =
    totalSecs > 0 ? ((totalSecs - remaining) / totalSecs) * 100 : 0;
  const nextExerciseLabel =
    phase === "rest" && currentIdx + 1 < steps.length
      ? steps[currentIdx + 1]
      : null;

  // Phase-aware accent color: amber for rest, sky for prep, primary
  // (green) for exercise. Same set of utility classes for both light
  // and dark themes — the semantic palette adapts automatically.
  const accentText =
    phase === "rest"
      ? "text-amber-500"
      : phase === "prep"
        ? "text-sky-500"
        : "text-primary";
  const accentBar =
    phase === "rest"
      ? "bg-amber-500"
      : phase === "prep"
        ? "bg-sky-500"
        : "bg-primary";

  // ─── Done state ────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="text-center bg-card rounded-3xl border border-border dark:border-white/5 p-10 md:p-12"
      >
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl md:text-4xl font-black mb-3">
          {t("session.complete")}
        </h2>
        <p className="text-muted-foreground mb-8">
          {t("session.completeDesc")}
        </p>
        <Button
          onClick={handleRestartAll}
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
        >
          <RotateCcw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
          {t("session.restart")}
        </Button>
      </motion.div>
    );
  }

  // ─── Active state (exercise / prep / rest) ─────────────────────
  return (
    <div className="bg-card rounded-3xl border border-border dark:border-white/5 p-6 md:p-10 shadow-lg">
      {/* Header — progress count + total duration for the current phase */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("session.stepProgress", {
            current: currentIdx + 1,
            total: steps.length,
          })}
        </span>
        <span
          className={`text-xs md:text-sm font-bold flex items-center gap-1.5 ${accentText}`}
        >
          <Clock className="w-4 h-4" />
          {formatTime(totalSecs)}
        </span>
      </div>

      {/* Progress bar — colored per phase. */}
      <div className="w-full h-2 bg-secondary/60 rounded-full overflow-hidden mb-10">
        <motion.div
          className={`h-full rounded-full ${accentBar}`}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "linear" }}
        />
      </div>

      {/* Active panel — animated transition between phases. The key
          combines phase + index so each transition (exercise→rest,
          rest→prep@idx+1, prep→exercise) gets its own enter animation. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${phase}-${currentIdx}`}
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -12 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <p
            className={`text-[11px] font-bold uppercase tracking-[0.18em] mb-3 flex items-center justify-center gap-2 ${accentText}`}
          >
            {phase === "rest" && <Coffee className="w-3.5 h-3.5" />}
            {phase === "prep" && <TimerIcon className="w-3.5 h-3.5" />}
            {phase === "rest"
              ? t("session.restPeriod")
              : phase === "prep"
                ? t("session.getReady")
                : t("session.currentStep")}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold leading-snug mb-8 max-w-2xl mx-auto">
            {phase === "rest" && nextExerciseLabel
              ? t("session.restingNext", { next: nextExerciseLabel })
              : phase === "prep"
                ? steps[currentIdx]
                : steps[currentIdx]}
          </h2>
          <div className="text-6xl md:text-8xl font-black tabular-nums text-foreground">
            {formatTime(remaining)}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls — Start / Pause / Reset / Skip. Skip label switches to
          "Skip Rest" while resting so the action is unambiguous. */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {running ? (
          <Button
            onClick={handlePause}
            size="lg"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow min-w-[140px]"
          >
            <Pause className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {t("session.pause")}
          </Button>
        ) : (
          <Button
            onClick={handleStart}
            size="lg"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow min-w-[140px]"
          >
            <Play className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2 fill-current" />
            {remaining < totalSecs
              ? t("session.resume")
              : t("session.start")}
          </Button>
        )}
        <Button
          onClick={handleResetPhase}
          size="lg"
          variant="outline"
          className="rounded-full border-border dark:border-white/20"
        >
          <RotateCcw className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
          {t("session.reset")}
        </Button>
        <Button
          onClick={handleSkip}
          size="lg"
          variant="ghost"
          className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <SkipForward className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />
          {phase === "rest" ? t("session.skipRest") : t("session.skip")}
        </Button>
      </div>

      {/* Mini timeline — same visual rules as before. */}
      <ol className="space-y-2 pt-6 border-t border-border dark:border-white/5">
        {steps.map((step, i) => {
          const status: "done" | "active" | "upcoming" =
            i < currentIdx ? "done" : i === currentIdx ? "active" : "upcoming";
          return (
            <li
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                status === "active"
                  ? "bg-primary/10 border border-primary/30"
                  : status === "done"
                    ? "opacity-60"
                    : ""
              }`}
            >
              <span
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  status === "done"
                    ? "bg-primary/20 text-primary"
                    : status === "active"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {status === "done" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`text-sm leading-relaxed pt-1 ${
                  status === "done" ? "line-through" : ""
                }`}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ──────────────────────────────────────────────────────────────────
// Audio
// ──────────────────────────────────────────────────────────────────
//
// Why one shared AudioContext (and not one per beep):
//   - Each new AudioContext starts in "suspended" state on Safari
//     unless created from a user gesture. Creating fresh per call
//     means EVERY call has the same first-time penalty, including
//     calls fired from setInterval / setTimeout.
//   - A shared, lazily initialized context that's resumed once on
//     the first Start tap stays resumed for the whole page lifetime
//     (only suspending on tab background, which we recover from by
//     calling resume() in every playBeep call).
//   - Net effect: the very first Start click produces sound, and so
//     does every interval-driven beep that follows.

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (sharedCtx) return sharedCtx;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    sharedCtx = new Ctor();
    return sharedCtx;
  } catch {
    return null;
  }
}

/**
 * Force-resume the shared AudioContext from a known user-gesture
 * handler. Called from handleStart so the very first tap on the page
 * unlocks audio output, no matter which sound fires first afterwards.
 */
function primeAudio(): void {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {
      /* noop */
    });
  }
}

interface BeepOpts {
  freq: number;
  /** Total beep length in milliseconds. */
  duration: number;
  /** 0..1, default 0.18. */
  volume?: number;
  /** Oscillator type, default "sine". */
  type?: OscillatorType;
}

function playBeep({ freq, duration, volume = 0.18, type = "sine" }: BeepOpts) {
  const ctx = getCtx();
  if (!ctx) return;
  // Re-resume on every call too, in case the context was suspended
  // by the browser (e.g. tab backgrounded). Resume() is a no-op if
  // already running, so it's safe to call always.
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {
      /* noop */
    });
  }
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = ctx.currentTime;
    const seconds = duration / 1000;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      t0 + Math.max(0.05, seconds - 0.02),
    );
    osc.start(t0);
    osc.stop(t0 + seconds);
  } catch {
    /* audio scheduling failed — silent fallback */
  }
}

/**
 * Three-note ascending chime for workout completion. setTimeout sequences
 * the notes so they're heard as a cadence rather than a chord.
 */
function playComplete() {
  playBeep({ freq: 660, duration: 200, volume: 0.2 });
  window.setTimeout(
    () => playBeep({ freq: 880, duration: 200, volume: 0.2 }),
    200,
  );
  window.setTimeout(
    () => playBeep({ freq: 1320, duration: 400, volume: 0.22 }),
    400,
  );
}

/**
 * Sound palette. Single object so adding a new event is one line, and
 * volumes/freqs can be tuned together. Frequencies were picked so
 * each event is recognisably different:
 *   start  — mid pip
 *   pause  — lower pip
 *   bell   — higher, longer (used for both exercise-end and rest-end
 *            transitions; the visual phase change disambiguates)
 *   tick   — short, low-volume; subtle metronome during rest
 *   advance — bright pip; user-skipped transition
 */
const SOUND = {
  start: { freq: 660, duration: 130, volume: 0.16 },
  pause: { freq: 330, duration: 130, volume: 0.16 },
  bell: { freq: 880, duration: 420, volume: 0.22 },
  tick: { freq: 700, duration: 60, volume: 0.08 },
  advance: { freq: 1000, duration: 150, volume: 0.18 },
} as const;
