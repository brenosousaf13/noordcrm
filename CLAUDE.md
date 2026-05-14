# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # TypeScript check + production build
npm run lint      # ESLint
npm run preview   # Preview built output
```

No test suite is configured. Validate visually by running `dev`.

## Environment

Requires `.env.local` (never commit):
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

## Architecture

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4, backed by Supabase (PostgreSQL + Auth + Realtime).

**Data flow:** Three custom hooks (`useClients`, `useTasks`, `useNotes`) own all Supabase communication. Each hook subscribes to Realtime `postgres_changes` for live sync, applies optimistic updates for perceived performance, and exposes CRUD functions. All data is lifted to `Dashboard.tsx` and passed as props — there is no global state manager.

**Auth:** `AuthContext` wraps the app; `useAuth()` provides `{ session, user, signOut }`. `ProtectedRoute` guards all routes except `/login`.

**Routing:** Two routes only — `/login` and `/` (Dashboard). The Dashboard uses `activeTab` state to switch between panels without routing.

**DnD:** `DndContext` lives in `Dashboard.tsx`. Tasks dragged from `TasksBoard` → `AgendaGrid` call `updateTask(id, { scheduled_at: timestamp })`. Drop zones are identified by IDs starting with `AGENDA_SLOT_` (followed by ISO timestamp). The `AgendaGrid` uses a `AgendaGridBody` sub-component that must be mounted in exactly **one place at a time** — either inside the section or inside the portal (never both), because duplicate `useDroppable` IDs break dnd-kit collision detection.

**Fullscreen overlays:** Use `createPortal(…, document.body)` with `z-[99999]`. Never rely on `z-index` alone for overlays — `position: fixed` inside a `z`-bearing ancestor gets trapped in that stacking context and will appear beneath the sidebar (`z-50`).

## Database Schema

Three tables in Supabase `public` schema. All authenticated users have full access (RLS with `auth.role() = 'authenticated'`).

| Table | Notable columns |
|---|---|
| `clients` | `id`, `name`, `color` (hex), `created_at` |
| `tasks` | `id`, `title`, `client_id`, `estimated_minutes`, `deadline` (date), `priority` (1=high/2=med/3=low), `is_done`, `status` ('A fazer'/'Fazendo'/'Concluído'/'Atrasado'), `scheduled_at` (timestamptz), `assigned_to`, `is_recurrent`, `description`, `file_url` |
| `notes` | `id`, `title`, `content` (jsonb — TipTap JSON), `client_id`, `updated_at` |

**Timezone gotcha:** `deadline` is a `date` column returning `"YYYY-MM-DD"`. `new Date("YYYY-MM-DD")` parses as UTC midnight, which displays as the previous day at 21:00 in UTC-3. Always append `'T00:00:00'` when constructing Date objects from deadline strings, and save the date string directly without ISO conversion.

## Design System

Design tokens are CSS variables defined in `index.css`. Always use them — never hardcode colors.

**Key tokens:**
- `--bg-app` `#F0F2F5` — app background
- `--bg-surface` `#FFFFFF` — cards, panels, modals
- `--accent` `#1A9E6E` — active elements, primary CTAs
- `--accent-light` `#E8F7F1` — active item backgrounds
- `--text-primary/secondary/tertiary` — `#111827` / `#6B7280` / `#9CA3AF`
- `--shadow-card/raised/modal` — use contextually (normal / hover+drag / modals)

**Typography:** Syne (display/section titles) + DM Sans (body) + DM Mono (timestamps, durations). Never use Inter, Roboto, or Arial.

**Tailwind class conventions:** `text-display`, `text-section`, `text-body-lg`, `text-body`, `text-small`, `text-mono`, `text-label` map to the typographic scale. `rounded-radius-sm/md/lg`, `shadow-card/raised/modal` are custom utilities.

**Icons:** Lucide React exclusively. Default `size={16}` and `strokeWidth={1.5}`.

**Client colors:** Task cards show a colored left border (`border-l-4`) using the client's `color` hex. The agenda task component accepts `clientColor` as a prop and applies it via inline `borderLeftColor`.

## Agenda Grid Details

- Hours range: 7–23 (`HOURS_START = 7`, 17 hour slots)
- Each hour has two 30-min rows rendered as `<Fragment>` children in a CSS grid (`grid-cols-[48px_repeat(5,minmax(0,1fr))]`)
- `PIXELS_PER_SLOT = 50` — 30 min = 50px, so task height = `(estimated_minutes / 30) * 50`
- Drop slot IDs: `AGENDA_SLOT_${date.toISOString()}` where the date has hours/minutes set via `setHours(hour, minute, 0, 0)`
- Recurrent tasks: rendered as ghost copies (id suffixed with `-ghost-<timestamp>`) mapped to the matching weekday; ghost tasks are non-removable from the agenda

## Keyboard Shortcuts

Defined in `Dashboard.tsx` via `document.addEventListener('keydown', ...)`. Shortcuts are suppressed when focus is in an input/textarea/contentEditable.

| Shortcut | Action |
|---|---|
| `Ctrl+A` | Open new task modal (navigates to home tab first) |
| `Ctrl+N` | Open new note tab (navigates to home tab first) |
| `Ctrl+Enter` | Submit the task modal form (handled inside `TaskModal.tsx`) |

## Known Constraints

- The three team users are `brenosousaf13@gmail.com` (Breno/blue), `lucassousaf01@gmail.com` (Lucas/green), `marceladneves@yahoo.com.br` (Marcela/purple). These emails are hardcoded in `TasksBoard.tsx` `USER_COLORS` map.
- No public signup — users are created manually in the Supabase dashboard.
- Notes are shared across all users (no per-user filter on the `notes` table).
- Tailwind CSS v4 is used — configuration is in `vite.config.ts` via the Vite plugin, not a separate `tailwind.config.js`.
