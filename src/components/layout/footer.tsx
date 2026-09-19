"use client";

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-[var(--rule)]">
      <div className="mx-auto flex w-full max-w-[84rem] flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
        <p className="label-mono">
          &copy; {new Date().getFullYear()} Job Search Assistant
        </p>
        <div className="flex items-center gap-5">
          <a href="#" className="label-mono transition-colors hover:text-foreground">
            Terms
          </a>
          <a href="#" className="label-mono transition-colors hover:text-foreground">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}
