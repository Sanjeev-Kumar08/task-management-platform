import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { strongPasswordSchema } from '@/lib/validators';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import * as authService from '@/services/auth.service';
import type { AuthSession } from '@/types';
import { formatRelativeTime } from '@/utils/format';
import { useNavigate } from 'react-router-dom';

export function SettingsSecurityPage() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const pushToast = useUiStore((s) => s.pushToast);
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const newPasswordError = (() => {
    if (!newPassword) return undefined;
    const parsed = strongPasswordSchema.safeParse(newPassword);
    return parsed.success ? undefined : parsed.error.issues[0]?.message;
  })();

  const loadSessions = async () => {
    try {
      setSessions(await authService.listSessions());
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const changePassword = async () => {
    const parsed = strongPasswordSchema.safeParse(newPassword);
    if (!parsed.success) {
      pushToast(parsed.error.issues[0]?.message ?? 'Password is too weak', 'error');
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      clearSession();
      pushToast('Password changed. Please sign in again.', 'success');
      navigate('/login');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Password change failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (sessionId: string) => {
    setBusyId(sessionId);
    try {
      await authService.revokeSession(sessionId);
      pushToast('Session revoked', 'success');
      await loadSessions();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Failed to revoke session', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-lg font-semibold">Security</h2>
        <p className="text-sm text-slate-500">Password and active sessions.</p>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Change password</h3>
        <PasswordInput
          label="Current password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          value={newPassword}
          error={newPasswordError}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <p className="text-xs text-slate-500">
          Use 8+ characters with upper and lowercase letters, a number, and a special character.
        </p>
        <Button
          onClick={() => void changePassword()}
          loading={saving}
          disabled={!currentPassword || Boolean(newPasswordError) || !newPassword}
        >
          Update password
        </Button>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">Sessions</h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500">No other sessions listed.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map((s) => (
              <li key={s.sessionId} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{s.userAgent || 'Unknown device'}</p>
                  <p className="text-xs text-slate-500">{formatRelativeTime(s.createdAt)}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === s.sessionId}
                  onClick={() => void revoke(s.sessionId)}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
