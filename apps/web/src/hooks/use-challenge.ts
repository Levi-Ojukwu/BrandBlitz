"use client";

import { useState, useEffect } from "react";
import { createApiClient, type Challenge, type ChallengeQuestion } from "@/lib/api";

interface UseChallengeResult {
  challenge: Challenge | null;
  questions: ChallengeQuestion[];
  loading: boolean;
  error: string | null;
}

export function useChallenge(challengeId: string, apiToken?: string): UseChallengeResult {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!challengeId) return;

    const api = createApiClient(apiToken);

    api
      .get(`/challenges/${challengeId}`)
      .then((res) => {
        setChallenge(res.data.challenge);
        setQuestions(res.data.questions ?? []);
      })
      .catch((err) => {
        setError(err?.response?.data?.message ?? "Failed to load challenge");
      })
      .finally(() => setLoading(false));
  }, [challengeId, apiToken]);

  return { challenge, questions, loading, error };
}
