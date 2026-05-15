---
name: Pagination testing
description: How to query shadcn/ui pagination prev/next/page-number elements in tests; getByRole('link') fails
metadata:
  type: feedback
---

## shadcn/ui PaginationPrevious / PaginationNext are NOT accessible as role="link"

The `PaginationLink` component uses `@base-ui/react/button` with `nativeButton={false}` and `render={<a .../>}`. The `@base-ui/react` button overrides the native `<a>` role with `role="button"`, so `getByRole('link', { name: '...' })` fails for these elements even though the DOM renders an `<a>` tag.

**Use `data-slot` queries instead:**

```typescript
// PaginationPrevious
const prevEl = document.querySelector<HTMLElement>(
  '[data-slot="pagination-link"][aria-label="Go to previous page"]',
);

// PaginationNext
const nextEl = document.querySelector<HTMLElement>(
  '[data-slot="pagination-link"][aria-label="Go to next page"]',
);

// Numbered page links (e.g. page 2)
const paginationLinks = document.querySelectorAll<HTMLElement>('[data-slot="pagination-link"]');
const page2 = Array.from(paginationLinks).find((el) => el.textContent?.trim() === '2');
```

**Why:** `@base-ui/react/button` with `nativeButton={false}` renders the element with `role="button"` regardless of the underlying element tag. The `aria-label` is still present on the rendered element, so `data-slot` + `aria-label` attribute selectors work reliably.

**Note:** `role="navigation"` still works correctly for the `<nav>` wrapper — use `screen.getByRole('navigation')` inside a `waitFor` to confirm pagination has rendered before querying its children.

## Multi-call axios mock for pages that call multiple endpoints

When a component calls multiple `axios.get` endpoints (e.g. `/api/tickets` and `/api/agents`), use a URL-discriminating implementation:

```typescript
vi.mocked(axios.get).mockImplementation((url: string) => {
  if ((url as string).includes('/api/agents')) {
    return Promise.resolve({ data: [] });
  }
  return Promise.resolve({ data: ticketsResponse });
});
```

Put the more-specific URL check first to avoid substring collisions.

## Starting component on a specific page

`renderWithProviders` uses `MemoryRouter` with no initial entries, so the component always starts at `/`. To test pagination on page 2+, render manually with `initialEntries`:

```typescript
const { render } = await import('@testing-library/react');
const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
const { MemoryRouter } = await import('react-router-dom');

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
render(
  <QueryClientProvider client={client}>
    <MemoryRouter initialEntries={['/?page=2']}>
      <TicketsPage />
    </MemoryRouter>
  </QueryClientProvider>,
);
```
