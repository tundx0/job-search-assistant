"use client";

export function Footer() {
  return (
    <footer className="border-t bg-background py-4 sm:py-6 w-full mt-auto">
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 md:h-16 md:flex-row px-4 sm:px-6 lg:px-8">
        <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
          &copy; {new Date().getFullYear()} Job Search Assistant. All rights
          reserved.
        </p>
        <div className="flex items-center gap-3 sm:gap-4">
          <a
            href="#"
            className="text-xs sm:text-sm text-muted-foreground hover:text-primary"
          >
            Terms
          </a>
          <a
            href="#"
            className="text-xs sm:text-sm text-muted-foreground hover:text-primary"
          >
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}
