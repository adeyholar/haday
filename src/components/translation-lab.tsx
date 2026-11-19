import { useEffect, useState, type ComponentType } from "react";
import { translationLabEnabled } from "@/lib/translation-lab/flag";

type LabPath = "bbh" | "iibs";

// The verse module is reached only when the build flag is on, so a flag-off bundle drops the answer key.
const loadOpenLab =
  import.meta.env.VITE_TRANSLATION_LAB === "true" ? () => import("@/components/translation-lab-open") : null;

function ClosedLab() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10" data-lab-open="0">
      <p className="text-sm text-muted">This lab is closed.</p>
    </main>
  );
}

function LiveLab({ path }: { path: LabPath }) {
  const [Comp, setComp] = useState<ComponentType<{ path: LabPath }> | null>(null);
  useEffect(() => {
    if (!loadOpenLab) return;
    let live = true;
    void loadOpenLab().then((mod) => {
      if (live) setComp(() => mod.OpenLab);
    });
    return () => {
      live = false;
    };
  }, []);
  if (!Comp) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-10" data-lab-open="1">
        <p className="text-sm text-muted">Opening the lab.</p>
      </main>
    );
  }
  return <Comp path={path} />;
}

export function TranslationLabPage({ path }: { path: LabPath }) {
  if (import.meta.env.VITE_TRANSLATION_LAB !== "true" || !translationLabEnabled()) {
    return <ClosedLab />;
  }
  return <LiveLab path={path} />;
}
