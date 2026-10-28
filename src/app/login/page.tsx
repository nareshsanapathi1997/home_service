import { LoginForm } from "@/components/auth/auth-form";
import {
  AuthFooterLink,
  AuthLayout,
} from "@/components/layout/auth-layout";
import { loginUser } from "@/lib/actions/auth";
import { config } from "@/lib/config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; reset?: string }>;
}) {
  const { callbackUrl, reset } = await searchParams;
  const { name } = config.app;

  return (
    <AuthLayout
      title={`Welcome back`}
      subtitle={
        process.env.NODE_ENV === "production"
          ? `Sign in to your ${name} account.`
          : `Sign in to your ${name} account. Demo users: password123.`
      }
      footer={
        <>
          New here? <AuthFooterLink href="/register">Create an account</AuthFooterLink>
        </>
      }
    >
      {reset ? (
        <p role="status" className="mb-5 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          Password updated. Sign in with your new password.
        </p>
      ) : null}
      <LoginForm action={loginUser} callbackUrl={callbackUrl} />
      <p className="mt-4 text-center text-sm">
        <AuthFooterLink href="/forgot-password">Forgot password?</AuthFooterLink>
      </p>
    </AuthLayout>
  );
}
