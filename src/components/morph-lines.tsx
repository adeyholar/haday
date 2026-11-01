import { morphLines } from "@/lib/morph-parse";

/** Stem, form, person, and state. The raw code stays beside this. */
export function MorphLines({ code }: { code: string }) {
  const lines = code ? morphLines(code) : [];
  if (!lines.length) return null;
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {lines.map((line, index) => (
        <div key={`${line.label}-${line.value}-${index}`}>
          <dt className="text-muted">{line.label}</dt>
          <dd className="text-ink">{line.value}</dd>
        </div>
      ))}
    </dl>
  );
}
