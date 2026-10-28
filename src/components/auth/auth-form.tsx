"use client";

import { useActionForm } from "@/hooks/use-action-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { AuthFormState } from "@/lib/actions/auth";

export function LoginForm({
  action,
  callbackUrl,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  callbackUrl?: string;
}) {
  const [state, formAction, pending] = useActionForm(action, {});

  return (
    <form onSubmit={formAction} className="space-y-5">
      {callbackUrl ? (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-11 rounded-lg"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-11 rounded-lg"
          placeholder="••••••••"
        />
      </div>
      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full rounded-lg" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export function RegisterForm({
  action,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}) {
  const [state, formAction, pending] = useActionForm(action, {});

  return (
    <form onSubmit={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required className="h-11 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required className="h-11 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+91 98765 43210"
          className="h-11 rounded-lg"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={6}
          required
          className="h-11 rounded-lg"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">I am a</Label>
        <NativeSelect id="role" name="role" defaultValue="CUSTOMER">
          <option value="CUSTOMER">Customer — book home services</option>
          <option value="TECHNICIAN">Technician — offer my services</option>
        </NativeSelect>
      </div>
      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full rounded-lg" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm({
  action,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState & { success?: string }>;
}) {
  const [state, formAction, pending] = useActionForm(action, {});

  if (state.success) {
    return (
      <p role="status" className="rounded-lg bg-primary/10 px-3 py-3 text-sm text-primary">
        {state.success}
      </p>
    );
  }

  return (
    <form onSubmit={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" className="h-11 rounded-lg" />
      </div>
      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" className="h-11 w-full rounded-lg" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({
  action,
  token,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  token: string;
}) {
  const [state, formAction, pending] = useActionForm(action, {});

  return (
    <form onSubmit={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" minLength={6} required autoComplete="new-password" className="h-11 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" minLength={6} required autoComplete="new-password" className="h-11 rounded-lg" />
      </div>
      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" className="h-11 w-full rounded-lg" disabled={pending}>
        {pending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
