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
