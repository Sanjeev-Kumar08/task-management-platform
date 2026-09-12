import { RegisterForm } from '@/features/auth/RegisterForm';
import { AuthShell } from '@/components/common/AuthShell';

export function RegisterPage() {
  return (
    <AuthShell
      brandFirst
      title="Create your account"
      subtitle="Start a workspace for your team and invite collaborators in minutes."
    >
      <RegisterForm />
    </AuthShell>
  );
}
