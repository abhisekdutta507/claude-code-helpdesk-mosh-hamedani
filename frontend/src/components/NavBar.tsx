import { Link, useNavigate } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { UserRole } from '@/lib/constants';
import { Button } from '@/components/ui/button';

export default function NavBar() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const userName = session?.user.name ?? 'User';
  const isAdmin = session?.user.role === UserRole.ADMIN;

  async function handleSignOut() {
    await authClient.signOut();
    navigate('/login', { replace: true });
  }

  return (
    <nav className="border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold">Helpdesk</Link>
          {isAdmin && (
            <Link
              to="/users"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Users
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{userName}</span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  );
}
