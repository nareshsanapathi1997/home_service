import { ResetPasswordForm } from "@/components/auth/auth-form";
import { AuthFooterLink, AuthLayout } from "@/components/layout/auth-layout";
import { resetPassword } from "@/lib/actions/password";

export const metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a password of at least 6 characters."
      footer={
        <>
          Link expired? <AuthFooterLink href="/forgot-password">Request a new one</AuthFooterLink>
        </>
      }
    >
      {token ? (
        <ResetPasswordForm action={resetPassword} token={token} />
      ) : (
        <p className="text-sm text-destructive">This reset link is invalid.</p>
      )}
    </AuthLayout>
  );
}
