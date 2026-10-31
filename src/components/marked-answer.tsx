import { markedLines } from "@/lib/marked-answer";
import { cn } from "@/lib/cn";

type Props = {
  ok: boolean;
  given?: string | null;
  answer: string;
};

function Line({ label, text, good }: { label: string; text: string; good: boolean }) {
  const hebrew = /[\u0590-\u05FF]/.test(text) && !/[A-Za-z]/.test(text);
  const taam = hebrew && /[\u0591-\u05AF\u05BD]/.test(text);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 font-semibold",
          good ? "text-good" : "text-danger",
          taam ? "he-taam text-3xl leading-[2.2]" : hebrew ? "he-word text-3xl" : "text-xl",
        )}
        dir={hebrew ? "rtl" : undefined}
        lang={hebrew ? "he" : undefined}
      >
        {text}
      </p>
    </div>
  );
}

export function MarkedAnswer({ ok, given, answer }: Props) {
  const lines = markedLines(ok, given, answer);
  if (!lines.answer && !lines.wrote) return null;
  return (
    <div className="mt-4 grid gap-3 text-center">
      {lines.wrote ? <Line label="You wrote" text={lines.wrote} good={false} /> : null}
      {lines.answer ? <Line label="Answer" text={lines.answer} good /> : null}
    </div>
  );
}
