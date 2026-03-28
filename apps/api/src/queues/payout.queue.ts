import { Queue } from "bullmq";
import { redis } from "../lib/redis";

export const payoutQueue = new Queue("payout", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  },
});
