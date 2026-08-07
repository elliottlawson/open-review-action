# Agent Guide: Open Review Action

This project is a **GitHub Action** that posts AI-generated code reviews as comments on pull requests. The action runs the **opencode agent** with the open-review skills, formats the JSON result into a Markdown comment, and posts it via the GitHub API.

## Source of Truth

**`formatter.js`** is the source of truth for how the PR review comment is rendered. It defines every section, spacing rule, icon reference, badge style, and code block convention.

## Key Files

| File | Purpose |
|---|---|
| `formatter.js` | Transforms JSON review results into GitHub-flavored Markdown |
| `format-and-post.js` | Overlays presentation inputs onto the result, orchestrates fetching PR metadata, finding existing comments, and posting/updating |
| `extract-json.js` | Pulls the review JSON object out of raw opencode stdout (string-aware balanced-brace scan; tolerates markdown fences) |
| `action.yml` | GitHub Action input/output definitions and composite run steps |

## The Engine

There is no CLI and no config file. Per run, the action:

1. Installs `opencode-ai` globally and the `review` + `review-as-json` skills via
   `npx skills add elliottlawson/open-review#<tag>` — **pinned to an open-review
   release tag** (`SKILLS_REF` in `action.yml`). Bump the pin deliberately per
   release; it controls which version of the review methodology CI runs.
2. Runs `opencode run --auto` (with `OPENCODE_CONFIG_CONTENT={"permission":{"edit":"deny"}}`)
   instructing the agent to use the `review-as-json` skill on
   `git diff origin/<base>...HEAD`. Retries up to 3 attempts when a run yields
   no usable JSON (the provider occasionally returns an empty completion, and
   opencode exits 0 with no output); opencode's stderr is replayed to the log
   per attempt, and retries run with `--print-logs`.
3. Extracts the JSON (`extract-json.js`), posts/updates the comment
   (`format-and-post.js`).

Review *behavior* lives in the skills (the six passes, conventions packs,
`REVIEW.md` discovery) — never here. The action is a thin runner + renderer.

## Current Design Summary

- Verdict badge via `forthebadge.com`
- Bold `**Review Overview**` heading + compact shields.io flat-square badges for section counts
- Section headers: left Octicon (`height="16"`), hardcoded title, right-aligned shields.io count badge (`align="right"`, `height="20"`)
- No horizontal rules between sections
- Clickable file paths when PR metadata is available
- Language-aware code blocks (`php`, `diff`, etc.) instead of generic `suggestion`
- Collapsible `<details>` wrapper for any section based on `collapse` config
- Footer with version, timestamp, and hidden metadata comment

## Dependencies

- `@octokit/rest` — GitHub API client
- Node 22 (via `actions/setup-node@v4`)
- `opencode-ai` npm package (installed at runtime)
- open-review skills (installed at runtime from the pinned tag)

## Environment

- `GITHUB_TOKEN` — Required for posting/updating comments
- `REPO`, `PR_NUMBER` — Set by `action.yml`
- `RESULT_FILE` — Temp file path containing the extracted review JSON

## JSON Contract

The agent (via the `review-as-json` skill) emits a single JSON object. The action parses this from `RESULT_FILE`.

### Normal Review

```typescript
interface ReviewOutput {
  verdict: 'approve' | 'changes_needed' | 'hold';
  summary: string;
  findings: ReviewFinding[];
  passes: {
    mission: 'met' | 'missing' | 'different' | 'unclear';
    architecture: 'ok' | 'concern' | 'blocking';
    implementation: 'ok' | 'concern' | 'blocking';
    craft: 'ok' | 'concern' | 'blocking';
    security: 'ok' | 'concern' | 'blocking';
    performance: 'ok' | 'concern' | 'blocking';
  };
  sectionSummaries?: {
    mustFix?: string;
    shouldFix?: string;
    questions?: string;
    suggestions?: string;
  };
}

interface ReviewFinding {
  severity: 'critical' | 'warning' | 'info';
  type: 'issue' | 'suggestion' | 'question';
  category: 'mission' | 'architecture' | 'implementation' | 'craft' | 'security' | 'performance';
  title: string;
  description: string;
  file?: string;
  line?: number;
  suggestedFix?: string;
}
```

### Skipped Review

```typescript
interface SkippedOutput {
  skipped: true;
  reason: string;
  files: string[];
}
```

**Action behavior**: When `skipped: true`, the action does **not** post a comment. It outputs `verdict=skipped`, `summary=reason`, `findings_count=0`, and `skipped=true`.

### Presentation Inputs

The engine emits review content only. `format-and-post.js#applyPresentationInputs`
overlays the action's presentation inputs (section visibility/collapse, verdict
labels, timezone) onto the result before formatting — precedence: action input >
engine value > default (sections enabled, collapse `auto`; labels LGTM / Changes
Needed / Hold; timezone America/New_York).

**Fields consumed by `formatter.js`** after the overlay:

| Field | Purpose |
|---|---|
| `result.timezone` | Timestamp formatting (falls back to default) |
| `result.sections[key].collapse` | Per-section collapse behavior |
| `result.sections[key].enabled` | Per-section visibility |
| `result.verdicts[key].label` | Verdict label overrides |

## Planning Directory

This project uses a `plans/` directory (ignored by git) to track pending and completed work:

```
plans/
├── pending/     # Work waiting to be picked up
└── complete/    # Work that has been finished
```

- **Starting work**: Check `plans/pending/` for the next spec to implement
- **Finishing work**: Move the completed plan from `plans/pending/` to `plans/complete/`

## Change Workflow

When changing action behavior:

1. Check `plans/pending/` for existing specs
2. If changing template rendering, update `formatter.js` directly (it's the source of truth)
3. If changing how the action orchestrates or posts, update `format-and-post.js`
4. If changing inputs/outputs or the engine invocation, update `action.yml`
5. Run `node --check` to verify syntax
6. If the JSON contract changes, the `review-as-json` skill in open-review changed
   — update this doc, and check elliottlawson/open-review-lab for the tracking issue
