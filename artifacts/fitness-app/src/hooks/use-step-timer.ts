import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Single-countdown timer hook.
 *
 * Designed to drive one step of a workout at a time. The parent
 * component owns the step index; on advance, it should call
 * `setSeconds(nextDuration)` to load the next step into the same
 * timer instance.
 *
 * Lifecycle / leak safety:
 *   - The setInterval is created lazily when `running` flips to true
 *     and is cleared in the same effect's cleanup. That guarantees
 *     no stray intervals if the component re-renders or unmounts.
 *   - A second effect handles the unmount case explicitly so the
 *     interval is also cleared if the component is torn down while
 *     the timer is mid-tick.
 *   - We tick by reading the previous state inside the updater
 *     (`setRemaining((s) => …)`) so we never read a stale closure.
 *
 * Returns:
 *   remaining   — seconds left on the current countdown
 *   running     — whether the interval is active
 *   start()     — start counting down from `remaining`; if remaining
 *                 has reached 0, restart from the most recently set
 *                 duration
 *   pause()     — pause without resetting `remaining`
 *   reset()     — pause and restore `remaining` to the initial value
 *   setSeconds() — pause and load a new duration (used when the
 *                 parent moves to the next step)
 */
export function useStepTimer(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  // Track the most recently set duration so `start()` can restart
  // from it after a natural finish (remaining === 0).
  const lastDurationRef = useRef(initialSeconds);

  // Interval handle — kept in a ref so cleanup can reach it from any
  // effect closure without becoming stale.
  const intervalRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Drive the countdown when `running` is true. The cleanup tears the
  // interval down whenever `running` flips back to false OR the
  // component unmounts, which is the canonical way to avoid leaks.
  useEffect(() => {
    if (!running) {
      clear();
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          // Hitting zero is the natural-finish signal. We stop the
          // interval and flip running off so the parent's effect can
          // observe the transition (running goes true → false while
          // remaining === 0) and auto-advance to the next step.
          clear();
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return clear;
  }, [running, clear]);

  // Belt-and-braces unmount cleanup. The effect above already clears
  // on unmount, but keeping this explicit makes the intent obvious to
  // future readers and protects against any future refactors.
  useEffect(() => () => clear(), [clear]);

  const start = useCallback(() => {
    setRemaining((s) => (s > 0 ? s : lastDurationRef.current));
    setRunning(true);
  }, []);

  const pause = useCallback(() => setRunning(false), []);

  const reset = useCallback(() => {
    setRunning(false);
    setRemaining(lastDurationRef.current);
  }, []);

  const setSeconds = useCallback((s: number) => {
    setRunning(false);
    lastDurationRef.current = s;
    setRemaining(s);
  }, []);

  return { remaining, running, start, pause, reset, setSeconds };
}
