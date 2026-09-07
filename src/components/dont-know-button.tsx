import { Button } from "@/components/ui/button";

export function DontKnowButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="lg" className="mt-3 w-full text-lg font-bold" onClick={onClick}>
      Don’t know
    </Button>
  );
}
