import { useEffect, useState } from "react";
import { readTerm, subscribeTerm, type GrammarTerm } from "@/lib/path";

/** The semester the shell already published. Do not ask the server again. */
export function useOpenTerm(): GrammarTerm {
  const [term, setTerm] = useState<GrammarTerm>(() => readTerm());
  useEffect(() => subscribeTerm(setTerm), []);
  return term;
}
