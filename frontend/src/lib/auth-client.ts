import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import { UserRole } from '@repo/shared/schemas/user';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  fetchOptions: { credentials: 'include' },
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: [UserRole.ADMIN, UserRole.AGENT], required: true },
      },
    }),
  ],
});
