# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

AgentControlRoom is a read-only browser board for a ticket-based workflow with separate manager, developer and reviewer agent sessions: it shows each `docs/IT-*.md` ticket of a project with its `**Status:**` line, next to the Claude Code sessions that ran in that project. Vite + React 19 + TypeScript, no backend. The UI text is Hebrew (RTL).

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build
npm run lint       # eslint .
npm test           # vitest run (all tests)
npm run check      # tsc -b && eslint . && vitest run — run before handing off a change
npx vitest run -t "sorts tickets"   # single test by name
```

## Architecture

- **No server, no writes.** All input comes from two `<input webkitdirectory>` folder pickers in `src/App.tsx`: the project folder (only files directly inside a `docs/` folder are read) and the Claude sessions folder (`~/.claude/projects`, every `*.jsonl` file). Keep it read-only: nothing is written back and nothing is sent over the network.
- **`src/App.tsx`** only does file I/O and rendering. All parsing and logic live as pure functions in `src/lib/`, which is what the tests cover (`src/lib/lib.test.ts`).
  - `tickets.ts` — ticket file name pattern `IT-<n>[-slug].md`, and the `**Status:**` line parser. The status values are the workflow's fixed set (`OPEN` … `DONE`); any other value becomes `UNKNOWN`. If the workflow adds a status, update `TicketStatus` and the `known` list together.
  - `sessions.ts` — parses one JSONL line into `{ id, cwd, lastActivity }` (needs `sessionId` and `cwd`), dedupes to the latest line per session, and `normalizePath` for Windows/POSIX comparison.
  - `board.ts` — matches sessions to the project by the **last folder name** of `cwd` (case-insensitive), not the full path, since the browser picker only exposes the picked folder's name. Tickets sort numerically by key. Every row currently gets the same project session list; there is no per-ticket session link yet.

## Repo notes

- `docs/` is gitignored: ticket MD files are local working notes and must never be committed.
