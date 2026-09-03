import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Library } from "lucide-react";
import { Panel } from "@/components/panel";

export const Route = createFileRoute("/guide")({ component: GuidePage });

function GuidePage() {
  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · Hebraic Mentor</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">How to use HaDay</h1>
        <p className="mt-3 max-w-prose text-muted">
          HaDay drills first-year Biblical Hebrew vocabulary from{" "}
          <em>Basics of Biblical Hebrew</em> (3rd ed.). Sign in so your game path and study
          scores stay with your account.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Two modes</h2>
        <ul className="mt-3 space-y-3 text-sm text-muted">
          <li>
            <Link to="/game" className="inline-flex items-center gap-1.5 font-semibold text-primary">
              <Compass className="size-4" />
              Game mode
            </Link>
            <span className="text-ink"> — </span>
            one path through chapters 1–19. Stages unlock in order. Use Continue. Game shows the citation lemma from the
            class book. The Game menu groups BBH vocabulary, Aleph-bet mastery, Syllables, Nouns, and Ultimate Challenge.
          </li>
          <li>
            <Link to="/" hash="study-mode" className="inline-flex items-center gap-1.5 font-semibold text-primary">
              <Library className="size-4" />
              Study mode
            </Link>
            <span className="text-ink"> — </span>
            pick a course week or a Game chapter — same BBH 3rd-ed. lemmas as Game — then Drill, Write, Quiz, Match, or Lex.
            Closed-book Exam is from memory; misses lead the next Write and Quiz rounds.
            Ultimate Challenge is optional: the whole Ch. 2–19 list in one sitting, graded at the end.
            Zakhor (Daily keep) is the short daily mix of words you have already met — due, weak, and older mastered
            lemmas — so new chapters do not bury the old ones. The Study menu groups Drill, Write, Quiz, Match, Lex,
            Alef-bet, Zakhor, and Guide. Listen has its own menu: class vocabulary, then Genesis 1–5 follow-along with the
            recorded Hebrew chapter audio (not a computer voice) and a grade at 90%. Ask HaDay Hebraic AI to clarify the
            lesson. Suggest a feature puts class ideas in the inventory for review — what makes sense gets planned and
            built.
          </li>
        </ul>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Game stages</h2>
        <p className="mt-2 text-sm text-muted">Clear all four to unlock the next chapter. Chapter 1 starts open.</p>
        <ol className="mt-3 space-y-2 text-sm">
          <Stage n="1" name="Recognize" body="Hebrew on the card. Pick the English gloss." />
          <Stage n="2" name="Gloss" body="Read the Hebrew. Type the English meaning." />
          <Stage
            n="3"
            name="Spell · lenient"
            body="Type the Hebrew with vowels. A Tanakh verse is shown — tap the card for English."
          />
          <Stage
            n="4"
            name="Spell · strict"
            body="Same typing, but the verse is hidden so you cannot copy from it."
          />
        </ol>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Listen · hands-free</h2>
        <p className="mt-2 text-sm text-muted">
          One continuous reading of the BBH list, made for the car. Each lemma is the Hebrew name, then the English —
          Avraham, then Abraham. No letter spelling. From chapter 1 (alef-bet) through 19. Modern Israeli pronunciation,
          lively woman voice when the phone has one. Default pace is Warm. Tap Play once; after that you can sit and
          listen. Jump to a chapter if you want a shorter stretch. Loop this chapter to stay on it, or loop the whole
          list. Keep the screen awake so the phone does not stop the voice. On iPad use Safari, volume up, Silent switch
          off.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Zakhor · Daily keep</h2>
        <p className="mt-2 text-sm text-muted">
          Not a dump of every mastered word. About twelve cards from the whole course: what is due, what you miss, and
          old lemmas that have been sitting cold. Hebrew and English faces mix. Finish it once a day.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Typing Hebrew</h2>
        <p className="mt-2 text-sm text-muted">Use the on-screen pad. Keys show the letter only — no English names.</p>
        <ol className="mt-3 list-decimal space-y-2 ps-5 text-sm text-ink">
          <li>Tap a consonant, then the vowel that sits on it.</li>
          <li>
            Shin and sin are separate keys: <span className="he-word text-xl">שׁ</span> and{" "}
            <span className="he-word text-xl">שׂ</span>.
          </li>
          <li>
            Dagesh is the dotted-circle key <span className="he-word text-xl">◌ּ</span> — tap it after the letter.
          </li>
          <li>
            Final forms <span className="he-word text-xl">ך ם ן ף ץ</span> must be used at the end of a word.
            A regular letter there is marked wrong.
          </li>
          <li>
            Shureq is its own key <span className="he-word text-xl">וּ</span>. Qibbuts{" "}
            <span className="he-word text-xl">◌ֻ</span> counts as the same vowel.
          </li>
        </ol>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">What counts as correct</h2>
        <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-ink">
          <li>Every consonant needs its own vowel — even on lenient.</li>
          <li>
            Patah <span className="he-word text-xl">◌ַ</span> is not qamets{" "}
            <span className="he-word text-xl">◌ָ</span>. Tsere{" "}
            <span className="he-word text-xl">◌ֵ</span> is not hireq{" "}
            <span className="he-word text-xl">◌ִ</span>.
          </li>
          <li>
            Some cards accept a listed alternate (plene/defective, a feminine form, or a known
            pointing of a name).
          </li>
          <li>
            If consonants are right but pointing is off, you will see:{" "}
            <span className="italic text-muted">Consonants are right — check vowels, dagesh, and dots.</span>
          </li>
        </ul>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Learn the letters first</h2>
        <p className="mt-2 text-sm text-muted">
          Study Write (Chapter 1) is the test. The lesson lives under{" "}
          <Link to="/alphabet" search={{ tab: "write", letter: "" }} className="font-semibold text-primary">
            Alef
          </Link>{" "}
          at the bottom of the screen:
        </p>
        <ol className="mt-3 list-decimal space-y-2 ps-5 text-sm text-ink">
          <li>See — tap a letter on the chart.</li>
          <li>Follow — copy the moving stroke. Passing copies are kept as your hand for later quizzes.</li>
          <li>My hand — save five traces so later grading follows your writing.</li>
          <li>Quiz, then Exam from memory.</li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          A miss on Write opens Practice under Alef for that letter. Follow the moving stroke; your copies grade later
          quizzes. Qof is not a Latin P. Vav stays between the two lines — a long stem below is final nun.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">How the path adapts</h2>
        <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-ink">
          <li>
            <strong>Look-alikes.</strong> A miss on he queues het, dalet queues resh, kaf queues bet, qamets queues
            pathach, shin queues sin. The twin comes due now — it is not marked wrong for you.
          </li>
          <li>
            <strong>Letters you do not know first.</strong> Write, My hand, and Alef Quiz all update how well you know
            each letter. The next round leads with the weak ones, not a fixed deck of twelve.
          </li>
          <li>
            <strong>Your hand.</strong> Follow the moving stroke. Five traces become one living shape plus a slightly
            kinder pass bar. If the ink matches a known-good shape, it still counts — a Latin T for kaf or a P for qof
            does not.
          </li>
          <li>
            <strong>Quiz and Match.</strong> Those decks sit near the edge of what you can do — not only the same easy
            lemmas.
          </li>
          <li>
            <strong>Class vocab stays the book form.</strong> Game, Quiz, and Match show the citation lemma (יָם, not
            בַּיָּם). A Tanakh verse can still sit under the card so you see the word in Scripture, but the prompt is
            the word from the list. Inflected forms belong in Syllables and Nouns, where that is the lesson.
          </li>
        </ul>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Study toolbox</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <Tool name="Drill" to="/drill" body="Flip cards. Grade yourself. SRS brings weak words back." />
          <Tool name="Write" to="/write" body="Type or hand-write the Hebrew. Memorize mode hides the lemma first. After a miss you can save that scribble as your handwriting." />
          <Tool name="Quiz" to="/quiz" body="Multiple choice or type the English gloss. Same BBH lemmas as class, sitting near what you can still miss." />
          <Tool name="Match" to="/match" body="Select the pair: Hebrew tile to English tile. Misses come back. Boards use the class lemmas." />
          <Tool name="Lex" to="/browse" body="Browse the week’s lemmas with verses." />
          <Tool name="Alef" to="/alphabet" body="The lesson for the letters: See → Follow the moving stroke → My hand → Quiz → Exam. Study Write is the test. Passing copies become your grader." />
        </dl>
        <p className="mt-4 text-sm text-muted">
          On Home, pick a course week before you drill. Weak cards can be focused from the Needs work list.
        </p>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">Rewards</h2>
        <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-ink">
          <li>Daily flame: study or play at least once a calendar day. Miss a day and it resets to 1.</li>
          <li>Win streak: consecutive game stages you clear. A poor replay can break it.</li>
          <li>Ladder: each BBH chapter is a rung. Clear all four stages to climb. 19 is the summit.</li>
          <li>Honor rank: Hearer → Catechumen → … → Masorete. It sits beside your name and on the class board. Clear a chapter to rise.</li>
        </ul>
        <p className="mt-3 text-sm">
          <Link to="/rewards" className="font-semibold text-primary">
            See your rewards
          </Link>
        </p>
      </Panel>

      <Panel>
        <h2 className="font-display text-2xl font-bold text-ink">Sound and save</h2>
        <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-ink">
          <li>The speaker in the header turns correct / incorrect sounds on or off.</li>
          <li>Progress saves to your signed-in account and survives a refresh.</li>
        </ul>
        <p className="mt-4 text-sm">
          <Link to="/game" className="font-semibold text-primary">
            Start Game mode
          </Link>
          <span className="text-muted"> · </span>
          <Link to="/" className="font-semibold text-primary">
            Back home
          </Link>
        </p>
      </Panel>
    </>
  );
}

function Stage({ n, name, body }: { n: string; name: string; body: string }) {
  return (
    <li className="rounded-[var(--radius-md)] bg-surface/80 px-3 py-2.5">
      <p className="font-semibold text-ink">
        <span className="tabular-nums text-primary">{n}.</span> {name}
      </p>
      <p className="mt-0.5 text-muted">{body}</p>
    </li>
  );
}

function Tool({ name, to, body }: { name: string; to: "/drill" | "/write" | "/quiz" | "/match" | "/browse" | "/alphabet"; body: string }) {
  return (
    <div>
      <dt>
        <Link to={to} className="font-semibold text-primary">
          {name}
        </Link>
      </dt>
      <dd className="text-muted">{body}</dd>
    </div>
  );
}
