import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { loginSchema, type LoginFormValues } from '@/lib/validators';
import { useAuthStore } from '@/stores/authStore';
import { STORAGE_KEYS, writeJson } from '@/utils/storage';

export function LoginForm() {
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const storeError = useAuthStore((s) => s.error);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const invite = params.get('invite');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      if (invite) {
        writeJson(STORAGE_KEYS.pendingInviteToken, invite);
        navigate(`/invite/${invite}`);
      } else {
        navigate('/dashboard');
      }
    } catch {
      // error in store
    }
  });

  const registerTo = invite
    ? `/register?invite=${encodeURIComponent(invite)}`
    : '/register';

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      {storeError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {storeError}
        </p>
      ) : null}
      <Button type="submit" className="w-full" loading={loading}>
        Sign in
      </Button>
      <p className="text-center text-sm text-slate-500">
        <Link
          to="/forgot-password"
          className="font-medium text-brand-700 hover:underline dark:text-brand-300"
        >
          Forgot password?
        </Link>
      </p>
      <p className="text-center text-sm text-slate-500">
        No account?{' '}
        <Link
          to={registerTo}
          className="font-medium text-brand-700 hover:underline dark:text-brand-300"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
