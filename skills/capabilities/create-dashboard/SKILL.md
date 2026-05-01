---
name: create-dashboard
description: >
  Create a custom web dashboard (React + Vite + Express) inside your sandbox to visualize
  the agent's Turso database. The dashboard is served on port 3847 and the user sees it
  live in the "App" tab in Gooseworks. Use when the user asks for a dashboard,
  visualization, chart, metric view, or any custom UI powered by their agent's data.
tags: [content, design]
---

You are helping the user build a custom dashboard from the Gooseworks dashboard template.
The app must run on port 3847 from a single Express process that serves both the API
routes and the built React UI so it appears in the Gooseworks App tab.

## Where the source lives (read this first)

There is one **runnable project folder** in the sandbox home directory
called `dashboard`. Most of its files are symlinks that point back into
a **canonical source folder** named `dashboard-src` inside the agent's
workspace folder. Two real local directories sit alongside the symlinks
in the runnable project folder: `node_modules` (dependencies) and
`dist` (built bundle).

What this means for you:

- **Edit files inside the runnable project folder** (the one called
  `dashboard` in the sandbox home directory). Writes follow the symlinks
  and land in the canonical source folder automatically — your edits
  persist across sandbox restarts the moment they hit disk. There is
  no manual sync step.
- **Run npm and build commands from inside the runnable project folder.**
  Tools resolve modules from the local `node_modules` folder that sits
  next to where they are invoked; running them from inside the workspace
  folder would fail because the canonical source has no `node_modules`
  next to it.
- **Do not write inside the canonical source folder under the workspace
  folder.** The symlinks make that location readable through the project
  folder, but bypassing them risks dropping built artefacts or hidden
  caches into the workspace, which tanks the file viewer and breaks
  future restores.

## Non-negotiable constraints

1. Always use the template workflow (React + Vite + Tailwind + Express). Do not rebuild this in another framework.
2. Refer to filesystem locations through their conventional names ("the runnable project folder", "the canonical source folder under the workspace") rather than as raw shell variable strings — the platform fills those in for you and the agent's chat output stays clean.
3. Always operate from inside the runnable project folder in the sandbox home directory. Edits there propagate to persistent storage through symlinks; no separate sync step is needed.
4. `node_modules` and `dist` are LOCAL only. Never copy them into the workspace folder.
5. Use one runtime port (3847) and one server process. No separate frontend dev server.

## State handling

Before editing, inspect:
- whether the runnable project folder's `package.json` is a symlink (it should be — this confirms the symlink layout is in place)
- whether the local `node_modules` folder inside the runnable project folder is populated
- whether port 3847 has a healthy server

Then follow this decision flow:
- All three OK: move to customization.
- Symlinks missing or `node_modules` empty: ask the platform to re-run the start flow (it will set up symlinks + npm install + build + launch).
- `package.json` is a real file (not a symlink): the sandbox is in a legacy state — ask the platform to re-run install/start so the symlink layout gets put in place.

The platform's start/install orchestrator handles symlink setup, dependency
install, build, and launch automatically. You don't run those steps by
hand unless something is broken.

## Discovery and planning

Before coding:
1. Clarify what the user wants to visualize if unclear.
2. **Always check the agent's database first.** If the agent has a Turso database with relevant tables, the dashboard must read from it. Never invent placeholder rows, mock arrays, or hard-coded sample data when real data is available. Use mock data only when the user explicitly asks for a demo with no DB, and clearly label it as mock in the UI.
3. Inspect the database schema using the database query tool:
   - list tables
   - inspect columns for relevant tables
   - run a small sample query to confirm shape and row counts before wiring a chart
   - if the relevant tables are missing, follow the **Empty-database handling** section below — propose a schema and create the tables rather than defaulting to mock data
4. If the request is vague, confirm a one-sentence implementation plan.

## Data source preference

