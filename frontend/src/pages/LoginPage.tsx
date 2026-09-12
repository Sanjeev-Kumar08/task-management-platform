import { LoginForm } from '@/features/auth/LoginForm';
import { AuthShell } from '@/components/common/AuthShell';

export function LoginPage() {
  return (
    <AuthShell
      brandFirst
      title="Sign in to continue"
      subtitle="Pick up where your team left off — projects, boards, and conversations in one place."
    >
      <LoginForm />
    </AuthShell>
  );
}
