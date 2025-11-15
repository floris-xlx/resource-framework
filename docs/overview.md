# Resource framework overview

This framework helps teams ship database‑backed pages quickly and consistently — think resource lists (tables), drilldowns (detail pages), and schema‑driven forms — without locking you into a specific UI library or routing system.

## What we’re trying to achieve

- Speed: go from idea to functional data screens in hours, not weeks.
- Consistency: lists, filters, and forms behave the same across the app.
- Composability: start with sensible defaults, override where it matters.
- Decoupling: inject your own UI components and app services via adapters.
- Safety: make server‑friendly requests and predictable updates.

In short: product teams should focus on business logic and copy; the framework takes care of structure and glue.

## Core concepts (plain language)

- **Resource**: a table or view you want to show in the UI (e.g., `invoices`, `customers`, `transactions`).
- **Routes**: configuration for list and drilldown pages of a resource (paths, columns, search, edit policy).
- **Columns and renderers**: how fields appear (status badge, currency, dates), and how they can be edited.
- **Filters**: a consistent way to translate user filters into server‑friendly query params.
- **Hooks**: small helpers for common client tasks (filters, prefs, user scopes).
- **Forms**: multi‑step, schema‑driven experiences that persist to your tables and can trigger actions.

## What you can build with it

- Resource lists with search, sort, bulk actions, and quick filters.
- Drilldowns with editable fields, related sections, and custom actions.
- Settings routes for internal tools and admin panels.
- Schema‑driven forms for onboarding, setup, or operational workflows.

## How it’s structured (without code deep‑dives)

### 1) Resource routes

You maintain a registry of resources (like a “directory” of your data screens). For each resource you can define:

- page paths (index and drilldown templates)
- which columns to show and how to render them
- how search and filtering should work
- whether editing is allowed and how

When no static entry exists for a given `resource_name`, the framework can look up dynamic route overrides from a database table (so operations can reconfigure screens without redeploys).

### 2) Columns (and per‑column links)

Columns can be hand‑written or “defined” from a higher‑level spec. You can attach a link template to any column (e.g., `"/v2/customers/{{customer_id}}"`) to let people click through to related pages. Renderers handle common patterns like currency, status, dates, and booleans to keep UI consistent.

### 3) Categories (Tabbed edit)

You can declare a list of categories on a route (e.g., `["Basic","Address","Business"]`) and assign individual fields to one of those categories. In edit mode, fields automatically group into tabs in that order — similar to how a profile or settings page works.

### 4) Forms (shared module)

There’s a shared, schema‑driven form module for multi‑step flows. It supports a v1 and v2 shape and normalizes them into the same runtime format. The point is to build complex forms (with tables, uploads, radios, pricing choices, etc.) without bespoke page code each time. Schemas can live in your database so non‑developers can iterate safely.

### 5) Hooks and small utilities

- User preferences (stored locally for quick UX wins)
- Query filters (parse URL filters into a normalized structure)
- User scopes (fetch allowed permissions and gate UI affordances)

## Opinionated defaults, easy escapes

The framework ships with sensible defaults for columns, sorting, and light edit hints. You can:

- override renderers per column
- inject your own UI primitives (Button, Badge, Select, etc.)
- change search/filter behavior
- add custom actions (like “Create invoice”, “Send email”)

You get productivity without losing control over the experience.

## Why this helps XYLEX Group (and similar apps)

SaaS operations screens can sprawl over time: lists, settings, drilldowns, and forms all grow in different styles. This framework standardizes the building blocks so we can:

- roll out new resources fast (with consistent UX)
- add features once (e.g., new filter operators) and benefit everywhere
- evolve our UI library without rewriting business logic
- keep data screens aligned with server expectations

## A note on adapters (UI/app independence)

Instead of importing UI components directly, the framework asks the host app to provide a small set of primitives (Button, Badge, etc.), router helpers, and optional stores/hooks. That means you can use the design system and navigation you already have, and still benefit from shared data logic and conventions.

## Where to go next

- Resource routes: how to register resources and define columns
- Columns and renderers: what’s available and how to customize
- Forms: schema shapes, defaults, and how to store them in your DB
- Hooks: filters, prefs, and scopes

This framework aims to make the “boring but important” parts of data pages repeatable and reliable — so product teams can focus on outcomes, not scaffolding.
