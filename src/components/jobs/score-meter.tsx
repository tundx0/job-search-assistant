interface ScoreMeterProps {
  /** 0-100, or null when the draft has not been scored yet. */
  score: number | null | undefined;
  className?: string;
}

function toneFor(score: number) {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--primary)";
  if (score >= 40) return "var(--warning)";
  return "var(--destructive)";
}

/** Compact score read-out: a numeral plus a hairline bar in the matching tone. */
export function ScoreMeter({ score, className = "" }: ScoreMeterProps) {
  if (score === null || score === undefined) {
    return <span className="label-mono">Not scored</span>;
  }

  const clamped = Math.max(0, Math.min(100, score));
  const tone = toneFor(clamped);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        className="font-mono text-xs tabular-nums"
        style={{ color: tone }}
      >
        {clamped}
      </span>
      <span
        className="h-1 w-14 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Match score ${clamped} out of 100`}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${clamped}%`, background: tone }}
        />
      </span>
    </div>
  );
}
