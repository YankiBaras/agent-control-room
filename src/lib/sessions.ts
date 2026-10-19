export interface Session {
  id: string
  cwd: string
  lastActivity: string
}

/** Turns a Windows or POSIX path into one comparable form: lower case, forward slashes, no trailing slash. */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
}

/**
 * Reads one line of a Claude Code session file (.jsonl).
 * Returns null for a blank line, a line that is not JSON, or a line without a session id and working folder.
 */
export function parseSessionLine(line: string): Session | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  let record: unknown
  try {
    record = JSON.parse(trimmed)
  } catch {
    return null
  }
  if (typeof record !== 'object' || record === null) return null
  const r = record as Record<string, unknown>
  if (typeof r.sessionId !== 'string' || typeof r.cwd !== 'string') return null
  const timestamp = typeof r.timestamp === 'string' ? r.timestamp : ''
  return { id: r.sessionId, cwd: r.cwd, lastActivity: timestamp }
}

/** Keeps the latest activity per session id, so a session with many lines appears once. */
export function latestSessions(sessions: Session[]): Session[] {
  const byId = new Map<string, Session>()
  for (const s of sessions) {
    const current = byId.get(s.id)
    if (!current || s.lastActivity > current.lastActivity) byId.set(s.id, s)
  }
  return [...byId.values()].sort((a, b) => (a.lastActivity < b.lastActivity ? 1 : -1))
}
