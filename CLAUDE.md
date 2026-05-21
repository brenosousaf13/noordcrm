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

**DnD:** `DndContext` lives in `Dashboard.tsx`. Tasks dragged from `TasksBoard` → `AgendaGrid` call `updateTask(id, { scheduled_at: timestamp })`. Drop zones are identified by IDs starting with `AGENDA_SLOT_` (followed by ISO timestamp). The `AgendaGrid` uses an `AgendaGridBody` sub-component that must be mounted in exactly **one place at a time** — either inside the section or inside the portal (never both), because duplicate `useDroppable` IDs break dnd-kit collision detection.

**Fullscreen overlays:** Use `createPortal(…, document.body)` with `z-[99999]`. Never rely on `z-index` alone for overlays — `position: fixed` inside a `z`-bearing ancestor gets trapped in that stacking context and will appear beneath the sidebar (`z-50`).

**Agenda layout state:** `Dashboard.tsx` owns `isAgendaMinimized` (bool) and `agendaHeightPct` (number, 20–75). A drag divider between the agenda container and the bottom panels updates `agendaHeightPct` via `mousemove`. When minimized, the agenda container switches to `height: auto` so it shrinks to its header only. These are passed as `isMinimized` / `onMinimizeToggle` props to `AgendaGrid`.

## Database Schema

Three tables in Supabase `public` schema. All authenticated users have full access (RLS with `auth.role() = 'authenticated'`).

| Table | Notable columns |
|---|---|
| `clients` | `id`, `name`, `color` (hex), `created_at` |
| `tasks` | `id`, `title`, `client_id`, `estimated_minutes`, `deadline` (date), `priority` (1=low/2=med/3=high), `is_done`, `status` ('A fazer'/'Fazendo'/'Concluído'/'Atrasado'), `scheduled_at` (timestamptz), `assigned_to`, `is_recurrent`, `description`, `file_url` |
| `notes` | `id`, `title`, `content` (jsonb — TipTap JSON), `client_id`, `updated_at` |

**Priority scale:** `priority = 1` is **Baixa** (yellow indicator), `2` is **Média** (orange), `3` is **Alta** (red). This is the opposite of what the original DB comment says — the UI convention was deliberately inverted.

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

Tailwind utilities for status colors: `bg-status-red`, `bg-status-orange`, `bg-status-yellow`, `bg-status-blue` — these are defined in `@theme` in `index.css` and are the correct way to reference status colors. Avoid `bg-red`, `bg-orange` etc. as those reference Tailwind's built-in palette, not the design tokens.

**Typography:** Syne (display/section titles) + DM Sans (body) + DM Mono (timestamps, durations). Never use Inter, Roboto, or Arial.

**Tailwind class conventions:** `text-display`, `text-section`, `text-body-lg`, `text-body`, `text-small`, `text-mono`, `text-label` map to the typographic scale. `rounded-radius-sm/md/lg`, `shadow-card/raised/modal` are custom utilities.

**Icons:** Lucide React exclusively. Default `size={16}` and `strokeWidth={1.5}`.

**Client colors:** Task cards show a colored left border (`border-l-4`) using the client's `color` hex. Applied via inline `borderLeftColor` style, not a Tailwind class.

## Agenda Grid Details

- Hours range: 7–23 (`HOURS_START = 7`, 17 hour slots)
- Each hour has two 30-min rows rendered as `<Fragment>` children in a CSS grid (`grid-cols-[48px_repeat(5,minmax(0,1fr))]`)
- `PIXELS_PER_SLOT = 50` — 30 min = 50px, so task height = `(estimated_minutes / 30) * 50`
- Drop slot IDs: `AGENDA_SLOT_${date.toISOString()}` where the date has hours/minutes set via `setHours(hour, minute, 0, 0)`
- Recurrent tasks: rendered as ghost copies (id suffixed with `-ghost-<timestamp>`) mapped to the matching weekday; ghost tasks are non-removable and non-toggleable from the agenda
- Agenda cards show a done-toggle checkbox (hover) and unschedule button (hover); both use `onPointerDown` + `e.stopPropagation()` to prevent accidental drag initiation

## Notes Editor (RTE)

Built on TipTap v3. Active extensions: `StarterKit` (headings H1–H4, lists, strike), `TextStyle`, `Color`, `Placeholder`, `TaskList`, `TaskItem` (checklist with nested support).

The BubbleMenu appears on text selection and provides: Bold / Italic / Strikethrough, H1–H4, bullet list / numbered list / checklist (☑), and an 8-color palette + clear-color button. Checklist items render via `ul[data-type="taskList"]` — styles are in `index.css`.

Notes auto-save with a 1 s debounce (`onUpdate` → `setTimeout`). All notes are shared across all users (no user filter on the `notes` table).

## Keyboard Shortcuts

Defined in `Dashboard.tsx` via `document.addEventListener('keydown', ...)`. Shortcuts are suppressed when focus is in an input/textarea/contentEditable.

| Shortcut | Action |
|---|---|
| `Ctrl+A` | Open new task modal (navigates to home tab first) |
| `Ctrl+Q` | Open new note tab (navigates to home tab first) |
| `Ctrl+Enter` | Submit the task modal form — triggers the "Puxar para Inbox" button (handled inside `TaskModal.tsx` via `formRef.current?.requestSubmit()`) |

## Known Constraints

- The three team users are `brenosousaf13@gmail.com` (Breno/blue), `lucassousaf01@gmail.com` (Lucas/green), `marceladneves@yahoo.com.br` (Marcela/purple). These emails are hardcoded in `TasksBoard.tsx` `USER_COLORS` map and `TaskModal.tsx` `teamUsers` array.
- No public signup — users are created manually in the Supabase dashboard.
- Tailwind CSS v4 is used — configuration is in `vite.config.ts` via the Vite plugin, not a separate `tailwind.config.js`.
- Task deadline display: HOJE / AMANHÃ / weekday name (2–6 days out) / `dd/MM` (7+ days). Red badge when ≤3 days away or overdue; gray otherwise.
