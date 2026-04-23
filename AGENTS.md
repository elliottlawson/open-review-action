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
