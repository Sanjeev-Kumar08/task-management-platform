import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { registerSchema, type RegisterFormValues } from '@/lib/validators';
import { useAuthStore } from '@/stores/authStore';
import { STORAGE_KEYS, writeJson } from '@/utils/storage';

export function RegisterForm() {
  const registerUser = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const storeError = useAuthStore((s) => s.error);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const invite = params.get('invite');
  const emailPrefill = params.get('email') ?? '';
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: emailPrefill, password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerUser(values.name, values.email, values.password);
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

  const loginTo = invite ? `/login?invite=${encodeURIComponent(invite)}` : '/login';

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input label="Name" error={errors.name?.message} {...register('name')} />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordInput
        label="Password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <p className="text-xs text-slate-500">
        Use 8+ characters with upper and lowercase letters, a number, and a special character.
      </p>
      {storeError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {storeError}
        </p>
      ) : null}
      <Button type="submit" className="w-full" loading={loading}>
        Create account
      </Button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          to={loginTo}
          className="font-medium text-brand-700 hover:underline dark:text-brand-300"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
