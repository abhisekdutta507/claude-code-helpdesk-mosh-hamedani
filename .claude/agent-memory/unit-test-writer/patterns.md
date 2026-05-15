---
name: Core testing patterns
description: Stable patterns for auth mock, axios mocks, form submit, isSubmitting state in this codebase
type: feedback
---

## Auth mock shape (confirmed working)

```typescript
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn().mockReturnValue({
      data: {
        session: { id: 'session-1' },
        user: { id: 'user-1', name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' },
      },
      isPending: false,
    }),
    signOut: vi.fn(),
  },
}));
```

For UsersPage (no email needed by that component), `email` field can be omitted from `user`.

## Form submit pattern

Use `fireEvent.submit(button.closest('form')!)` — not `userEvent.click(submitButton)` — for triggering form submission synchronously. Use `await userEvent.type(...)` for filling fields.

## isSubmitting / loading state test pattern

```typescript
let resolvePost!: (value: unknown) => void;
vi.mocked(axios.post).mockReturnValue(
  new Promise((resolve) => { resolvePost = resolve; }),
);
// ... fill and submit ...
await waitFor(() => {
  expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled();
});
resolvePost({ data: { id: 'new-1' } }); // clean up
```

## axios.isAxiosError mock

When testing `onError` paths that branch on `axios.isAxiosError(err)`, you must mock BOTH the rejection AND the isAxiosError function:

```typescript
vi.mocked(axios.post).mockRejectedValue(
  Object.assign(new Error('Request failed'), {
    isAxiosError: true,
    response: { data: { error: 'Email already in use.' } },
  }),
);
vi.mocked(axios.isAxiosError).mockReturnValue(true);
```

**Why:** `axios.isAxiosError` is a separate export that gets mocked independently when `vi.mock('axios')` is used.

## TanStack Query refresh after mutation

After a successful mutation, `queryClient.invalidateQueries({ queryKey: ['users'] })` triggers a re-fetch. In integration tests on UsersPage, update `mockedGet` before submitting the form so the refetch returns new data.

## renderWithProviders

Located at `@/test/render-utils`. Wraps in `QueryClientProvider` (retry: false) + `MemoryRouter`. Always use this, never bare `render`.

## import.meta.env / VITE_API_URL — cannot be overridden at test runtime

Vite statically inlines `import.meta.env.VITE_*` values at transform time. `vi.stubEnv` sets runtime env but does NOT affect the compiled constant — the `??` fallback in `const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'` is dead code when `.env.test` sets the var.

**What to test instead:** assert the URL built by the module matches the value in `.env.test` (i.e., `http://localhost:3001/api/...`). Do NOT try to test the fallback branch via `vi.stubEnv` + `vi.resetModules` — it does not work.

The `.env.test` in `frontend/` sets `VITE_API_URL=http://localhost:3001`.
