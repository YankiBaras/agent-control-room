[Role]
You are a React and TypeScript developer working on the AgentControlRoom project.

[Context]
The board shows tickets (key and status) and the project's sessions. When there are many tickets, it's hard to see only the ones that need action, such as READY FOR REVIEW or REJECTED. I want to see, at a glance, only the tickets in the statuses I care about.

[Task]
Add a status filter above the board that lets me select several statuses at once. When no status is selected, all tickets are shown.

[Scope & done]
- Logic: a pure function in src/lib/ (no React), with tests in src/lib/lib.test.ts.
- UI: in src/App.tsx, styled only with the existing CSS variables.
- Out of scope: filtering by date, persisting the selection (no localStorage), new dependencies, changes to the existing parsing.
- Done when npm run check is green and the filter works in npm run dev.

[Format]
At the end: the list of changed files, with one sentence per file on what changed.

[Examples]
Tickets: IT-1 OPEN, IT-2 DONE, IT-3 IN REVIEW
- OPEN and IN REVIEW selected → IT-1 and IT-3 are shown
- DONE selected → IT-2 is shown
- Nothing selected → all three are shown