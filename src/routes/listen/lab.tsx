import { createFileRoute } from "@tanstack/react-router";
import { TranslationLabPage } from "@/components/translation-lab";

export const Route = createFileRoute("/listen/lab")({
  component: GrammarTranslationLab,
});

function GrammarTranslationLab() {
  return <TranslationLabPage path="bbh" />;
}
