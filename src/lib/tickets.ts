export type TicketStatus =
  | 'OPEN'
  | 'IN DEVELOPMENT'
  | 'READY FOR REVIEW'
  | 'IN REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DONE'
  | 'UNKNOWN'

export interface Ticket {
  key: string
  status: TicketStatus
}

/** Every status a board row can have, in workflow order (UNKNOWN last). */
export const ALL_STATUSES: TicketStatus[] = [
  'OPEN',
  'IN DEVELOPMENT',
  'READY FOR REVIEW',
  'IN REVIEW',
  'APPROVED',
  'REJECTED',
  'DONE',
  'UNKNOWN',
]

const TICKET_FILE = /^IT-\d+(?:-[\w-]+)?\.md$/i
const STATUS_LINE = /^\*\*Status:\*\*\s*(.+?)\s*$/m

/** Returns the ticket key (for example "IT-101") for a file name such as "IT-101-slug.md", or null. */
export function ticketKeyFromFileName(fileName: string): string | null {
  if (!TICKET_FILE.test(fileName)) return null
  const match = /^(IT-\d+)/i.exec(fileName)
  return match ? match[1].toUpperCase() : null
}

/** Reads the **Status:** line of a ticket MD file. Anything unrecognised becomes UNKNOWN. */
export function parseTicketStatus(markdown: string): TicketStatus {
  const match = STATUS_LINE.exec(markdown)
  if (!match) return 'UNKNOWN'
  const value = match[1].trim().toUpperCase()
  const known: TicketStatus[] = [
    'OPEN',
    'IN DEVELOPMENT',
    'READY FOR REVIEW',
    'IN REVIEW',
    'APPROVED',
    'REJECTED',
    'DONE',
  ]
  return (known.find((s) => s === value) ?? 'UNKNOWN') as TicketStatus
}

/** Builds a ticket from one docs file, or returns null when the file name is not a ticket file. */
export function parseTicket(fileName: string, markdown: string): Ticket | null {
  const key = ticketKeyFromFileName(fileName)
  if (!key) return null
  return { key, status: parseTicketStatus(markdown) }
}
