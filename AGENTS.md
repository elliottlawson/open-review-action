# Agent Guide: Open Review Action

This project is a **GitHub Action** that posts AI-generated code reviews as comments on pull requests. The action runs the `open-review` CLI, formats the JSON result into a Markdown comment, and posts it via the GitHub API.

## Source of Truth

**`formatter.js`** is the source of truth for how the PR review comment is rendered. It defines every section, spacing rule, icon reference, badge style, and code block convention.

## Key Files

| File | Purpose |
|---|---|
| `formatter.js` | Transforms JSON review results into GitHub-flavored Markdown |
| `format-and-post.js` | Orchestrates fetching PR metadata, finding existing comments, and posting/updating |
| `action.yml` | GitHub Action input/output definitions and composite run steps |

## Current Design Summary

- Verdict badge via `forthebadge.com`
- Bold `**Review Overview**` heading + compact shields.io flat-square badges for section counts
- Section headers: left Octicon (`height="16"`), hardcoded title, right-aligned shields.io count badge (`align="right"`, `height="20"`)
- No horizontal rules between sections
- Clickable file paths when PR metadata is available
- Language-aware code blocks (`php`, `diff`, etc.) instead of generic `suggestion`
- Collapsible `<details>` wrapper for Suggestions
- Footer with version, timestamp, and hidden metadata comment

## Dependencies

- `@octokit/rest` — GitHub API client
- Node 22 (via `actions/setup-node@v4`)
- `open-review` CLI (installed at runtime from `elliottlawson/open-review`)

## Environment

- `GITHUB_TOKEN` — Required for posting/updating comments
- `TIMEZONE` — Optional, defaults to `UTC`
- `REPO`, `PR_NUMBER` — Set by `action.yml`
- `RESULT_FILE` — Temp file path containing the CLI's JSON output

## Planning Directory

This project uses a `plans/` directory (ignored by git) to track pending and completed work:

```
plans/
├── pending/     # Work waiting to be picked up
└── complete/    # Work that has been finished
```

- **Starting work**: Check `plans/pending/` for the next spec to implement
- **Finishing work**: Move the completed plan from `plans/pending/` to `plans/complete/`

This is a lightweight coordination system for tracking what has been specced vs what has been built.

## Change Workflow

When changing action behavior:

1. Check `plans/pending/` for existing specs
2. If changing template rendering, update `formatter.js` directly (it's the source of truth)
3. If changing how the action orchestrates or posts, update `format-and-post.js`
4. Run `node --check` to verify syntax
5. If the CLI output contract changes, check `plans/` for related specs and update accordingly
