"use client";

import { useActionState, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-state";

// A one-button form for a bound server action, showing the action's error inline.
export function ActionButton({
  action,
  children,
  pendingLabel,
  confirmMessage,
  variant,
  size,
  className = "rounded-lg",
}: {
  action: (state: ActionState) => Promise<ActionState>;
  children: React.ReactNode;
  pendingLabel?: string;
  confirmMessage?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <Button type="submit" variant={variant} size={size} disabled={pending} className={className}>
        {pending ? pendingLabel ?? "Working…" : children}
      </Button>
      {state.error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
