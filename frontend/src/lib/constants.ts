export const UserRole = {
  ADMIN: 'ADMIN',
  AGENT: 'AGENT',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
