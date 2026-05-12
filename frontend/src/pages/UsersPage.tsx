import { useState } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import NavBar from '@/components/NavBar';
import CreateUserDialog from '@/components/CreateUserDialog';
import EditUserDialog from '@/components/EditUserDialog';
import { UserRole } from '@repo/shared/schemas/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil } from 'lucide-react';
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

const roleBadgeClass = {
  [UserRole.ADMIN]:
    'inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary',
  [UserRole.AGENT]:
    'inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground',
};

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="px-6"><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell className="px-6"><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell className="px-6"><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
          <TableCell className="px-6"><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="px-6" />
        </TableRow>
      ))}
    </>
  );
}

function UserRow({ user, onEdit }: { user: User; onEdit: (user: User) => void }) {
  return (
    <TableRow>
      <TableCell className="px-6 font-medium">{user.name}</TableCell>
      <TableCell className="px-6 text-muted-foreground">{user.email}</TableCell>
      <TableCell className="px-6">
        <span className={roleBadgeClass[user.role]}>{user.role}</span>
      </TableCell>
      <TableCell className="px-6 text-muted-foreground">
        {new Date(user.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(user)}
          aria-label="Edit user"
          data-testid={`edit-user-${user.id}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { data: users = [], isPending, isError } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Users</h1>
          <Button onClick={() => setDialogOpen(true)}>New agent</Button>
        </div>

        <CreateUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        <EditUserDialog
          open={!!editingUser}
          user={editingUser}
          onOpenChange={(open) => { if (!open) setEditingUser(null); }}
        />

        {isError && <p className="text-destructive">Failed to load users.</p>}

        {!isError && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isPending ? <Skeleton className="h-5 w-24" /> : `All users (${users.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6">Name</TableHead>
                    <TableHead className="px-6">Email</TableHead>
                    <TableHead className="px-6">Role</TableHead>
                    <TableHead className="px-6">Joined</TableHead>
                    <TableHead className="px-6" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPending
                    ? <SkeletonRows />
                    : users.map((user) => <UserRow key={user.id} user={user} onEdit={setEditingUser} />)
                  }
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
