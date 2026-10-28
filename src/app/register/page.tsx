import { RegisterForm } from "@/components/auth/auth-form";
import {
  AuthFooterLink,
  AuthLayout,
} from "@/components/layout/auth-layout";
import { registerUser } from "@/lib/actions/auth";
import { config } from "@/lib/config";

export default function RegisterPage() {
  const { name } = config.app;

  return (
    <AuthLayout
      title="Create your account"
      subtitle={`Join ${name} as a customer or technician. Technicians need admin approval before receiving jobs.`}
      footer={
        <>
          Already registered? <AuthFooterLink href="/login">Sign in</AuthFooterLink>
        </>
      }
    >
      <RegisterForm action={registerUser} />
    </AuthLayout>
  );
}
