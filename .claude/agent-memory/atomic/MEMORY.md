# Unit Test Writer Memory Index

- [Core testing patterns](patterns.md) — auth mock shape, axios mock patterns, form submission pattern, isSubmitting test pattern
- [Component notes](component_notes.md) — CreateUserDialog, EditUserDialog, UsersPage, TicketDetailPage, TicketsPage specifics; "Saving…"/"Creating…"/"Sending…" use U+2026; scrollIntoView needs vi.fn() mock; URL substring ordering in axios mocks
- [Pagination testing](pagination_testing.md) — shadcn/ui pagination uses @base-ui/react/button with nativeButton={false}; use data-slot queries not getByRole('link')
