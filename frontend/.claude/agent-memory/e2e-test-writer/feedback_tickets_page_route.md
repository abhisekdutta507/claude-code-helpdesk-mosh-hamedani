---
name: feedback_tickets_page_route
description: TicketsPage lives at /tickets, not /; / is HomePage (dashboard)
metadata:
  type: feedback
---

The TicketsPage is mounted at the `/tickets` route, not `/`. The root `/` path renders `HomePage` — a dashboard with a welcome message and stat cards (Open Tickets, Resolved, Avg. Response Time).

**Why:** Tests for the tickets table were initially written with `page.goto('/')`, which landed on the HomePage and never rendered the tickets table — causing all ticket-related assertions to time out.

**How to apply:** Always navigate to `/tickets` when writing tests for the tickets listing page. Use `/` only for tests targeting the home/dashboard page (welcome message, stat cards).
