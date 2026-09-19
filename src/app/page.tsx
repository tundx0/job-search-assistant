import Link from "next/link";
import { Archivo, Fraunces, Space_Mono } from "next/font/google";

import "./landing.css";

const display = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  variable: "--ds-font-display",
  display: "swap",
});

const body = Archivo({
  subsets: ["latin"],
  variable: "--ds-font-body",
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--ds-font-mono",
  display: "swap",
});

const NAV = [
  { href: "#method", label: "Method" },
  { href: "#toolkit", label: "Toolkit" },
  { href: "#questions", label: "Questions" },
];

const TICKER = [
  "Paste the posting",
  "Match the keywords",
  "Rewrite the bullets",
  "Score the fit",
  "Draft the letter",
  "Export the PDF",
  "Track the reply",
];

const STEPS = [
  {
    no: "01",
    title: "Write your profile once",
    copy: "Experience, education, projects, links and skills live in one structured record — not scattered across a dozen forks of the same document.",
    tags: ["Structured profile", "Reusable", "Editable anytime"],
  },
  {
    no: "02",
    title: "Drop in the job",
    copy: "Paste the description and add the company details. Choose the model you trust for this application, and switch ATS optimisation on when the posting is going through a filter first.",
    tags: ["Any posting", "Model of your choice", "ATS toggle"],
  },
  {
    no: "03",
    title: "Send something that fits",
    copy: "You get a tailored resume and cover letter drawn from your real history, a strength score against the posting, and a PDF ready to attach — all filed under the application you just created.",
    tags: ["Resume + letter", "Strength score", "PDF export"],
  },
];

