import { cn } from "@/lib/cn";

export function AlivePet({ talking, name }: { talking: boolean; name: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn("alive-pet", talking && "is-talking")} aria-hidden>
        <span className="alive-pet-ear alive-pet-ear-l" />
        <span className="alive-pet-ear alive-pet-ear-r" />
        <span className="alive-pet-head">
          <span className="alive-pet-eye alive-pet-eye-l" />
          <span className="alive-pet-eye alive-pet-eye-r" />
          <span className="alive-pet-mouth" />
        </span>
        <span className="alive-pet-body" />
      </div>
      <p className="mt-2 font-display text-xl font-bold text-ink">{name}</p>
    </div>
  );
}
