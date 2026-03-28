import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--muted-foreground)]">
        <p>
          &copy; {new Date().getFullYear()} BrandBlitz. Powered by{" "}
          <span className="font-medium">Stellar USDC</span>.
        </p>
        <div className="flex gap-6">
          <Link href="/leaderboard" className="hover:text-[var(--foreground)] transition-colors">
            Leaderboard
          </Link>
          <Link href="/challenge" className="hover:text-[var(--foreground)] transition-colors">
            Challenges
          </Link>
          <Link href="/dashboard" className="hover:text-[var(--foreground)] transition-colors">
            For Brands
          </Link>
        </div>
      </div>
    </footer>
  );
}
