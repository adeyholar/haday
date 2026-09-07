import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DontKnowButton({
  onClick,
  onNudge,
  usedTry = false,
}: {
  onClick: () => void;
  onNudge?: () => void;
  usedTry?: boolean;
}) {
  const [asked, setAsked] = useState(false);
  const waiting = asked && !usedTry;

  function tap() {
    if (!usedTry && !asked) {
      setAsked(true);
      onNudge?.();
      return;
    }
    onClick();
  }

  return (
    <>
      {waiting ? (
        <>
          <p className="try-flash mt-3 text-center text-lg font-bold uppercase tracking-wide text-danger">
            One more try
          </p>
          <p className="mt-1 text-center text-sm font-medium text-ink">Attempt it before I tell you.</p>
        </>
      ) : null}
      <Button type="button" variant="outline" size="lg" className="mt-3 w-full text-lg font-bold" onClick={tap}>
        Tell me
      </Button>
    </>
  );
}
