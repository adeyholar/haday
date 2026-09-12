import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLockup } from "@/components/brand-lockup";
import { Panel } from "@/components/panel";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/credits")({ component: CreditsPage });

function CreditsPage() {
  const { user } = useCurrentUserState();
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <div className="mb-6 flex justify-center">
        <BrandLockup size="hero" />
      </div>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · BIBL 630</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Credits</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          HaDay is a class tool. The Hebrew you hear and the verses you read come from people and
          projects who put them in the open for study. This page names them.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Hebrew reading</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Tanakh chapters are read by <strong className="font-semibold text-ink">Abraham Shmuelof</strong>.
          The recordings are ℗ 1992 Talking Bibles International, used as hosted for study by{" "}
          <a
            className="font-semibold text-primary underline-offset-4 hover:underline"
            href="https://mechon-mamre.org"
            target="_blank"
            rel="noreferrer"
          >
            Mechon Mamre
          </a>
          . Permission to reuse the files for other sites is theirs:{" "}
          <a
            className="font-semibold text-primary underline-offset-4 hover:underline"
            href="https://www.talkingbibles.org"
            target="_blank"
            rel="noreferrer"
          >
            Talking Bibles
          </a>
          . We use them here for class listening and follow-along, not as our own recording.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Hebrew text</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The pointed text is the <strong className="font-semibold text-ink">Westminster Leningrad Codex</strong>,
          public domain, by the J. Alan Groves Center. We read it through the{" "}
          <a
            className="font-semibold text-primary underline-offset-4 hover:underline"
            href="https://hb.openscriptures.org"
            target="_blank"
            rel="noreferrer"
          >
            Open Scriptures Hebrew Bible
          </a>{" "}
          (morphology CC BY 4.0). Word tags on Tanakh cards (qal, construct, shewa…) come from that morphology.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">English</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Verse English is the <strong className="font-semibold text-ink">World English Bible</strong>, public
          domain. It is a teaching gloss beside the Hebrew, not a replacement for class exegesis.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Isolated vocabulary audio</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Where Listen plays a single lemma (not a sentence cut), the clip is from the{" "}
          <strong className="font-semibold text-ink">Open Hebrew Bible Project</strong> by Eliran Wong (CC BY-NC
          4.0). Class Voice-bank recordings play first when the owner has recorded that word.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Follow-along timing</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Word highlighting is aligned with the{" "}
          <a
            className="font-semibold text-primary underline-offset-4 hover:underline"
            href="https://montreal-forced-aligner.readthedocs.io"
            target="_blank"
            rel="noreferrer"
          >
            Montreal Forced Aligner
          </a>{" "}
          (Kaldi). The acoustic model is a public English ARPA model used as a teaching aligner, not a claim
          that the reader spoke English.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">What is HaDay’s</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Class path, games, pictures, and notes are for BIBL 630. Pictures are original classroom plates, not
          stock photos. Vocabulary order follows <em>Basics of Biblical Hebrew</em>, 3rd ed., for the course;
          we do not copy the textbook. Grammar explanations use public-domain tradition (Gesenius, Davidson)
          and Tanakh examples — not a photocopy of a copyrighted grammar.
        </p>
      </Panel>

      <p className="mt-5 text-center text-sm">
        <Link to="/legal" className="font-semibold text-primary underline-offset-4 hover:underline">
          Privacy and disclaimer
        </Link>
        {" · "}
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
