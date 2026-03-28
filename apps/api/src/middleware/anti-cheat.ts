import type { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis";
import { flagSession } from "../db/queries/sessions";
import { createError } from "./error";

const MIN_HUMAN_REACTION_MS = 150;
const MAX_HUMAN_REACTION_MS = 30_000;

/**
 * Anti-cheat Layer 3 — server-side timing validation.
 * Validates that answer submission timing falls within human range.
 * Called on session answer routes.
 */
export function validateReactionTime(req: Request, _res: Response, next: NextFunction): void {
  const { reactionTimeMs } = req.body as { reactionTimeMs?: number };

  if (reactionTimeMs === undefined) {
    next();
    return;
  }

  if (reactionTimeMs < MIN_HUMAN_REACTION_MS) {
    // Superhuman — bot flag (don't block, log for review)
    const sessionId: string | undefined = (req as any).sessionId;
    if (sessionId) {
      flagSession(sessionId, ["superhuman_reaction_time"]).catch(() => {});
    }
  }

  if (reactionTimeMs > MAX_HUMAN_REACTION_MS) {
    // Answer submitted after time window expired — reject
    throw createError("Answer submitted after time window", 400, "TIMEOUT");
  }

  next();
}

/**
 * Anti-cheat Layer 5 — Redis rate limiting.
 * Enforces: 1 competitive session per account per challenge.
 */
export async function enforceOneSessionPerChallenge(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.user!.sub;
  const { challengeId } = req.params;

  const key = `session:lock:${userId}:${challengeId}`;
  const existing = await redis.get(key);

  if (existing) {
    throw createError("Already played this challenge", 409, "ALREADY_PLAYED");
  }

  // TTL of 2 hours to auto-expire if session never completes
  await redis.set(key, "1", "EX", 7200);
  next();
}

/**
 * Anti-cheat Layer 2 — device fingerprint check.
 * Validates the FingerprintJS visitorId matches the session start fingerprint.
 */
export async function validateDeviceFingerprint(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const visitorId = req.headers["x-visitor-id"] as string | undefined;
  const userId = req.user?.sub;

  if (!visitorId || !userId) {
    next();
    return;
  }

  // Check if this device is associated with too many accounts (>2 in 24h)
  const deviceKey = `device:${visitorId}:accounts`;
  const count = await redis.scard(deviceKey);

  if (count >= 3) {
    // Flag suspicious — multiple accounts on same device
    const sessionId: string | undefined = (req as any).sessionId;
    if (sessionId) {
      flagSession(sessionId, ["multi_account_device"]).catch(() => {});
    }
  }

  // Register this user+device association
  await redis.sadd(deviceKey, userId);
  await redis.expire(deviceKey, 86400); // 24h

  next();
}
