export interface Session {
  id: string
  cwd: string
  lastActivity: string
  /** The name the Claude app shows for the session, or null when the session has none. */
  name: string | null
}

/** A session name line. `custom` is a name the user gave, `ai` is the generated title. */
export interface SessionName {
  id: string
  source: 'custom' | 'ai'
  name: string
}

/** Anything with a name and a text reader, such as a browser File. */
export interface SessionFile {
  name: string
  text(): Promise<string>
}

export interface SessionFilesResult {
  sessions: Session[]
  /** Session files that could not be read, for example because they changed after they were picked. */
  skipped: number
}

/** Turns a Windows or POSIX path into one comparable form: lower case, forward slashes, no trailing slash. */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
}

function parseRecord(line: string): Record<string, unknown> | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  let record: unknown
  try {
    record = JSON.parse(trimmed)
  } catch {
    return null
  }
  if (typeof record !== 'object' || record === null) return null
  return record as Record<string, unknown>
}

/**
 * Reads one line of a Claude Code session file (.jsonl).
 * Returns null for a blank line, a line that is not JSON, or a line without a session id and working folder.
 * The name is always null here: it lives on separate lines, see `parseSessionNameLine`.
 */
export function parseSessionLine(line: string): Session | null {
  const r = parseRecord(line)
  if (!r || typeof r.sessionId !== 'string' || typeof r.cwd !== 'string') return null
  const timestamp = typeof r.timestamp === 'string' ? r.timestamp : ''
  return { id: r.sessionId, cwd: r.cwd, lastActivity: timestamp, name: null }
}

/**
 * Reads a session name line: `{"type":"custom-title","customTitle":…}` (a name the user gave in the app)
 * or `{"type":"ai-title","aiTitle":…}` (the generated title). These lines carry a session id but no cwd.
 * Returns null for any other line or an empty name.
 */
export function parseSessionNameLine(line: string): SessionName | null {
  const r = parseRecord(line)
  if (!r || typeof r.sessionId !== 'string') return null
  const [source, value] =
    r.type === 'custom-title' ? (['custom', r.customTitle] as const)
    : r.type === 'ai-title' ? (['ai', r.aiTitle] as const)
    : [null, null]
  if (!source || typeof value !== 'string' || !value.trim()) return null
  return { id: r.sessionId, source, name: value.trim() }
}

/** Picks one name per session: the last name the user gave, else the last generated title. */
export function sessionNamesById(names: SessionName[]): Map<string, string> {
  const custom = new Map<string, string>()
  const ai = new Map<string, string>()
  for (const n of names) (n.source === 'custom' ? custom : ai).set(n.id, n.name)
  const result = new Map(ai)
  for (const [id, name] of custom) result.set(id, name)
  return result
}

/**
 * Reads every `.jsonl` file and returns its sessions with their names.
 * A file whose read fails is skipped and counted, so one unreadable file does not hide the others.
 */
export async function parseSessionFiles(files: SessionFile[]): Promise<SessionFilesResult> {
  const sessions: Session[] = []
  const names: SessionName[] = []
  let skipped = 0
  for (const file of files) {
    if (!file.name.endsWith('.jsonl')) continue
    let text: string
    try {
      text = await file.text()
    } catch {
      skipped++
      continue
    }
    for (const line of text.split('\n')) {
      const session = parseSessionLine(line)
      if (session) {
        sessions.push(session)
        continue
      }
      const name = parseSessionNameLine(line)
      if (name) names.push(name)
    }
  }
  const byId = sessionNamesById(names)
  return { sessions: sessions.map((s) => ({ ...s, name: byId.get(s.id) ?? null })), skipped }
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
