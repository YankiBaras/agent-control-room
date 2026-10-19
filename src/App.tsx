import { useMemo, useState } from 'react'
import { buildBoard, filterRowsByStatus } from './lib/board'
import { parseSessionLine, type Session } from './lib/sessions'
import { ALL_STATUSES, parseTicket, type Ticket, type TicketStatus } from './lib/tickets'
import './App.css'

/** Reads a folder the user picked. Read-only: nothing is written and nothing is sent anywhere. */
async function readTicketFiles(files: FileList): Promise<Ticket[]> {
  const tickets: Ticket[] = []
  for (const file of Array.from(files)) {
    const parts = (file.webkitRelativePath || file.name).split('/')
    if (parts.length < 2 || parts[parts.length - 2] !== 'docs') continue
    const ticket = parseTicket(file.name, await file.text())
    if (ticket) tickets.push(ticket)
  }
  return tickets
}

async function readSessionFiles(files: FileList): Promise<Session[]> {
  const sessions: Session[] = []
  for (const file of Array.from(files)) {
    if (!file.name.endsWith('.jsonl')) continue
    for (const line of (await file.text()).split('\n')) {
      const session = parseSessionLine(line)
      if (session) sessions.push(session)
    }
  }
  return sessions
}

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [projectFolder, setProjectFolder] = useState('')
  const [error, setError] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<Set<TicketStatus>>(new Set())

  const rows = useMemo(
    () => (projectFolder ? buildBoard(tickets, sessions, projectFolder) : []),
    [tickets, sessions, projectFolder],
  )
  const visibleRows = useMemo(() => filterRowsByStatus(rows, selectedStatuses), [rows, selectedStatuses])

  function toggleStatus(status: TicketStatus) {
    setSelectedStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  async function onProjectPick(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')
    try {
      setTickets(await readTicketFiles(files))
      const root = (files[0].webkitRelativePath || '').split('/')[0]
      setProjectFolder(root)
    } catch {
      setError('לא הצלחתי לקרוא את תיקיית הפרויקט')
    }
  }

  async function onSessionsPick(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')
    try {
      setSessions(await readSessionFiles(files))
    } catch {
      setError('לא הצלחתי לקרוא את קבצי השיחות')
    }
  }

  return (
    <main className="board">
      <h1>חדר בקרה לסוכנים</h1>

      <section className="pickers">
        <label>
          תיקיית הפרויקט (עם docs/)
          <input
            type="file"
            // @ts-expect-error webkitdirectory is not in the React types
            webkitdirectory=""
            onChange={(e) => onProjectPick(e.target.files)}
          />
        </label>
        <label>
          תיקיית השיחות (.claude/projects)
          <input
            type="file"
            // @ts-expect-error webkitdirectory is not in the React types
            webkitdirectory=""
            onChange={(e) => onSessionsPick(e.target.files)}
          />
        </label>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      {rows.length === 0 ? (
        <p className="empty">בחר תיקיית פרויקט כדי לראות את הטיקטים.</p>
      ) : (
        <>
        <fieldset className="status-filter">
          <legend>סינון לפי סטטוס (ללא בחירה מוצגים כולם)</legend>
          {ALL_STATUSES.map((status) => (
            <label key={status} dir="ltr">
              <input
                type="checkbox"
                checked={selectedStatuses.has(status)}
                onChange={() => toggleStatus(status)}
              />
              {status}
            </label>
          ))}
        </fieldset>
        {visibleRows.length === 0 ? (
          <p className="empty">אין טיקטים בסטטוסים שנבחרו.</p>
        ) : (
        <table>
          <thead>
            <tr>
              <th>טיקט</th>
              <th>סטטוס</th>
              <th>סשנים בפרויקט</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.ticket.key}>
                <td dir="ltr">{row.ticket.key}</td>
                <td>{row.ticket.status}</td>
                <td>
                  {row.sessions.length === 0 ? (
                    <span className="empty">אין סשנים</span>
                  ) : (
                    <ul className="sessions">
                      {row.sessions.map((s) => (
                        <li key={s.id} dir="ltr">
                          {s.id} · {s.lastActivity}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        </>
      )}
    </main>
  )
}
