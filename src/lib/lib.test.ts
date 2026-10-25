import { describe, expect, it } from 'vitest'
import { buildBoard, filterRowsByStatus } from './board'
import { latestSessions, normalizePath, parseSessionFiles, parseSessionLine, parseSessionNameLine } from './sessions'
import { parseTicket, parseTicketStatus, parseTicketTitle, ticketKeyFromFileName } from './tickets'

describe('tickets', () => {
  it('reads the key from a ticket file name', () => {
    expect(ticketKeyFromFileName('IT-101-sample-ticket.md')).toBe('IT-101')
    expect(ticketKeyFromFileName('README.md')).toBeNull()
    expect(ticketKeyFromFileName('IT-101.txt')).toBeNull()
  })

  it('reads the status line', () => {
    const md = '# IT-1\n\n**Status:** READY FOR REVIEW\n\nbody'
    expect(parseTicketStatus(md)).toBe('READY FOR REVIEW')
  })

  it('returns UNKNOWN when there is no status line or an unknown value', () => {
    expect(parseTicketStatus('# no status here')).toBe('UNKNOWN')
    expect(parseTicketStatus('**Status:** SOMETHING ELSE')).toBe('UNKNOWN')
  })

  it('builds a ticket only from a ticket file', () => {
    expect(parseTicket('IT-9-x.md', '**Status:** DONE')).toEqual({ key: 'IT-9', status: 'DONE', title: null })
    expect(parseTicket('notes.md', '**Status:** DONE')).toBeNull()
  })

  it('fills the title from the heading', () => {
    expect(parseTicket('IT-202-x.md', '# IT-202 - Fix the nightly sync job\n\n**Status:** OPEN')).toEqual({
      key: 'IT-202',
      status: 'OPEN',
      title: 'Fix the nightly sync job',
    })
  })
})

describe('parseTicketTitle', () => {
  it('strips the key and an em dash separator, keeping another key inside the title', () => {
    expect(parseTicketTitle('# IT-201 — Disk cleanup (IT-199) follow-up before go-live')).toBe(
      'Disk cleanup (IT-199) follow-up before go-live',
    )
  })

  it('strips a hyphen separator', () => {
    expect(parseTicketTitle('# IT-202 - Fix the nightly sync job')).toBe('Fix the nightly sync job')
  })

  it('strips a colon separator and keeps a colon inside the title', () => {
    expect(parseTicketTitle('# IT-203: Report tool: one EXE and a searchable dropdown')).toBe(
      'Report tool: one EXE and a searchable dropdown',
    )
  })

  it('returns null when only the key is left', () => {
    expect(parseTicketTitle('# IT-204')).toBeNull()
  })

  it('returns null when there is no "# " line', () => {
    expect(parseTicketTitle('**Status:** OPEN')).toBeNull()
  })
})

describe('sessions', () => {
  it('parses a valid session line', () => {
    const line = JSON.stringify({ sessionId: 'abc', cwd: 'C:\\Proj', timestamp: '2026-10-19T10:00:00Z' })
    expect(parseSessionLine(line)).toEqual({ id: 'abc', cwd: 'C:\\Proj', lastActivity: '2026-10-19T10:00:00Z', name: null })
  })

  it('returns null for a bad or incomplete line', () => {
    expect(parseSessionLine('')).toBeNull()
    expect(parseSessionLine('{ not json')).toBeNull()
    expect(parseSessionLine(JSON.stringify({ cwd: 'C:\\Proj' }))).toBeNull()
  })

  it('keeps the latest line per session', () => {
    const latest = latestSessions([
      { id: 'a', cwd: 'x', lastActivity: '2026-10-19T10:00:00Z', name: null },
      { id: 'a', cwd: 'x', lastActivity: '2026-10-19T12:00:00Z', name: null },
      { id: 'b', cwd: 'x', lastActivity: '2026-10-19T11:00:00Z', name: null },
    ])
    expect(latest.map((s) => s.id)).toEqual(['a', 'b'])
    expect(latest[0].lastActivity).toBe('2026-10-19T12:00:00Z')
  })

  it('reads a session name line and ignores other lines', () => {
    expect(parseSessionNameLine(JSON.stringify({ type: 'custom-title', customTitle: ' Homework ', sessionId: 'a' }))).toEqual(
      { id: 'a', source: 'custom', name: 'Homework' },
    )
    expect(parseSessionNameLine(JSON.stringify({ type: 'ai-title', aiTitle: 'Fix the filter', sessionId: 'a' }))).toEqual({
      id: 'a',
      source: 'ai',
      name: 'Fix the filter',
    })
    expect(parseSessionNameLine(JSON.stringify({ type: 'custom-title', customTitle: '  ', sessionId: 'a' }))).toBeNull()
    expect(parseSessionNameLine(JSON.stringify({ type: 'user', sessionId: 'a', cwd: 'C:\\Proj' }))).toBeNull()
  })

  it('normalises Windows paths for comparison', () => {
    expect(normalizePath('C:\\Projects\\Proj\\')).toBe('c:/projects/proj')
  })
})

