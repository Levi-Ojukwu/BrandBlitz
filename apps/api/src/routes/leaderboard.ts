import { Router } from "express";
import { z } from "zod";
import { getActiveChallenges } from "../db/queries/challenges";
import { getLeaderboard } from "../db/queries/sessions";
import { redis } from "../lib/redis";

const router = Router();

/**
 * GET /leaderboard/global
 * Cross-challenge leaderboard (cached in Redis, 5 min TTL).
 */
router.get("/global", async (_req, res) => {
  const cacheKey = "leaderboard:global";
  const cached = await redis.get(cacheKey);

  if (cached) {
    res.json(JSON.parse(cached));
    return;
  }

  const challenges = await getActiveChallenges(10);
  const allSessions: unknown[] = [];

  for (const challenge of challenges) {
    const sessions = await getLeaderboard(challenge.id, 10);
    allSessions.push(...sessions.map((s, i) => ({
      rank: i + 1,
      challengeId: challenge.id,
      username: s.username,
      avatarUrl: s.avatar_url,
      totalScore: s.total_score,
    })));
  }

  const response = { leaderboard: allSessions, cachedAt: new Date().toISOString() };
  await redis.set(cacheKey, JSON.stringify(response), "EX", 300);

  res.json(response);
});

/**
 * GET /leaderboard/:challengeId
 */
router.get("/:challengeId", async (req, res) => {
  const { limit, offset } = z.object({
    limit: z.coerce.number().default(20),
    offset: z.coerce.number().default(0),
  }).parse(req.query);

  const sessions = await getLeaderboard(req.params.challengeId, limit, offset);

  res.json({
    sessions: sessions.map((s, i) => ({
      rank: offset + i + 1,
      username: s.username,
      avatarUrl: s.avatar_url,
      totalScore: s.total_score,
    })),
  });
});

export default router;
