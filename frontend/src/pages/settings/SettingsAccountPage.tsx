import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { confirmDialog, useUiStore } from '@/stores/uiStore';
import * as authService from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';

export function SettingsAccountPage() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearSession = useAuthStore((s) => s.clearSession);
  const pushToast = useUiStore((s) => s.pushToast);
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;

  const save = async () => {
    setSaving(true);
    try {
      const updated = await authService.updateProfile({ name: name.trim() });
      if (accessToken) setSession(updated, accessToken);
      else useAuthStore.setState({ user: updated });
      pushToast('Profile updated', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const ok = await confirmDialog({
      title: 'Delete account',
      description: 'Delete your account permanently? This cannot be undone.',
      confirmLabel: 'Delete account',
      tone: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await authService.deleteAccount();
      clearSession();
      pushToast('Account deleted', 'success');
      navigate('/login');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Could not delete account', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Account</h2>
        <p className="text-sm text-slate-500">Your personal profile.</p>
      </div>
      <div className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" value={user.email} disabled />
        <Button onClick={() => void save()} loading={saving}>
          Save profile
        </Button>
      </div>
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
        <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Delete account</h3>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
          Blocked if you are the sole owner of any workspace — transfer ownership first.
        </p>
        <Button className="mt-3" variant="danger" loading={deleting} onClick={() => void remove()}>
          Delete account
        </Button>
      </div>
    </div>
  );
}
