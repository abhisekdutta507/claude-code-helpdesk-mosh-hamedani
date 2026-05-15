import axios from 'axios';
import { type UserRole } from '@repo/shared/schemas/user';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export async function fetchUsers(): Promise<User[]> {
  const res = await axios.get<User[]>(`${API_URL}/api/users`, { withCredentials: true });
  return res.data;
}
