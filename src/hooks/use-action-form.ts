"use client";

import { startTransition, useActionState, type FormEvent } from "react";

// Like useActionState, but submits without React's automatic form reset,
// so a validation error doesn't wipe what the user typed.
export function useActionForm<State>(
  action: (state: Awaited<State>, formData: FormData) => State | Promise<State>,
  initialState: Awaited<State>
) {
  const [state, formAction, pending] = useActionState(action, initialState);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return [state, onSubmit, pending] as const;
}
