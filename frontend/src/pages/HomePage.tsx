import { authClient } from '@/lib/auth-client';
import NavBar from '@/components/NavBar';

export default function HomePage() {
  const { data: session } = authClient.useSession();
  const userName = session?.user.name ?? 'User';

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold">Welcome, {userName}</h1>
      </main>
    </div>
  );
}
