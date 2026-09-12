import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validators';
import * as authService from '@/services/auth.service';
import { AuthShell } from '@/components/common/AuthShell';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setError('Reset token is missing');
      return;
    }
    setError(null);
    try {
      await authService.resetPassword({ token, password: values.password });
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    }
  });

  return (
    <AuthShell brandFirst title="Choose a new password" subtitle="Enter a new password for your account.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <p className="text-xs text-slate-500">
          Use 8+ characters with upper and lowercase letters, a number, and a special character.
        </p>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Reset password
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link to="/login" className="font-medium text-brand-700 hover:underline dark:text-brand-300">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
