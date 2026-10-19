import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Panel } from "@/components/panel";
import { PublicFooter, PublicReturn } from "@/components/public-footer";
import {
  METHOD_DATE,
  METHOD_DESCRIPTION,
  METHOD_FAQS,
  METHOD_H1,
  METHOD_JSON_LD,
  METHOD_STEPS,
  METHOD_TITLE,
  METHOD_URL,
} from "@/lib/vocab-method";
import { shareMeta } from "@/lib/seo";

export const Route = createFileRoute("/how-to-memorize-biblical-hebrew-vocabulary")({
  head: () => ({
    meta: shareMeta(METHOD_TITLE, METHOD_DESCRIPTION, "/how-to-memorize-biblical-hebrew-vocabulary", { type: "article" }),
    links: [{ rel: "canonical", href: METHOD_URL }],
  }),
  component: MethodPage,
});

function MethodPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <PublicReturn />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(METHOD_JSON_LD) }} />
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · method</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">{METHOD_H1}</h1>
      <p className="mt-3 text-sm text-muted">
        <Link to="/about" className="font-semibold text-primary underline-offset-4 hover:underline">
          Adeola "Ade" Adegbolagun
        </Link>{" "}
        is a prophetic teacher with an itinerant ministry, leads Fathers' Faith International Ministries, and
        created HaDay HebRabbAi Mentor to help readers meet God in the Hebrew text. Published {METHOD_DATE}. This
        page is free to read. The lessons stay behind sign-in.
      </p>
      <p className="mt-4 max-w-prose leading-relaxed text-muted">
        This is how to memorize Biblical Hebrew vocabulary so the words stay. Learn the most frequent words, hear
        each one before you see its meaning, review a little every day, and read those words in real verses early.
      </p>

      <Section title="What is the fastest way to memorize Biblical Hebrew vocabulary?">
        <p>
          The fastest durable way is five steps, in this order. Speed here means words that stay, not a list you
          recognize only on the night you studied it.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          {METHOD_STEPS.map((step) => (
            <li key={step.name}>
              <span className="font-semibold text-ink">{step.name}.</span> {step.text}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="How many Hebrew words do I need to read the Bible?">
        <p>
          You do not need every word in the lexicon before a verse becomes readable. A small set of very common words
          covers a large share of the text.
        </p>
        <p>
          The Frequency Dictionary of the Hebrew Bible at Brigham Young University says the top twenty-eight Hebrew
          words, and verbal roots, make up about 50 percent of all words in the Hebrew Bible. That is a count of
          running words in the text, not a promise that twenty-eight flashcards will make you fluent.
        </p>
        <p>
          A longer list is still a short list next to the whole Bible. The Schwartz–Groves Westminster Hebrew
          Vocabulary deck says it holds 686 Hebrew words, excluding proper names, and that these are the words that
          occur 47 or more times. The list’s own note says that cutoff was chosen because, on their count, it gives
          about 90 percent recognition of the words in the Hebrew Bible. Those figures are theirs. This page does not
          remeasure them.
        </p>
        <p>
          A running-word percentage is easy to misread. If twenty-eight items cover about half the tokens, that is
          because a few words, such as “and,” “to,” and “he said,” appear constantly. They are not half of the ideas
          in a chapter. You will still meet names, rare nouns, and verb forms the short list did not drill. The
          686-word list excludes proper names on purpose. A story will still stop you on a name. Learn that name when
          the verse needs it. Do not pretend the percentage already includes it.
        </p>
        <p>
          Van Pelt and Pratico also publish a vocabulary guide arranged by how often the words occur, beside the
          grammar’s chapter lists. Use it as a second shelf, not as a rival course. If a word is in this week’s
          chapter, learn it this week, even if a frequency list would have saved it for later.
        </p>
        <p>
          Recognition is not the same as being able to parse a verb or explain a clause. It means you have met the
          word often enough to know what it is doing in the line. The work is that meeting, repeated.
        </p>
      </Section>

      <Section title="Frequency list or textbook chapter: which should I follow?">
        <p>
          Follow both, for different jobs. Use the textbook chapter while you are in class. Use frequency when the
          goal is reading the Bible.
        </p>
        <p>
          A chapter list is the vocabulary your course will test. Skipping it to chase a frequency list leaves you
          unprepared for that week. A frequency list is the vocabulary the Tanakh itself repeats. Skipping it leaves
          you able to pass a quiz and still stuck in a narrative chapter.
        </p>
        <p>
          On HaDay, the Grammar Path keeps the class words in the order of <em>Basics of Biblical Hebrew</em> by
          Pratico and Van Pelt. The Scripture Path is a reading ladder, Levels A through E, then free reading in the
          Reading Lab. One path does not replace the other.
        </p>
      </Section>

      <Section title="Why hear a word before you see its meaning?">
        <p>
          Hear the Hebrew first. Then recall the meaning. If you read the English first, you train yourself to
          translate a gloss. If you hear the word first, you train yourself to recognize the word.
        </p>
        <p>
          That is the order of a HaDay study card. The audio plays, the pointed word is there, and the meaning stays
          hidden until you ask for it or you answer. A miss comes back in the same sitting. The first answer is the
          one that counts.
        </p>
        <p>
          Hearing does not replace writing. It comes before writing. Say the word, then type it, then meet it in a
          line. A student who only listens will recognize a voice and still freeze when the consonants are on the
          page.
        </p>
      </Section>

      <Section title="How do Hebrew roots help?">
        <p>
          Most Hebrew words are built on three letters. Learn those letters and a new form is a relative of a word
          you already know.
        </p>
        <p>
          Take the letters dalet, bet, resh. The noun <span lang="he">דָּבָר</span> means a word or a thing. The verb
          from the same letters means to speak. You are not memorizing two unrelated items. You are memorizing one
          family. When a verse uses another form from those letters, you already have a place to put it.
        </p>
        <p>
          A root is a memory hook, not a full definition. Words in the same family can move. Check the gloss in the
          verse. Do not force one English word onto every form.
        </p>
      </Section>

      <Section title="How often should I review?">
        <p>
          Review a little every day. Ten or fifteen minutes of words you missed will do more than a two-hour session
          once a week.
        </p>
        <p>
          Hermann Ebbinghaus showed that a memory fades if you never meet it again. The practical form of that
          finding is spaced repetition: see the word, wait, see it again before it is gone, then wait longer when it
          holds. This page does not quote a forgetting percentage. The useful rule is shorter sessions, more days.
        </p>
        <p>
          In a HaDay sitting, a miss is not finished. The card returns. A word you already know is not drilled into
          the ground that day. That is the same idea as a spaced list, kept inside one week’s work.
        </p>
      </Section>

      <Section title="When should I start reading real verses?">
        <p>
          Start as soon as a small set of words is familiar. Waiting until the vocabulary feels complete is how
          students finish a year and still cannot read a verse.
        </p>
        <p>
          A graded ladder is safer than opening a hard chapter on the first day. The Scripture Path moves through
          Levels A, B, C, D, and E. Each level is split into weeks so one sitting is a list you can finish. After
          those levels, the Reading Lab is free reading in the Tanakh: hear the verse, follow the words, and tap a
          word you do not know.
        </p>
        <p>
          Read with the audio on. The point is to meet a word you studied, inside a real line, while someone is
          saying it. A gloss in a list and a gloss in a verse are not the same memory. If the line uses a form you
          have not drilled, do not stop the week. Note the form, finish the verse, and bring that form back in the
          next short review. A reading is allowed to be slow. It is not allowed to be a hunt through an
          answer key. The key is not on this site. The work is the point.
        </p>
      </Section>

      <Section title="A simple weekly plan">
        <p>Use the class week as the unit. Do not turn the whole vocabulary into one sitting.</p>
        <p>
          Keep the same hour if you can. A student who reviews after breakfast remembers the slot, and the slot
          remembers the student. If a day is lost, do the short review the next day. Do not double the list to
          “catch up.” A doubled list becomes a cram, and a cram is the thing this plan is avoiding.
        </p>
        <table className="mt-3 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink">
              <th className="py-2 pr-3 font-semibold">When</th>
              <th className="py-2 font-semibold">What to do</th>
            </tr>
          </thead>
          <tbody className="text-muted">
            <tr className="border-b border-line">
              <td className="py-2 pr-3">Each class day</td>
              <td className="py-2">Hear that week’s words, then recall the meaning. Keep the chapter order.</td>
            </tr>
            <tr className="border-b border-line">
              <td className="py-2 pr-3">Every day</td>
              <td className="py-2">Ten to fifteen minutes on words you missed. Stop while you can still attend.</td>
            </tr>
            <tr className="border-b border-line">
              <td className="py-2 pr-3">Twice a week</td>
              <td className="py-2">A closed-book check. The first answer is the grade. A miss returns.</td>
            </tr>
            <tr>
              <td className="py-2 pr-3">Once a week</td>
              <td className="py-2">A short reading on the Scripture Path, then one passage in the Reading Lab.</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title="Practice with HaDay">
        <p>
          HaDay HebRabbAi Mentor is a Biblical Hebrew vocabulary trainer. The Grammar Path
          is the class vocabulary and the games, in the order of the textbook. The Scripture Path is the leveled
          reading ladder. You choose one path. It stays with the account. The home page is those two doors. Start
          the Grammar Path if you are in the class. Start the Scripture Path if you are learning by reading. Either
          way you sign in once, and the record stays with that account.
        </p>
        <p>Lessons and checks are behind sign-in. This guide is not.</p>
        <p className="flex flex-wrap gap-3">
          <Link to="/" className="font-semibold text-primary underline-offset-4 hover:underline">
            Start the Grammar Path
          </Link>
          <Link to="/" className="font-semibold text-primary underline-offset-4 hover:underline">
            Start the Scripture Path
          </Link>
        </p>
      </Section>

      <Section title="Questions">
        {METHOD_FAQS.map((item) => (
          <div key={item.q} className="mt-3">
            <h3 className="font-semibold text-ink">{item.q}</h3>
            <p className="mt-1">{item.a}</p>
          </div>
        ))}
      </Section>

      <Section title="Sources">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Brigham Young University, “About the Frequency Dictionary of the Hebrew Bible.” The top twenty-eight
            words and verbal roots are about 50 percent of the words in the Hebrew Bible.{" "}
            <a className="font-semibold text-primary underline-offset-4 hover:underline" href="https://hebrewbible.byu.edu/about-frequency-dictionary">
              hebrewbible.byu.edu
            </a>
          </li>
          <li>
            Schwartz–Groves Westminster Hebrew Vocabulary, described on the Anki deck maintained for Westminster
            Theological Seminary. 686 words, excluding proper names, occurring 47 or more times, chosen for about
            90 percent recognition on that list’s count.{" "}
            <a className="font-semibold text-primary underline-offset-4 hover:underline" href="https://ankiweb.net/shared/info/819202036">
              ankiweb.net
            </a>
          </li>
          <li>
            Gary D. Pratico and Miles V. Van Pelt, <em>Basics of Biblical Hebrew Grammar</em> (Zondervan). The class
            textbook. HaDay is not affiliated with the authors or the publisher.
          </li>
          <li>
            Miles V. Van Pelt and Gary D. Pratico, <em>The Vocabulary Guide to Biblical Hebrew</em> (Zondervan). A
            frequency list many students already use beside the grammar.
          </li>
          <li>
            Hermann Ebbinghaus, on memory fading without review. Named here only for the idea of spaced review. No
            percentage from that research is used on this page.
          </li>
        </ul>
        <p className="mt-3 text-sm">The address of this page is {METHOD_URL}.</p>
      </Section>
      <PublicFooter />
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel className="mb-3 mt-4">
      <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </Panel>
  );
}
