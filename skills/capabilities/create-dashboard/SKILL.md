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

Throughout this skill, "project directory" means a folder named **dashboard** placed
directly under the sandbox home directory, and "source mirror" means a folder named
**dashboard-src** placed under the workspace folder. Both names are conventions enforced
by the install template — keep using these names so other tools can find the files.

File placement rules — follow these exactly:
- The runnable app (server entry, package manifest, build output, dependency folder) lives **only** in the project directory under the sandbox home. Never put runnable app files inside the workspace folder.
- The source mirror under the workspace folder holds **only** source and config files (server module, src tree, vite/tailwind/postcss/tsconfig, package manifest, lockfile, env example). It must never contain dependency folders, build output, or version-control metadata.
- New page components go in the pages folder inside the project directory's src tree. New API helpers go alongside the existing API helper module. Never scatter dashboard files outside these two locations.

## Non-negotiable constraints

1. Always use the template workflow (React + Vite + Tailwind + Express). Do not rebuild this in another framework.
2. Use sandbox-agnostic locations only — refer to the home folder and the workspace folder via the environment-provided home variable rather than typing absolute paths into prose.
3. Keep the active project in the project directory, outside the workspace mount.
4. Mirror only source files into the source mirror for persistence.
5. Never place dependencies, build output, or version control metadata in the mirror.
6. Use one runtime port (3847) and one server process. No separate frontend dev server.

## State handling

Before editing, inspect:
- whether the project directory exists
- whether the source mirror exists
- whether dependencies are already installed in the project directory

Then follow this decision flow:
- Project exists with dependencies present: move to customization.
- Project missing but mirror exists: restore from the mirror into the project directory, install deps, build, start the server, verify health.
- Both missing: initialize from the official Gooseworks dashboard template, install deps, then continue.
- Project exists without dependencies: install deps, then continue.

If template initialization fails because the template source is unavailable, tell the
user to retry once it is available. Do not hand-roll a replacement template.

## Layout choice (do this first — non-negotiable)

The dashboard template ships six layout shells in `src/components/layouts/`
(SidebarLayout, TopNavLayout, TopNavTabsLayout, SplitPaneLayout,
CanvasLayout, CenteredLayout). `App.tsx` defaults to `SidebarLayout`.

**Before writing or editing any code, ask the user one short question to
pick the right shell.** Phrase it naturally based on what they asked for —
the goal is to confirm the layout fits the intent, not to read the table
out loud. Examples:

- User asks for "a CRM" → "I'll build this as a split-pane (list left,
  detail right) — sound right?"
- User asks for "an analytics dashboard" → "I'll use the sidebar layout
  with multiple sections — OK?"
- User asks for "a one-page report" → "I'll use a single full-width
  canvas with no nav — OK?"
- Truly ambiguous → "Should this have a sidebar with multiple pages, or
  is it a single-view dashboard?"

If the user says "you pick" or "default", use `SidebarLayout`. Otherwise
swap the `App.tsx` import and wrapper to the chosen shell **before** moving
on to data discovery / page implementation. See the full decision table
under "Choosing a layout" below.

**Never silently default to `SidebarLayout` without surfacing the choice.**
A user asking for an inbox in a sidebar feels wrong; a one-sentence check
upfront is cheap and catches it.

## Discovery and planning

After the layout shell is locked in, do the following before writing data
code:

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

## Persistence to source mirror

After each successful change:
1. Sync source files from the project directory into the source mirror.
2. Exclude the dependency folder, the build-output folder, and any version-control metadata folder.
3. Verify mirror size stays small (roughly under 1 MB; if it grows very large, clean leaked heavy folders and sync again).

The mirror should include source and config files needed to recreate the project quickly after restart.

## Troubleshooting

If the user reports a problem with the dashboard, walk through this list in order before making code changes. Most "the dashboard is broken" reports are environmental, not bugs in the user's pages.

1. **App tab is blank or shows a connection error.** Check whether the server is actually running on port 3847. If not, restart it. If the project directory is missing (sandbox was rebooted), restore from the source mirror, install deps, build, and start the server.
2. **Health endpoint returns ok=false or db=false.** The agent's database credentials are missing or invalid. Tell the user this directly; do not try to silently swap in mock data.
3. **Page renders but charts/tables are empty.** Run the underlying query through the database tool to confirm whether the table actually has rows. If the table is missing entirely, follow the Empty-database handling section — offer to create the schema; do not silently swap to mock data. If the table exists but is empty, render an empty state. If rows exist, check the runQuery call and column names.
4. **"Module not found" or import errors after editing.** Dependencies were not installed in the project directory, or a new package was used without being added to the manifest. Reinstall from the manifest, then rebuild.
5. **Changes do not appear in the App tab.** The server was not rebuilt and restarted after the edit. Run the build, restart the server on 3847, then ask the user to refresh.
6. **Stale UI after a long session.** The build output diverged from source. Remove the build-output folder inside the project directory, rebuild, and restart.
7. **Mirror grew very large or sync is slow.** Heavy folders (dependencies, build output, version-control metadata) leaked into the mirror. Clean them out and re-sync source-only.
8. **Sandbox restarted and the dashboard is gone.** Restore from the source mirror into the project directory, install deps, build, start the server, verify health.

If none of the above resolves it, read the server logs, summarize the actual error to the user in plain language, and propose the smallest fix.

## Completion message

End with a direct status message that the dashboard is live in the App tab and ready
for further edits.

## Iteration loop

For every follow-up tweak (this loop is the agent's job, not the user's):
1. Edit relevant files in the project directory only — never edit inside the source mirror.
2. Rebuild and restart the single server on port 3847. Edits alone do not take effect; the rebuild + restart is mandatory every time.
3. Re-sync source-only files to the source mirror.
4. Verify the health endpoint before reporting back.
5. Tell the user the update is done and ask them to refresh the App tab.
