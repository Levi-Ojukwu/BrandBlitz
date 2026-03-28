export default function ChallengeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse space-y-4 text-center">
        <div className="h-24 w-24 rounded-full bg-[var(--muted)] mx-auto" />
        <div className="h-6 w-48 rounded bg-[var(--muted)] mx-auto" />
        <div className="h-4 w-32 rounded bg-[var(--muted)] mx-auto" />
      </div>
    </div>
  );
}
