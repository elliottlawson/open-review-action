# Agent Guide: Open Review Action

This project is a **GitHub Action** that posts AI-generated code reviews as comments on pull requests. The action runs the `open-review` CLI, formats the JSON result into a Markdown comment, and posts it via the GitHub API.

## Source of Truth

**`docs/TEMPLATE_SPEC.md`** is the single source of truth for how the PR review comment is rendered. It defines every section, spacing rule, icon reference, badge style, and code block convention.

> **Rule**: If you need to change the comment template, update `docs/TEMPLATE_SPEC.md` **first**. Then diff the spec against `formatter.js` and apply the changes.

## Key Files

| File | Purpose |
|---|---|
| `docs/TEMPLATE_SPEC.md` | **Source of truth** for the GitHub comment template format |
| `formatter.js` | Transforms JSON review results into GitHub-flavored Markdown |
| `format-and-post.js` | Orchestrates fetching PR metadata, finding existing comments, and posting/updating |
| `action.yml` | GitHub Action input/output definitions and composite run steps |

## Template Change Workflow

When the user asks to change the comment appearance:

1. **Read `docs/TEMPLATE_SPEC.md`** to understand the current design.
2. **Discuss changes** with the user and update the spec.
3. **Diff the spec** against `formatter.js` to identify what code needs to change.
4. **Implement changes** in `formatter.js` (and `format-and-post.js` if metadata/linking is affected).
5. **Verify** with a test render or syntax check (`node --check`).

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
