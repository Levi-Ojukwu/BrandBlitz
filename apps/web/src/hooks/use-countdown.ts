"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseCountdownOptions {
  seconds: number;
  onExpire?: () => void;
  autoStart?: boolean;
}

export function useCountdown({ seconds, onExpire, autoStart = true }: UseCountdownOptions) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [running]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => {
    setRunning(false);
    setTimeLeft(seconds);
  }, [seconds]);

  return { timeLeft, running, start, pause, reset };
}
