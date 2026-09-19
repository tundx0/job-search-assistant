import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Wordmark } from "@/components/layout/wordmark";

const PITCH = [
  "Write your profile once, reuse it for every posting.",
  "Drafts scored against the job before you send them.",
  "Every application filed in one place.",
];

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Standing panel: the product's case, visible once there is room. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-[var(--rule)] bg-card p-10 lg:flex xl:p-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(38rem 26rem at 88% -8%, color-mix(in oklch, var(--primary), transparent 82%), transparent 62%), radial-gradient(30rem 22rem at 4% 92%, color-mix(in oklch, var(--warning), transparent 88%), transparent 60%)",
          }}
        />

        <div className="relative">
          <Wordmark href="/" />
        </div>

        <div className="relative max-w-md">
          <p className="label-mono">Resume &amp; cover letter studio</p>
          <p className="mt-5 font-heading text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.03em]">
            A resume written for{" "}
            <span className="italic text-primary">this</span> job. Every time.
          </p>
          <ul className="mt-8 space-y-3.5">
            {PITCH.map((line) => (
              <li key={line} className="flex gap-3 text-sm text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-px w-5 flex-none bg-primary"
                />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative label-mono">
          &copy; {new Date().getFullYear()} Job Search Assistant
        </p>
      </aside>

      {/* Form column */}
      <main className="flex flex-col px-5 py-8 sm:px-8">
        <div className="lg:hidden">
          <Wordmark href="/" />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[24rem]">{children}</div>
        </div>
      </main>
    </div>
  );
}
