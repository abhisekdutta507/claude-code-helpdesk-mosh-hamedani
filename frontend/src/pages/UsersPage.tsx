import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import NavBar from '@/components/NavBar';
import { UserRole } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT';
  createdAt: string;
};

async function fetchUsers(): Promise<User[]> {
  const res = await axios.get<User[]>(`${API_URL}/api/users`, { withCredentials: true });
  return res.data;
}

export default function UsersPage() {
  const { data: users = [], isPending, isError } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Users</h1>
        {isPending && <p className="text-muted-foreground">Loading…</p>}
        {isError && <p className="text-destructive">Failed to load users.</p>}
        {!isPending && !isError && (
          <Card>
            <CardHeader>
              <CardTitle>All users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6">Name</TableHead>
                    <TableHead className="px-6">Email</TableHead>
                    <TableHead className="px-6">Role</TableHead>
                    <TableHead className="px-6">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="px-6 font-medium">{user.name}</TableCell>
                      <TableCell className="px-6 text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="px-6">
                        <span
                          className={
                            user.role === UserRole.ADMIN
                              ? 'inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary'
                              : 'inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground'
                          }
                        >
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