Order of preference for every panel, chart, and table:
1. Live query against the agent's database via the runQuery helper or a read-only API route.
2. A user-provided file (CSV, JSON) already in the workspace.
3. Mock data — only as a last resort, with explicit user permission, and labelled as such on screen.

## Empty-database handling (important)

The user is often non-technical and will not know how to create a schema themselves. **Do not fall back to "sample data" the moment a table is missing.** Instead, when the DB is reachable but the tables needed for the requested dashboard do not exist:

1. Confirm which tables exist by listing them through the database tool.
2. Tell the user in plain language that the table(s) the dashboard needs are not there yet, and propose a small, sensible schema based on what they asked for (e.g., for a "revenue dashboard": a `deals` table with `id`, `name`, `amount`, `stage`, `closed_at`, plus a `revenue_daily` rollup if useful). Keep the schema minimal — only the columns the requested charts actually need.
3. Get a one-line confirmation from the user, then create the tables via the database tool. Use sensible types and primary keys. Add helpful indexes for the columns the dashboard will filter or group by.
4. Offer to seed a small set of realistic example rows so the charts have something to render immediately. Seed only if the user agrees, and tell them clearly that these rows are starter examples they can delete or replace.
5. Wire the dashboard to the newly created tables. Do **not** also keep a mock-data fallback in the code — once the table exists, the empty state in the UI is enough.

If the user declines schema creation, render a calm empty state ("no data yet — connect a table named X with columns A, B, C to see this chart") in stone tones rather than filling the chart with fake numbers.

Never create or alter tables that already contain user data without an explicit instruction. Never drop tables. All table creation must be additive.

## Implementation guidance

Template structure to use:
- A server entry module for API routes and static serving.
- The root App component for route registration.
- A **layouts folder** under src/components/layouts/ that holds six shell components — pick the one that matches what the user is building (see "Choosing a layout" below).
- A pages folder for page implementations.
- A small API helper module exporting a runQuery function for data access from pages.

For each new page:
1. Add a page component to the pages folder.
2. Pull data using the runQuery helper, or a dedicated read-only API route when SQL becomes complex.
3. Add route wiring in the root App component.
4. Add a navigation entry in whichever layout shell the App component is wrapped in (sidebar nav, top nav, or tab bar — depending on the chosen layout).

Keep all dashboard endpoints read-only.

### Choosing a layout

Six layout shells live in `src/components/layouts/`. The default `App.tsx`
wraps routes in `SidebarLayout`. Swap the import + wrapper in `App.tsx` to
the shell that matches what the user is asking for:

| Shell | Use when the user asks for… |
| --- | --- |
| `SidebarLayout` (default) | a multi-section app with several pages (analytics, admin, multi-page tool) |
| `TopNavLayout` | a single-purpose dashboard, marketing-style report, or something that wants full-width content |
| `TopNavTabsLayout` | a Stripe-Dashboard-style sectioned view where tabs slice the same workspace |
| `SplitPaneLayout` | inbox / CRM / chat / mail-style apps — list on the left, detail on the right. Pass `list` and `detail` as separate props |
| `CanvasLayout` | a one-page report, embed, or screen with no chrome at all |
| `CenteredLayout` | login forms, onboarding screens, single-action surfaces |

Rules:
- **Pick exactly one** shell per dashboard. Do not mix two shells in App.tsx.
- Before swapping the shell, confirm the choice with the user in one sentence ("I'll build this as a split-pane inbox — list on the left, message on the right. OK?").
- After swapping the shell, edit the nav entries inside that shell file to match the routes you wire up.
- All shells share the same stone palette, typography, and spacing — do not introduce new colors or fonts when switching shells.
- `SplitPaneLayout` takes `list` + `detail` props instead of `children`. App.tsx should render the list pane (route-agnostic) and the detail pane (typically a `<Routes>`) as those two props.

## Visual style rules

Design inspiration: aim for the calm, content-first feel of Linear, Vercel, Stripe, and Notion analytics dashboards. The dashboard should look like a quiet reporting surface, not a colourful BI tool. Density is good; chart-junk is not.

