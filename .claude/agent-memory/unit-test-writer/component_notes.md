---
name: CreateUserDialog and UsersPage specifics
description: Key facts about CreateUserDialog and UsersPage relevant to testing
type: project
---

## CreateUserDialog (`frontend/src/components/CreateUserDialog.tsx`)

- Submit button text: `'Creating…'` (uses U+2026 HORIZONTAL ELLIPSIS, NOT three dots `...`) while `isSubmitting`
- Submit button is disabled while `isSubmitting`
- Uses `react-hook-form` + `zodResolver(createUserSchema)` from `@repo/shared/schemas/user`
- `createUserSchema`: name min 3 (trimmed), email valid, password min 8 (trimmed)
- Error messages: `'Name must be at least 3 characters long'`, `'Invalid email address'`, `'Password must be at least 8 characters long'`
- Root error (server error) shown in `<Alert variant="destructive">` — queryable with `getByRole('alert')`
- Server error message: reads from `err.response?.data?.error ?? 'Failed to create user.'`
- On success: `queryClient.invalidateQueries({ queryKey: ['users'] })`, then `reset()`, then `onOpenChange(false)`
- Cancel button calls `handleOpenChange(false)` which also resets the form

## UsersPage (`frontend/src/pages/UsersPage.tsx`)

- Uses `useQuery({ queryKey: ['users'], queryFn: fetchUsers })`
- `fetchUsers` calls `axios.get('/api/users', { withCredentials: true })`
- Loading state: card title shows a Skeleton, table body shows 5 SkeletonRows
- Error state: shows `'Failed to load users.'` paragraph; entire Card is hidden (`!isError` guard)
- Role badges: ADMIN gets `bg-primary/10 text-primary`; AGENT gets `bg-muted text-muted-foreground`
- Card title format: `All users (N)` where N is `users.length`
- Dialog controlled by local `dialogOpen` state; reset happens inside `CreateUserDialog.handleOpenChange`

## EditUserDialog (`frontend/src/components/EditUserDialog.tsx`)

- Submit button text: `'Saving…'` (U+2026 HORIZONTAL ELLIPSIS) while `mutation.isPending` (NOT `isSubmitting`)
- Submit button is disabled while `mutation.isPending`; button uses `disabled={isPending}` where `isPending = mutation.isPending`
- Form destructures only `{ errors }` from `formState` — no `isSubmitting`
- Uses `react-hook-form` + `zodResolver(updateUserSchema)` from `@repo/shared/schemas/user`
- `updateUserSchema`: name min 3 (trimmed), password min 8 (trimmed) optional OR literal ""
- Email field is `disabled` and `readOnly`, displays `user?.email ?? ''` directly (not form-controlled)
- `useEffect` resets form `{ name: user.name, password: '' }` whenever `user` prop changes
- `handleOpenChange(false)` calls `reset()` before calling `onOpenChange(false)` — resets on Cancel
- Error message path: `err.response?.data?.error ?? 'Failed to update user.'`
- Root error shown in `<Alert variant="destructive">` — queryable with `getByRole('alert')`
- `data-testid="edit-user-form"` on the `<form>` element
- Edit button in UserRow: `data-testid={`edit-user-${user.id}`}`, `aria-label="Edit user"`
- On success: `queryClient.invalidateQueries({ queryKey: ['users'] })`, then `onOpenChange(false)`
- PUT endpoint: `${API_URL}/api/users/${user.id}` with `{ withCredentials: true }`

## Shared schema location

`@repo/shared/schemas/user` — exports `createUserSchema`, `updateUserSchema`, `UserRole`, `CreateUserInput`, `UpdateUserInput`