describe('board', () => {
  const tickets = [
    { key: 'IT-10', status: 'OPEN' as const, title: null },
    { key: 'IT-2', status: 'DONE' as const, title: null },
  ]
  const sessions = [
    { id: 's1', cwd: 'C:\\Projects\\SampleBoard', lastActivity: '2026-10-19T10:00:00Z', name: null },
    { id: 's2', cwd: 'C:\\Projects\\Other', lastActivity: '2026-10-19T11:00:00Z', name: null },
  ]

  it('sorts tickets by number', () => {
    const rows = buildBoard(tickets, sessions, 'SampleBoard')
    expect(rows.map((r) => r.ticket.key)).toEqual(['IT-2', 'IT-10'])
  })

  it('matches the picked folder name against an absolute Windows cwd', () => {
    const rows = buildBoard(tickets, sessions, 'SampleBoard')
    expect(rows[0].sessions.map((s) => s.id)).toEqual(['s1'])
  })

  it('keeps a session from another folder out of the board', () => {
    const rows = buildBoard(tickets, sessions, 'SampleBoard')
    expect(rows.flatMap((r) => r.sessions.map((s) => s.id))).not.toContain('s2')
  })

  it('matches a POSIX cwd by the same folder name', () => {
    const rows = buildBoard(
      tickets,
      [{ id: 's3', cwd: '/home/student/SampleBoard/', lastActivity: '2026-10-19T12:00:00Z', name: null }],
      'sampleboard',
    )
    expect(rows[0].sessions.map((s) => s.id)).toEqual(['s3'])
  })
})

describe('filterRowsByStatus', () => {
  const tickets = [
    { key: 'IT-1', status: 'OPEN' as const, title: null },
    { key: 'IT-2', status: 'DONE' as const, title: null },
    { key: 'IT-3', status: 'IN REVIEW' as const, title: null },
  ]
  const rows = buildBoard(tickets, [], 'Proj')
  const keys = (r: typeof rows) => r.map((row) => row.ticket.key)

  it('keeps tickets in any of the selected statuses', () => {
    expect(keys(filterRowsByStatus(rows, new Set(['OPEN', 'IN REVIEW'])))).toEqual(['IT-1', 'IT-3'])
    expect(keys(filterRowsByStatus(rows, new Set(['DONE'])))).toEqual(['IT-2'])
  })

  it('keeps every ticket when nothing is selected', () => {
    expect(keys(filterRowsByStatus(rows, new Set()))).toEqual(['IT-1', 'IT-2', 'IT-3'])
  })
})

describe('parseSessionFiles', () => {
  const line = (record: object) => JSON.stringify(record)
  const file = (name: string, lines: object[]) => ({ name, text: async () => lines.map(line).join('\n') })
  const activity = (id: string, timestamp: string) => ({ type: 'user', sessionId: id, cwd: 'C:\\Proj', timestamp })

  it('gives a session its name, preferring the last name the user gave over the generated title', async () => {
    const result = await parseSessionFiles([
      file('a.jsonl', [
        activity('a', '2026-10-19T10:00:00Z'),
        { type: 'ai-title', aiTitle: 'Generated title', sessionId: 'a' },
        { type: 'custom-title', customTitle: 'First name', sessionId: 'a' },
        { type: 'custom-title', customTitle: 'Renamed', sessionId: 'a' },
        { type: 'ai-title', aiTitle: 'Later generated title', sessionId: 'a' },
      ]),
      file('b.jsonl', [activity('b', '2026-10-19T11:00:00Z'), { type: 'ai-title', aiTitle: 'Only a title', sessionId: 'b' }]),
    ])
    expect(latestSessions(result.sessions).map((s) => [s.id, s.name])).toEqual([
      ['b', 'Only a title'],
      ['a', 'Renamed'],
    ])
    expect(result.skipped).toBe(0)
  })

  it('keeps a session without a name, with a null name', async () => {
    const result = await parseSessionFiles([file('c.jsonl', [activity('c', '2026-10-19T10:00:00Z')])])
    expect(result.sessions).toEqual([{ id: 'c', cwd: 'C:\\Proj', lastActivity: '2026-10-19T10:00:00Z', name: null }])
  })

  it('skips and counts a file that fails to read, and still loads the others', async () => {
    const unreadable = {
      name: 'busy.jsonl',
      text: () => Promise.reject(new DOMException('changed after pick', 'NotReadableError')),
    }
    const result = await parseSessionFiles([
      file('a.jsonl', [activity('a', '2026-10-19T10:00:00Z')]),
      unreadable,
      file('notes.txt', [activity('x', '2026-10-19T10:00:00Z')]),
      file('b.jsonl', [activity('b', '2026-10-19T11:00:00Z')]),
    ])
    expect(result.skipped).toBe(1)
    expect(result.sessions.map((s) => s.id)).toEqual(['a', 'b'])
  })
})
