---
name: project_lucide_sort_icons
description: CSS class names to select Lucide sort icons in Playwright tests
metadata:
  type: project
---

Lucide React icons render as `<svg>` elements with a class name derived from the icon name in kebab-case, prefixed with `lucide-`:

- `ArrowDown`   → `svg.lucide-arrow-down`   (column sorted descending)
- `ArrowUp`     → `svg.lucide-arrow-up`     (column sorted ascending)
- `ArrowUpDown` → `svg.lucide-arrow-up-down` (column unsorted / default)

**Why:** In `TicketsPage.tsx`, the `SortIcon` component renders these three icons based on `column.getIsSorted()`. CSS class locators are stable because Lucide's `createLucideIcon` always appends the kebab-case name as a class.

**How to apply:** To assert which sort icon is shown in a column header, use `columnHeader(page, 'Date').locator('svg.lucide-arrow-down')`. To assert absence, use `.not.toBeAttached()`.
