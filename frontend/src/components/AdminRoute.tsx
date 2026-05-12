import { Navigate, Outlet } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { UserRole } from '@repo/shared/schemas/user';

export default function AdminRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (session.user.role !== UserRole.ADMIN) return <Navigate to="/" replace />;

  return <Outlet />;
}
