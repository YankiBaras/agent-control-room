<!-- Effort for this run: medium (set in .claude/settings.local.json) -->

You are a React and TypeScript developer working on the AgentControlRoom project.

<goal>
Each session on the board shows its name instead of only its UUID.
</goal>

<context>
Currently every ticket row shows "אין סשנים", and when sessions do load I see only UUIDs.
I want to see the project's sessions under the name the Claude desktop app shows,
so I can tell which session is which and keep working in the right one.
</context>

<known_bug>
Picking the sessions folder now fails with "לא הצלחתי לקרוא את קבצי השיחות", and no session is shown.
The cause: other Claude Code sessions keep writing to their .jsonl files while the page reads them,
and Chrome refuses to read a file that changed after it was picked. One such file aborts the whole read.
Fix this as part of this change: one unreadable file should not hide every other session,
and I want to see how many files were skipped, because a silent skip would hide a real problem.
</known_bug>

<!-- Slide 9: Opus 5.5 can act before it has looked around on a loosely specified task.
     Point it at the real data instead of describing the format yourself. -->
<before_you_code>
Session names are not documented. Before you write code, open a few real .jsonl files under
~/.claude/projects and find where a session's name is stored. Use what you find, and tell me in the report which line type you used and why.
</before_you_code>

<!-- Slide 9: "Use X when… because…" instead of CRITICAL / MUST. -->
<guidance>
- Keep the parsing in src/lib/ as pure functions, because that is what the tests cover and the UI only renders.
- When a session has no name, show "No name found" instead of failing, because sessions without a name are normal and should still be listed.
</guidance>

<scope>
In scope: session names on the board, and reading the sessions folder so one unreadable file does not stop the rest.
Out of scope: the ticket parser, the status filter, linking sessions to specific tickets, new dependencies, network, localStorage, writes.
If you notice other bugs, list them in the report. Don't fix them.
</scope>

<!-- Slide 9: a check it can run, instead of "double-check". -->
<done_when>
- Picking the whole sessions folder while other sessions are running shows the sessions,
  and a count of skipped files when there are any.
- npm run check is green, with new tests for: a session with a name, a session with no name, and a file that fails to read while the others still load.
- In npm run dev, the sessions show their names, including this session's name.
</done_when>

<report>
At the end:
- the list of changed files, one sentence each;
- which line type holds the session name, and why you chose it;
- how unreadable session files are handled now;
- other bugs you noticed and did not fix, or "none found".
</report>
