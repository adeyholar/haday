import { createFileRoute } from "@tanstack/react-router";
import { TranslationLabPage } from "@/components/translation-lab";

export const Route = createFileRoute("/iibs/lab")({
  component: ScriptureTranslationLab,
});

function ScriptureTranslationLab() {
  return <TranslationLabPage path="iibs" />;
}
