import { useEffect, useRef, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { paradigmsV1ForEmail } from "@/lib/paradigms/flag";
import { readLocalProgress, writeLocalProgress } from "@/lib/paradigms/local";
import { loadParadigmProgress, saveParadigmProgress } from "@/lib/paradigms/progress";
import { mergeStudentSave, sanitizeProgress } from "@/lib/paradigms/progress-shape";
import type { ParadigmProgress } from "@/lib/paradigms/types";

export function useParadigmsEnabled(): boolean {
  const { user, isPending } = useCurrentUserState();
  if (isPending || !user) return false;
  return paradigmsV1ForEmail(user.primaryEmail);
}

export function useParadigmProgress() {
  const enabled = useParadigmsEnabled();
  const [progress, setProgress] = useState<ParadigmProgress>(() => readLocalProgress());
  const [ready, setReady] = useState(false);
  const progressRef = useRef(progress);
  const chain = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!enabled) return;
    let cancel = false;
    loadParadigmProgress()
      .then((remote) => {
        if (cancel) return;
        if (remote) {
          const merged = mergeLoad(progressRef.current, remote);
          progressRef.current = merged;
          writeLocalProgress(merged);
          setProgress(merged);
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancel) setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, [enabled]);

  function update(recipe: (current: ParadigmProgress) => ParadigmProgress): Promise<void> {
    const run = chain.current.then(async () => {
      const stamped = sanitizeProgress({ ...recipe(progressRef.current), updatedAt: new Date().toISOString() });
      progressRef.current = stamped;
      writeLocalProgress(stamped);
      setProgress(stamped);
      try {
        const saved = await saveParadigmProgress({ data: stamped });
        progressRef.current = saved;
        writeLocalProgress(saved);
        setProgress(saved);
      } catch {
        /* The local copy is enough while offline. */
      }
    });
    chain.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  return { enabled, progress, ready: enabled ? ready : true, update };
}

function mergeLoad(local: ParadigmProgress, remote: ParadigmProgress): ParadigmProgress {
  const remoteTime = Date.parse(remote.updatedAt) || 0;
  const localTime = Date.parse(local.updatedAt) || 0;
  if (remoteTime >= localTime) return remote;
  return mergeStudentSave(remote, local);
}
