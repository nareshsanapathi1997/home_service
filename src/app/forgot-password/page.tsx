import { ForgotPasswordForm } from "@/components/auth/auth-form";
import { AuthFooterLink, AuthLayout } from "@/components/layout/auth-layout";
import { requestPasswordReset } from "@/lib/actions/password";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your account email and we'll send you a link to set a new password."
      footer={
        <>
          Remembered it? <AuthFooterLink href="/login">Sign in</AuthFooterLink>
        </>
      }
    >
      <ForgotPasswordForm action={requestPasswordReset} />
    </AuthLayout>
  );
}
