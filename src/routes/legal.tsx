import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLockup } from "@/components/brand-lockup";
import { Panel } from "@/components/panel";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/legal")({ component: LegalPage });

const CONTACT = "talk2pastoradeolaade@yahoo.com";
const EFFECTIVE = "6 September 2026";

function LegalPage() {
  const { user } = useCurrentUserState();
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <div className="mb-6 flex justify-center">
        <BrandLockup size="hero" />
      </div>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · BIBL 630</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Privacy and disclaimer</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          Effective {EFFECTIVE}. HaDay is a Biblical Hebrew class site. We do not sell your information.
          This page is how we use it, and the limits of what the site is. It is not legal advice.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Who runs HaDay</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          HaDay is operated by Adeola Adegbolagun (Crown Ha’Day) from Indiana, United States, for
          BIBL 630 Biblical Hebrew I. Contact for privacy or account requests:{" "}
          <a className="font-semibold text-primary underline-offset-4 hover:underline" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
          .
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">What we collect</h2>
        <ul className="mt-3 list-disc space-y-2 ps-5 text-sm leading-relaxed text-muted">
          <li>Name, email, and how you signed in (email and password, Google, or X).</li>
          <li>Study progress: week, streak, drills, quizzes, handwriting samples, feature ideas you send.</li>
          <li>Sign-in sessions so you stay signed in on this device.</li>
          <li>Approximate country from the network address on Azure, for the course owner’s roster only.</li>
          <li>
            An anonymous visitor id in the browser (no name or email) so the owner can see that someone
            opened the site.
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Password hashes stay on our database. We never store your Google or X password. Mail we send
          (confirm the address, reset a password) goes through the class mailbox.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">How we use it — we do not sell it</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          We use this to run the class: keep your score with you, confirm you own the email, reset a
          forgotten password, and let the course owner see who is in the class. We do{" "}
          <strong className="font-semibold text-ink">not sell</strong> personal data. We do not share it
          with advertisers. We do not use it for unrelated marketing.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Hosting is on Azure. Sign-in with Google or X uses those companies only if you tap that button.
          Outbound mail uses Gmail (or another mailer the owner configures).
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Your choices</h2>
        <ul className="mt-3 list-disc space-y-2 ps-5 text-sm leading-relaxed text-muted">
          <li>Ask what we hold on your account, or ask us to delete it, at the contact above.</li>
          <li>The course owner can remove an account from the class roster. That deletes progress and sessions.</li>
          <li>Sign out from the header when you are done on a shared computer.</li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          HaDay is for learners 13 and older. We do not knowingly keep accounts for younger children. If
          you believe a child created an account, write to the contact and we will remove it.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Local and international law</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The site is run from Indiana, United States. Classmates may open it from other countries as it
          grows. Laws on education, religion, data, and internet use differ by place. You are responsible
          for whether using HaDay is allowed where you live. If it is not, do not use the site.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Hebrew here is academic: first-year Biblical Hebrew for a course. Scripture text is public-domain
          (Westminster Leningrad Codex and World English Bible). Class notes follow the course, not a
          photocopy of a copyrighted textbook.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Disclaimer</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          HaDay is an educational tool. It is <strong className="font-semibold text-ink">not legal advice</strong>,
          not pastoral counsel, not medical or financial advice, and not an official university, church, or
          government portal. Honor badges and scores are for class motivation only.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We work to keep accounts and data reasonably secure, but no site is perfectly safe. Use a password
          you do not reuse. Confirm the email we send so a made-up address cannot keep an account.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          This page describes our practice. It is not a contract with every regulator on earth, and it does
          not create rights beyond applicable law. We may update it when the class site changes. The date
          at the top is the current version.
        </p>
      </Panel>

      <p className="mt-5 text-center text-sm">
        {user ? (
          <Link to="/" className="font-semibold text-primary underline-offset-4 hover:underline">
            Back to class
          </Link>
        ) : (
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        )}
      </p>
    </main>
  );
}
