import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { LoadingPage } from '@/components/common/LoadingPage';
import { useAuthStore } from '@/stores/authStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import * as invitationService from '@/services/invitation.service';
import type { InvitationPreview } from '@/types';
import { STORAGE_KEYS, removeKey, writeJson } from '@/utils/storage';
import { AuthShell } from '@/components/common/AuthShell';
import { normalizeId } from '@/utils/normalize';

export function InviteAcceptPage() {
  const { token = '' } = useParams();
  const user = useAuthStore((s) => s.user);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const navigate = useNavigate();
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invitation token missing');
      return;
    }
    writeJson(STORAGE_KEYS.pendingInviteToken, token);
    void invitationService
      .previewInvitation(token)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : 'Invalid invitation'));
  }, [token]);

  const accept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const workspace = await invitationService.acceptInvitation(token);
      const id = normalizeId(workspace as typeof workspace & { _id?: string }).id;
      removeKey(STORAGE_KEYS.pendingInviteToken);
      await fetchWorkspaces({ preferId: id });
      navigate(`/workspaces/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (!bootstrapped) return <LoadingPage />;

  if (error && !preview) {
    return (
      <AuthShell title="Invitation" subtitle="This invite could not be loaded.">
        <p className="text-sm text-red-600">{error}</p>
        <p className="mt-4 text-center text-sm">
          <Link to="/dashboard" className="text-brand-700 hover:underline">
            Go home
          </Link>
        </p>
      </AuthShell>
    );
  }

  if (!preview) return <LoadingPage label="Loading invitation…" />;

  return (
    <AuthShell
      title={`Join ${preview.workspace?.name ?? 'workspace'}`}
      subtitle={`You were invited as ${preview.role} (${preview.email}).`}
    >
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      {user ? (
        user.email.toLowerCase() !== preview.email.toLowerCase() ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Sign in as <strong>{preview.email}</strong> to accept this invitation. You are currently
            signed in as {user.email}.
          </p>
        ) : (
          <Button className="w-full" loading={accepting} onClick={() => void accept()}>
            Accept invitation
          </Button>
        )
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Sign in or create an account with <strong>{preview.email}</strong> to join.
          </p>
          <Link to={`/login?invite=${encodeURIComponent(token)}`}>
            <Button className="w-full">Sign in to accept</Button>
          </Link>
          <Link to={`/register?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(preview.email)}`}>
            <Button className="w-full" variant="secondary">
              Create account
            </Button>
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
