# Agent Instructions

This repository uses Cursor rules as part of its working context.

At the start of every new conversation or task in this repo, read and apply the rules in:

- `.cursor/rules/projectrules.mdc`
- `.cursor/rules/product.mdc`
- `.cursor/rules/styling-guidelines.mdc`
- `.cursor/rules/Uniwind-styling.mdc`

If additional rule files are added under `.cursor/rules/`, treat them as part of the default repo instructions as well.

These rules should be considered required repository context before making code changes, proposing implementations, or reviewing code.

Additional repo-specific expectations:

- Reply concisely; no filler.
- Be strictly honest; only claim checks you actually performed.
- During edits, match existing style and reuse existing utils/components if you can
- Before implementing with any new or existing package, use Exa Search MCP to check current best practices, implementation patterns, breaking changes, and version compatibility.
- For library-specific questions or implementation details, use Context7 MCP to fetch up-to-date documentation.
- Always check for existing patterns in the codebase before creating new ones.
- Fix root causes rather than symptoms or narrow patches.
- If uncertain, read more local code and docs before choosing an approach.
- If still blocked, ask a short question with concrete options.
- If instructions conflict, call out the conflict and choose the safer path.
- Treat unexpected local changes as user or other-agent work; do not revert them unless asked.
- Leave short breadcrumb notes in the thread when making non-obvious decisions.
- Flag security issues and propose fixes when relevant.
