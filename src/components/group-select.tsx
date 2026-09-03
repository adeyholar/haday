export function GroupSelect({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">{title}</span>
      <select
        className="mt-3 min-h-12 w-full rounded-[var(--radius-md)] bg-card px-3 text-base font-semibold text-ink shadow-[var(--shadow-border)]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
