---
name: project_tanstack_sort_clear
description: TanStack Table: clearing sort leaves sorting=[], so icon shows ArrowUpDown even on the "default" column
metadata:
  type: project
---

`TicketsPage` initializes sorting with `[{ id: 'createdAt', desc: true }]` so the Date column shows `ArrowDown` on first load. When a user cycles through a different column (e.g. Subject → asc → desc → unsorted), TanStack Table sets `sorting = []`.

At that point:
- The API falls back to `createdAt/desc` (via `sorting[0]?.id ?? TicketSortBy.CREATED_AT`).
- But `column.getIsSorted()` returns `false` for **all** columns, so the Date column shows `ArrowUpDown` — not `ArrowDown`.

**Why:** The component has no logic to reset `sorting` back to the initial `[{ id: 'createdAt', desc: true }]` state — it just uses the fallback at the data-fetching layer.

**How to apply:** After a sort-clear action, assert `svg.lucide-arrow-up-down` on the Date column, not `svg.lucide-arrow-down`. Only the initial page load shows `ArrowDown` on Date. The API-level fallback (createdAt/desc) can still be verified via `page.waitForRequest`.
