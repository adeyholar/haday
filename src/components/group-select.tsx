export type GroupSelectOption = { value: string; label: string };
export type GroupSelectGroup = { label: string; options: GroupSelectOption[] };

export function GroupSelect({
  title,
  value,
  options,
  groups,
  onChange,
}: {
  title: string;
  value: string;
  options?: GroupSelectOption[];
  groups?: GroupSelectGroup[];
  onChange: (value: string) => void;
}) {
  const grouped: GroupSelectGroup[] = groups ?? [{ label: "", options: options ?? [] }];

  return (
    <label className="block">
      <span className="block font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">{title}</span>
      <select
        className="mt-3 min-h-12 w-full rounded-[var(--radius-md)] bg-card px-3 text-base font-semibold text-ink shadow-[var(--shadow-border)]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {grouped.map((g) => {
          const items = g.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ));
          if (!g.label) return items;
          return (
            <optgroup key={g.label} label={g.label}>
              {items}
            </optgroup>
          );
        })}
      </select>
    </label>
  );
}
