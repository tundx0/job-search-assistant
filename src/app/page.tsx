import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-muted/60 to-background">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10 shadow-sm w-full" style={{width:'100%'}}>
        <div className="w-full max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-6 font-medium">
            <h1 className="text-2xl font-extrabold tracking-tight">Job Search Assistant</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="lg">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center">
        <section className="w-full py-16 md:py-28 lg:py-36 bg-gradient-to-br from-primary/5 via-background to-muted/30">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-20 items-center">
              <div className="space-y-6 text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
                  Land Your Dream Job<br className="hidden md:block" /> with AI-Powered Assistance
                </h1>
                <p className="text-muted-foreground md:text-xl max-w-xl mx-auto lg:mx-0">
                  Our intelligent assistant helps you create tailored resumes and cover letters that match job descriptions perfectly, increasing your chances of getting hired.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center lg:justify-start">
                  <Link href="/auth/register">
                    <Button size="lg" className="w-full min-[400px]:w-auto">Get Started</Button>
                  </Link>
                  <Link href="#features">
                    <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="rounded-xl bg-muted p-8 shadow-lg border w-full max-w-md">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 rounded-lg bg-muted-foreground/20" />
                      <div className="h-4 w-full rounded-lg bg-muted-foreground/20" />
                      <div className="h-4 w-full rounded-lg bg-muted-foreground/20" />
                      <div className="h-4 w-2/3 rounded-lg bg-muted-foreground/20" />
                    </div>
                    <div className="h-32 rounded-lg bg-muted-foreground/20" />
                    <div className="flex justify-end">
                      <div className="h-8 w-24 rounded-lg bg-primary/80" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Features
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to optimize your job search and
                  application process
                </p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">
                  AI-Powered Resume Generation
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  Create tailored resumes that highlight your most relevant
                  skills and experiences for each job.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <path d="M2 10h20" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">
                  Personalized Cover Letters
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  Generate compelling cover letters that sound human-written and
                  address the specific requirements of each job.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Application Tracking</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Keep track of all your job applications in one place and never
                  miss a follow-up opportunity.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-background py-6 w-full" style={{width:'100%'}}>
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 md:px-8">
          <p className="text-sm text-muted-foreground md:text-base">
            &copy; {new Date().getFullYear()} Job Search Assistant. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
