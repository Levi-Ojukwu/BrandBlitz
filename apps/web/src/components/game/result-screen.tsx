"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatScore, formatUsdc } from "@/lib/utils";

interface ResultScreenProps {
  totalScore: number;
  rank?: number;
  estimatedUsdc?: string;
  challengeId: string;
}

export function ResultScreen({ totalScore, rank, estimatedUsdc, challengeId }: ResultScreenProps) {
  const shareText = `I just scored ${formatScore(totalScore)} in a BrandBlitz challenge${estimatedUsdc ? ` and earned ~${formatUsdc(estimatedUsdc)} USDC` : ""}! 🏆`;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-sm w-full text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Challenge Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-6xl font-bold text-[var(--primary)]">{formatScore(totalScore)}</p>
            <p className="text-[var(--muted-foreground)] mt-1">points</p>
          </div>

          {rank && (
            <p className="text-lg font-medium">
              Rank #{rank}
            </p>
          )}

          {estimatedUsdc && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-700">Estimated earnings</p>
              <p className="text-2xl font-bold text-green-800">{formatUsdc(estimatedUsdc)} USDC</p>
              <p className="text-xs text-green-600 mt-1">Paid out when challenge ends</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ text: shareText, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(shareText);
                }
              }}
              variant="outline"
              className="w-full"
            >
              Share Result
            </Button>

            <Link href={`/challenge/${challengeId}`} passHref>
              <Button variant="secondary" className="w-full">
                View Leaderboard
              </Button>
            </Link>

            <Link href="/" passHref>
              <Button className="w-full">Play Another Challenge</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
