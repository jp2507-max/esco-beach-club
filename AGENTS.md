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
- Flag security issues and propose fixes when relevant.
