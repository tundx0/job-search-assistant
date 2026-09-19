import Link from "next/link";

interface WordmarkProps {
  href?: string;
  className?: string;
}

/** The mark used in the masthead and footer, matching the landing page. */
export function Wordmark({ href, className = "" }: WordmarkProps) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="grid h-7 w-7 flex-none translate-y-[1px] place-items-center rounded-[0.4rem] bg-primary font-mono text-xs font-bold text-primary-foreground"
      >
        JS
      </span>
      <span className="truncate font-heading text-[1.05rem] font-semibold tracking-tight">
        Job Search Assistant
      </span>
    </>
  );

  const classes = `flex items-baseline gap-2.5 text-foreground ${className}`;

  if (!href) return <div className={classes}>{content}</div>;

  return (
    <Link href={href} className={classes} aria-label="Job Search Assistant, home">
      {content}
    </Link>
  );
}