Concrete rules:
- Use the stone color palette only — stone-tinted text, borders, and backgrounds. No blues, greens, purples, or rainbow palettes.
- Prefer compact typography (extra-small or small text sizes) with a normal font weight. Avoid bold headlines except for the page title.
- Keep borders minimal (single hairline in a light stone tone) and avoid heavy shadows or rounded "card" stacks. Flat surfaces only.
- For Recharts lines, bars, and grids, stay within the stone color family. Use opacity to differentiate series instead of hue. Single-series charts should be a single mid-stone tone.
- Layout: pick a shell from `src/components/layouts/` (see "Choosing a layout" above) instead of inventing a new chrome. Within whichever shell you pick, keep the main content column generous on whitespace, KPIs as a row of small stat blocks at the top, charts and tables stacked below.
- Empty states, loading states, and error states must follow the same stone palette and typography — no spinners with brand colours, no red error toasts.

When in doubt, look at the existing pages in the template and match their density, spacing, and tone before adding anything new.

## Build, run, and verify

The dashboard does **not** hot-reload on file changes. Editing source alone will not update what the user sees in the App tab. After **every** change, the agent must rebuild and restart the server — the user should never have to do this themselves.

After changes:
1. Run a production build.
2. Cleanly restart the existing dashboard server process (stop the old one on port 3847 first, then start the new one). Reuse the port-scoped cleanup pattern; never pkill broadly inside the sandbox.
3. Start the server that serves both API and UI on port 3847.
4. Verify health via the health endpoint before reporting "done".

Interpret health:
- ok=true with db=true: dashboard is live.
- db=false: inform the user that agent DB credentials/config are missing and stop further DB-dependent work.

## Troubleshooting

If the user reports a problem with the dashboard, walk through this list in order before making code changes. Most "the dashboard is broken" reports are environmental, not bugs in the user's pages.

1. **App tab is blank or shows a connection error.** Check whether the server is actually running on port 3847 (`curl /api/health`). If not, ask the platform to re-run the start flow.
2. **Health endpoint returns ok=false or db=false.** The agent's database credentials are missing or invalid. Tell the user this directly; do not try to silently swap in mock data.
3. **Page renders but charts/tables are empty.** Run the underlying query through the database tool to confirm whether the table actually has rows. If the table is missing entirely, follow the Empty-database handling section — offer to create the schema; do not silently swap to mock data. If the table exists but is empty, render an empty state. If rows exist, check the runQuery call and column names.
4. **"Module not found" or import errors after editing.** A new package was used without being added to `package.json`. Add it, then run `npm install` from inside the runnable project folder and rebuild.
5. **Changes do not appear in the App tab.** The server was not rebuilt and restarted after the edit. Run the build, restart the server on 3847, then ask the user to refresh.
6. **Stale UI after a long session.** The build output diverged from source. Remove the `dist` folder inside the runnable project folder and rebuild.
7. **The runnable project folder's `package.json` is a real file (not a symlink).** The sandbox is in a legacy / pre-symlink state. Ask the platform to re-run the start flow — it will rewire the symlinks and rebuild.
8. **Sandbox restarted and the dashboard isn't running.** Just ask the platform to start it. The source persists in S3 via symlinks, so there's nothing for you to restore.

If none of the above resolves it, read the server logs, summarize the actual error to the user in plain language, and propose the smallest fix.

## Completion message

End with a direct status message that the dashboard is live in the App tab and ready
for further edits.

## Iteration loop

For every follow-up tweak (this loop is the agent's job, not the user's):
1. Edit the relevant files inside the runnable project folder. The symlinks persist your edit to the workspace automatically — there's no separate sync step.
2. Rebuild and restart the single server on port 3847 from inside the runnable project folder. Edits alone don't take effect; the rebuild + restart is mandatory every time.
3. Verify the health endpoint before reporting back.
4. Tell the user the update is done and ask them to refresh the App tab.