const FAQ = [
  {
    q: "Does it invent experience I do not have?",
    a: "No. Every draft is built from the profile you wrote. The model decides what to lead with, how to phrase it and what to leave out for a given posting — it does not manufacture jobs, dates or credentials.",
  },
  {
    q: "Which AI models can I use?",
    a: "OpenAI and Google Gemini models are supported, and you pick the default in settings. Add your own API keys and requests run on your account, at your rates, with your provider's data policy.",
  },
  {
    q: "What does the strength score actually measure?",
    a: "The generated resume is read back against the job description and scored on how well the two line up, with the specific gaps listed out. It is a review pass before you send, not a guarantee of an interview.",
  },
  {
    q: "What happens to my documents?",
    a: "Generated files are stored against your account through a pluggable storage layer — local disk, Amazon S3 or Supabase, depending on how the instance is configured. Private files are served through signed URLs.",
  },
];

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <div className={`ds ${display.variable} ${body.variable} ${mono.variable}`}>
      <header className="ds-masthead">
        <div className="ds-shell ds-masthead__row">
          <Link href="/" className="ds-wordmark" aria-label="Job Search Assistant, home">
            <span className="ds-wordmark__mark" aria-hidden="true">
              JS
            </span>
            <span className="ds-wordmark__name">Job Search Assistant</span>
          </Link>

          <nav className="ds-masthead__nav" aria-label="Primary">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="ds-navlink">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ds-masthead__actions">
            <Link href="/auth/login" className="ds-btn ds-btn--ghost ds-masthead__login">
              Log in
            </Link>
            <Link href="/auth/register" className="ds-btn ds-btn--signal">
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ---------------------------------------------------------- Hero */}
        <section className="ds-hero">
          <div className="ds-shell ds-shell--ruled">
            <div className="ds-hero__grid">
              <div>
                <p className="ds-kicker ds-enter ds-enter-1">
                  <span className="ds-kicker__dot" aria-hidden="true" />
                  <span>Resume &amp; cover letter studio</span>
                </p>

                <h1 className="ds-hero__title ds-enter ds-enter-2">
                  A resume written for <span className="ds-em">this</span> job.
                  Every time.
                </h1>

                <p className="ds-hero__lede ds-enter ds-enter-3">
                  Paste the posting. Job Search Assistant drafts a tailored
                  resume and cover letter from the profile you already wrote,
                  scores the result against what the role actually asks for, and
                  keeps every application in one place.
                </p>

                <div className="ds-hero__cta ds-enter ds-enter-4">
                  <Link href="/auth/register" className="ds-btn ds-btn--signal">
                    Create your account
                    <span className="ds-btn__arrow" aria-hidden="true">
                      &rarr;
                    </span>
                  </Link>
                  <Link href="#method" className="ds-btn ds-btn--ghost">
                    See how it works
                  </Link>
                </div>

                <ul className="ds-facts ds-enter ds-enter-5">
                  {[
                    { value: "OpenAI & Gemini", label: "Model choice" },
                    { value: "Your own keys", label: "Encrypted at rest" },
                    { value: "ATS-aware", label: "Optional toggle" },
                  ].map((fact) => (
                    <li key={fact.value} className="ds-facts__item">
                      <span className="ds-facts__value">{fact.value}</span>
                      <span className="ds-facts__label">{fact.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hero apparatus: posting in, scored draft out. */}
              <div className="ds-apparatus ds-enter ds-enter-6" aria-hidden="true">
                <article className="ds-panel ds-card--posting">
                  <div className="ds-panel__bar">
                    <span className="ds-mono">Posting</span>
                    <span className="ds-mono">Senior product engineer</span>
                  </div>
                  <div className="ds-panel__body">
                    <div className="ds-lines">
                      <span className="ds-line" style={{ width: "88%" }} />
                      <span className="ds-line" style={{ width: "96%" }} />
                      <span className="ds-line ds-line--mark" style={{ width: "72%" }} />
                      <span className="ds-line" style={{ width: "60%" }} />
                    </div>
                    <div className="ds-chips">
                      <span className="ds-chip">TypeScript</span>
                      <span className="ds-chip">Design systems</span>
                      <span className="ds-chip">Mentoring</span>
                      <span className="ds-chip">Postgres</span>
                    </div>
                  </div>
                </article>

                <div className="ds-seam">
                  <span>Tailoring</span>
                  <span className="ds-seam__line" />
                </div>

                <article className="ds-panel ds-card--draft">
                  <div className="ds-panel__bar">
                    <span className="ds-mono">Draft 01</span>
                    <span className="ds-mono">Resume + letter</span>
                  </div>
                  <div className="ds-panel__body">
                    <div className="ds-score">
                      <div className="ds-score__dial">
                        <svg viewBox="0 0 68 68" role="presentation">
                          <circle className="ds-score__track" cx="34" cy="34" r="29" />
                          <circle className="ds-score__value" cx="34" cy="34" r="29" />
                        </svg>
                        <span className="ds-score__num">82</span>
                      </div>
                      <div className="ds-score__copy">
                        <p>
                          Strong match on platform work and mentoring. Lead with
                          the design-system rebuild.
                        </p>
                        <p className="ds-gap">Gap &middot; add Postgres tuning</p>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- Ticker */}
        <div className="ds-ticker" aria-hidden="true">
          <div className="ds-ticker__track">
            {[0, 1].map((copy) => (
              <div key={copy} className="ds-ticker__item">
                {TICKER.join("   ·   ")}
              </div>
            ))}
          </div>
        </div>

        {/* -------------------------------------------------------- Method */}
        <section id="method" className="ds-section">
          <div className="ds-shell ds-shell--ruled">
            <div className="ds-marker">
              <span className="ds-marker__no">01</span>
              <span className="ds-marker__label">Method</span>
              <span className="ds-marker__line" />
            </div>

            <div className="ds-section__head ds-reveal">
              <h2 className="ds-section__title">
                Three steps, then the part you were avoiding is done.
              </h2>
              <p className="ds-section__note">
                The tedious work in a job search is not finding the posting. It
                is rewriting the same history forty different ways and keeping
                track of which version went where.
              </p>
            </div>

            <ol className="ds-steps">
              {STEPS.map((step) => (
                <li key={step.no} className="ds-step ds-reveal">
                  <span className="ds-step__no" aria-hidden="true">
                    {step.no}
                  </span>
                  <h3 className="ds-step__title">{step.title}</h3>
                  <div className="ds-step__body">
                    <p>{step.copy}</p>
                    <ul className="ds-step__list">
                      {step.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------------- Toolkit */}
        <section id="toolkit" className="ds-section">
          <div className="ds-shell ds-shell--ruled">
            <div className="ds-marker">
              <span className="ds-marker__no">02</span>
              <span className="ds-marker__label">Toolkit</span>
              <span className="ds-marker__line" />
            </div>

            <div className="ds-section__head ds-reveal">
              <h2 className="ds-section__title">
                Everything the application needs, in one file.
              </h2>
            </div>

            <div className="ds-bento">
              <article className="ds-tile ds-tile--wide ds-reveal">
                <div className="ds-tile__inner">
                  <div>
                    <div className="ds-tile__icon" aria-hidden="true">
                      <GaugeIcon />
                    </div>
                    <h3 className="ds-tile__title" style={{ marginTop: "0.9rem" }}>
                      Read back against the posting
                    </h3>
                    <p className="ds-tile__copy" style={{ marginTop: "0.6rem" }}>
                      Every draft is scored on what a reviewer checks first:
                      relevant experience, the skills named in the ad, and how
                      clearly the two are connected. Gaps are listed so you can
                      fix them before you send, not after the rejection. Switch
                      on ATS optimisation and the draft shifts toward phrasing
                      parsers handle cleanly.
                    </p>
                    <ul className="ds-tile__points">
                      <li>Strength score</li>
                      <li>Named gaps</li>
                      <li>ATS optimisation</li>
                    </ul>
                  </div>

                  <div className="ds-bars">
                    {[
                      { label: "Keywords", value: 91, delay: "0.05s" },
                      { label: "Experience", value: 84, delay: "0.15s" },
                      { label: "Skills", value: 78, delay: "0.25s" },
                      { label: "Clarity", value: 88, delay: "0.35s" },
                    ].map((row) => (
                      <div key={row.label} className="ds-bars__row">
                        <span>{row.label}</span>
                        <span className="ds-bars__track">
                          <span
                            className="ds-bars__fill"
                            style={{
                              width: `${row.value}%`,
                              animationDelay: row.delay,
                            }}
                          />
                        </span>
                        <span className="ds-bars__num">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <article className="ds-tile ds-reveal">
                <div className="ds-tile__icon" aria-hidden="true">
                  <PenIcon />
                </div>
                <h3 className="ds-tile__title">Cover letters with a pulse</h3>
                <p className="ds-tile__copy">
                  Letters that answer the posting in your own register, instead
                  of four paragraphs of enthusiasm that could be addressed to
                  anyone.
                </p>
                <p className="ds-mono ds-tile__meta">Per application</p>
              </article>

              <article className="ds-tile ds-reveal">
                <div className="ds-tile__icon" aria-hidden="true">
                  <GridIcon />
                </div>
                <h3 className="ds-tile__title">Applications, tracked</h3>
                <p className="ds-tile__copy">
                  Every posting, draft and document filed against the company
                  you sent it to, with a dashboard that shows where the search
                  actually stands.
                </p>
                <p className="ds-mono ds-tile__meta">Dashboard &amp; metrics</p>
              </article>

              <article className="ds-tile ds-reveal">
                <div className="ds-tile__icon" aria-hidden="true">
                  <KeyIcon />
                </div>
                <h3 className="ds-tile__title">Your models, your keys</h3>
                <p className="ds-tile__copy">
                  Pick OpenAI or Gemini per account and bring your own API key.
                  Keys are encrypted before they are stored and never leave your
                  account.
                </p>
                <p className="ds-mono ds-tile__meta">Bring your own key</p>
              </article>

              <article className="ds-tile ds-reveal">
                <div className="ds-tile__icon" aria-hidden="true">
                  <PageIcon />
                </div>
                <h3 className="ds-tile__title">Typeset PDFs</h3>
                <p className="ds-tile__copy">
                  Drafts render into clean, typeset PDFs through the built-in
                  templates, ready to attach the moment you are happy with them.
                </p>
                <p className="ds-mono ds-tile__meta">Export &amp; send</p>
              </article>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- Questions */}
        <section id="questions" className="ds-section">
          <div className="ds-shell ds-shell--ruled">
            <div className="ds-marker">
              <span className="ds-marker__no">03</span>
              <span className="ds-marker__label">Questions</span>
              <span className="ds-marker__line" />
            </div>

            <div className="ds-section__head ds-reveal">
              <h2 className="ds-section__title">Before you sign up.</h2>
            </div>

            <div className="ds-faq">
              {FAQ.map((item) => (
                <details key={item.q} className="ds-faq__item">
                  <summary className="ds-faq__q">
                    {item.q}
                    <span className="ds-faq__sign" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="ds-faq__a">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- Closer */}
        <section className="ds-section" style={{ paddingTop: 0 }}>
          <div className="ds-shell">
            <div className="ds-closer ds-reveal">
              <p className="ds-mono">Next opening</p>
              <h2 className="ds-closer__title">
                Spend the evening applying, not <span className="ds-em">reformatting</span>.
              </h2>
              <p className="ds-closer__note">
                Set up your profile once and the next application takes minutes.
                Free to start, and your account is yours to export or delete
                whenever you want.
              </p>
              <div className="ds-closer__cta">
                <Link href="/auth/register" className="ds-btn ds-btn--signal">
                  Create your account
                  <span className="ds-btn__arrow" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
                <Link href="/auth/login" className="ds-btn ds-btn--ghost">
                  I already have one
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="ds-foot">
        <div className="ds-shell">
          <div className="ds-foot__grid">
            <div>
              <div className="ds-wordmark">
                <span className="ds-wordmark__mark" aria-hidden="true">
                  JS
                </span>
                <span className="ds-wordmark__name">Job Search Assistant</span>
              </div>
              <p className="ds-foot__blurb">
                An AI workspace for the part of the job search nobody enjoys:
                tailoring the same history to one more posting, and remembering
                where it went.
              </p>
            </div>

            <div className="ds-foot__col">
              <h3>Product</h3>
              <ul>
                <li>
                  <Link href="#method">How it works</Link>
                </li>
                <li>
                  <Link href="#toolkit">Toolkit</Link>
                </li>
                <li>
                  <Link href="#questions">Questions</Link>
                </li>
              </ul>
            </div>

            <div className="ds-foot__col">
              <h3>Account</h3>
              <ul>
                <li>
                  <Link href="/auth/register">Create an account</Link>
                </li>
                <li>
                  <Link href="/auth/login">Log in</Link>
                </li>
                <li>
                  <Link href="/auth/forgot-password">Reset password</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="ds-foot__bar">
            <p className="ds-mono">
              &copy; {year} Job Search Assistant
            </p>
            <p className="ds-mono">Fraunces &middot; Archivo &middot; Space Mono</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* --------------------------------------------------------------------- Icons */

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function GaugeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21a9 9 0 1 1 9-9" />
      <path d="m12 12 5-3" />
      <circle cx="12" cy="12" r="1.2" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 17.5h7" />
      <path d="M17.5 14v7" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m10.8 12.2 8.7-8.7" />
      <path d="m17 6 2.5 2.5" />
    </svg>
  );
}

function PageIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}
