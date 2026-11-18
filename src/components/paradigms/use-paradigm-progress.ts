import { useEffect, useRef, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { readLocalProgress, writeLocalProgress } from "@/lib/paradigms/local";
import { getParadigmsAccess, loadParadigmProgress, saveParadigmProgress } from "@/lib/paradigms/progress";
import { acceptStudentSave } from "@/lib/paradigms/progress-shape";
import { EMPTY_PROGRESS, type ParadigmProgress } from "@/lib/paradigms/types";

function emptyProgress(): ParadigmProgress {
  return { ...EMPTY_PROGRESS, boxes: {}, skips: [] };
}

let accessPromise: Promise<boolean> | null = null;

function loadAccess(): Promise<boolean> {
  accessPromise ??= getParadigmsAccess()
    .then((row) => row.enabled === true)
    .catch(() => false);
  return accessPromise;
}

export function useParadigmAccess() {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancel = false;
    loadAccess()
      .then((on) => {
        if (!cancel) setEnabled(on);
      })
      .finally(() => {
        if (!cancel) setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, []);

  return { enabled, ready };
}

export function useParadigmProgress() {
  const { user } = useCurrentUserState();
  const userId = user?.id ?? "";
  const { enabled, ready: accessReady } = useParadigmAccess();
  const [progress, setProgress] = useState<ParadigmProgress>(emptyProgress);
  const progressRef = useRef(progress);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const userRef = useRef(userId);
  userRef.current = userId;

  useEffect(() => {
    if (!userId) {
      const blank = emptyProgress();
      progressRef.current = blank;
      setProgress(blank);
      return;
    }
    const local = readLocalProgress(userId);
    progressRef.current = local;
    setProgress(local);
    if (!enabled) return;
    let cancel = false;
    loadParadigmProgress()
      .then((remote) => {
        if (cancel || !remote) return;
        const merged = mergeLoad(readLocalProgress(userId), remote);
        progressRef.current = merged;
        writeLocalProgress(userId, merged);
        setProgress(merged);
      })
      .catch(() => {
        /* Unauthorized or offline: keep this account's local copy. */
      });
    return () => {
      cancel = true;
    };
  }, [userId, enabled]);

  function update(recipe: (current: ParadigmProgress) => ParadigmProgress): Promise<void> {
    const id = userRef.current;
    if (!id) return Promise.resolve();
    const run = chain.current.then(async () => {
      const stamped = acceptStudentSave(progressRef.current, {
        ...recipe(progressRef.current),
        updatedAt: new Date().toISOString(),
      });
      progressRef.current = stamped;
      writeLocalProgress(id, stamped);
      setProgress(stamped);
      if (!enabled) return;
      try {
        const saved = await saveParadigmProgress({ data: stamped });
        const accepted = acceptStudentSave(stamped, saved);
        progressRef.current = accepted;
        writeLocalProgress(id, accepted);
        setProgress(accepted);
      } catch {
        /* The local copy for this account is enough while offline. */
      }
    });
    chain.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  return { enabled, ready: accessReady, progress, update };
}

function mergeLoad(local: ParadigmProgress, remote: ParadigmProgress): ParadigmProgress {
  const remoteTime = Date.parse(remote.updatedAt) || 0;
  const localTime = Date.parse(local.updatedAt) || 0;
  if (remoteTime >= localTime) return remote;
  return acceptStudentSave(remote, local);
}
