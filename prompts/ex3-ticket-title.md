<!-- [Dial effort, not words] Effort for this run: medium (set in .claude/settings.local.json). The prompt never asks to "think hard". -->

<!-- [Give a role] -->
<role>
You are a React and TypeScript developer working on the AgentControlRoom project.
</role>

<!-- [Data first] The material comes before the request. -->
<data>
  <current_type file="src/lib/tickets.ts">
export interface Ticket {
  key: string
  status: TicketStatus
}
  </current_type>

  <real_ticket_first_lines>
# IT-633 — AgentControlRoom: base app
# IT-636 — Multi-select status filter on the board
  </real_ticket_first_lines>

  <current_board>
The board table has three columns: ticket key, status, sessions. The key column shows only "IT-633".
  </current_board>
</data>

<!-- [Brief once] Goal, reason, scope and done-when, stated once, up front. -->
<brief>
  <goal>Show each ticket's title next to its key on the board.</goal>
  <reason>Right now I see only "IT-633" and have to open the file to know what the ticket is about.</reason>
  <done_when>
    - npm run check is green.
    - New tests in src/lib/lib.test.ts cover every example below.
    - In npm run dev, every row shows the title, or the key alone when there is no title.
  </done_when>
</brief>

<!-- [Be specific] Exact names, files and rules instead of general wording. -->
<task>
1. In src/lib/tickets.ts, add a pure function parseTicketTitle(markdown: string): string | null.
   - Read only the first line that starts with "# ".
   - Remove the leading "# ", then remove the ticket key and the separator after it (" — ", " - " or ": ").
   - Trim spaces. Return null when there is no "# " line or nothing is left after removing the key.
2. Add title: string | null to the Ticket interface, and fill it in parseTicket.
3. In src/App.tsx, show the title in the key column after the key, with the key still in dir="ltr".
</task>

<constraints>
- Logic stays in src/lib/ with no React import.
- No new dependencies, no network, no localStorage, no writes.
- Styling only through the existing CSS variables.
- Do not change the status parser or the session code.
</constraints>

<!-- [Multishot] 3–5 diverse examples, input and exact expected output. -->
<examples>
  <example description="em dash separator; another key inside the title stays">
    <input># IT-201 — Disk cleanup (IT-199) follow-up before go-live</input>
    <output>"Disk cleanup (IT-199) follow-up before go-live"</output>
  </example>
  <example description="hyphen separator">
    <input># IT-202 - Fix the nightly sync job</input>
    <output>"Fix the nightly sync job"</output>
  </example>
  <example description="colon separator; a colon also inside the title">
    <input># IT-203: Report tool: one EXE and a searchable dropdown</input>
    <output>"Report tool: one EXE and a searchable dropdown"</output>
  </example>
  <example description="key only, nothing left">
    <input># IT-204</input>
    <output>null</output>
  </example>
  <example description="no '# ' line anywhere in the file">
    <input>**Status:** OPEN</input>
    <output>null</output>
  </example>
</examples>

<format>
At the end: the list of changed files, with one sentence per file on what changed.
</format>
