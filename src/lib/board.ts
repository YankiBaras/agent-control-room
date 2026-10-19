import type { Session } from './sessions'
import { latestSessions, normalizePath } from './sessions'
import type { Ticket } from './tickets'

export interface BoardRow {
  ticket: Ticket
  sessions: Session[]
}

/** Last segment of a path, normalised: "C:\Projects\Proj" and "Proj" both give "proj". */
export function folderName(path: string): string {
  const normalized = normalizePath(path)
  return normalized.slice(normalized.lastIndexOf('/') + 1)
}

/**
 * One row per ticket. Each row lists the sessions whose working folder has the same name as the
 * picked project folder. A session from another folder is not shown.
 */
export function buildBoard(tickets: Ticket[], sessions: Session[], projectFolder: string): BoardRow[] {
  const project = folderName(projectFolder)
  const own = latestSessions(sessions.filter((s) => folderName(s.cwd) === project))
  return tickets
    .slice()
    .sort((a, b) => a.key.localeCompare(b.key, 'en', { numeric: true }))
    .map((ticket) => ({ ticket, sessions: own }))
}
