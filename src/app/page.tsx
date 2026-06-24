import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="space-y-6">
        <div className="text-6xl">◻</div>
        <h1 className="text-3xl font-light tracking-tight">FilmRoll</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          A disposable camera experience for your browser.
          <br />
          Capture moments, not content.
        </p>

        <div className="space-y-3 pt-4">
          <Link
            href="/camera"
            className="inline-flex h-12 w-64 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90"
          >
            Start Capturing
          </Link>
          <div className="text-muted-foreground text-xs">
            No account needed. No followers. Just memories.
          </div>
        </div>

        <div className="border-t border-border pt-6 text-left text-xs text-muted-foreground space-y-2">
          <p>
            <strong>How it works:</strong>
          </p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Pick a film stock preset</li>
            <li>Choose your aspect ratio</li>
            <li>Capture photos like a disposable camera</li>
            <li>Review your temporary roll</li>
            <li>Archive your favorites</li>
            <li>Share a roll with a private link</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
