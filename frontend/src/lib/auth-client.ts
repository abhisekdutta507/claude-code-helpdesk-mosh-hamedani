import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { UserRole } from '@/lib/constants'

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000',
  fetchOptions: { credentials: 'include' },
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: [UserRole.ADMIN, UserRole.AGENT] },
      },
    }),
  ],
})
