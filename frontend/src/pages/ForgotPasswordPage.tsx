import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from '@/components/common/AuthShell';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validators';
import * as authService from '@/services/auth.service';

export function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await authService.forgotPassword(values.email);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  });

  return (
    <AuthShell
      brandFirst
      title="Reset password"
      subtitle="We will email you a reset link if the account exists."
    >
      {done ? (
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          If that email exists, a reset link was sent. Check your inbox (or server console in
          development).
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link to="/login" className="font-medium text-brand-700 hover:underline dark:text-brand-300">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
