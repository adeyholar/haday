import { useState } from "react";
import { Panel } from "@/components/panel";
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
        <Panel className="mt-3 text-center">
          <p className="try-flash text-lg font-bold uppercase tracking-wide text-danger">
            Try again
          </p>
          <p className="mt-1 text-sm font-medium text-ink">Attempt it before I tell you.</p>
        </Panel>
      ) : null}
      <Button type="button" variant="outline" size="lg" className="mt-3 w-full text-lg font-bold" onClick={tap}>
        Tell me
      </Button>
    </>
  );
}
