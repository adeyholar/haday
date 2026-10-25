import { X_BUTTON_LABEL } from "@/lib/auth/x";

/**
 * "Continue with X" — black, 44px, under Google when both are on.
 * Render this only when the server says X is configured.
 */
export function XSignInButton({
  onClick,
  busy = false,
}: {
  onClick: () => void;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={X_BUTTON_LABEL}
      aria-busy={busy || undefined}
      className="flex min-h-11 w-full items-center justify-center gap-3 rounded bg-black px-3 text-sm font-medium text-white"
    >
      <XMark />
      {X_BUTTON_LABEL}
    </button>
  );
}

function XMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9.52 6.77 15.2.2h-1.35L8.92 5.88 4.78.2H.2l5.96 8.48L.2 15.8h1.35l5.2-6.05 4.35 6.05H15.8L9.52 6.77Zm-1.84 2.14-.6-.86L2.08 1.22h2.06l3.86 5.53.6.86 5.04 7.22H11.6L7.68 8.91Z"
      />
    </svg>
  );
}
