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
- Collapsible `<details>` wrapper for any section based on `collapse` config
- Footer with version, timestamp, and hidden metadata comment

## Dependencies

- `@octokit/rest` — GitHub API client
- Node 22 (via `actions/setup-node@v4`)
- `open-review` CLI (installed at runtime via `npm install -g open-review@1`)

## Environment

- `GITHUB_TOKEN` — Required for posting/updating comments
- `REPO`, `PR_NUMBER` — Set by `action.yml`
- `RESULT_FILE` — Temp file path containing the CLI's JSON output

## Core Service Interface

The action shells out to the `open-review` CLI. The CLI reads `.open-review/config.yml` from the repo automatically. Action inputs are translated to CLI flags when non-empty.

### CLI Invocation

```bash
open-review review . \
  --diff origin/<base-ref> \
  --json \
  [ --provider <provider> ] \
  [ --model <model> ] \
  [ --api-key <api_key> ] \
  [ --config <config_path> ] \
  [ --prompt <prompt> ] \
  [ --verbose ] \
  [ --timezone <timezone> ] \
  [ --must-fix <true|false> ] \
  [ --should-fix <true|false> ] \
  [ --suggestions <true|false> ] \
  [ --questions <true|false> ] \
  [ --collapse-must-fix <auto|always|never> ] \
  [ --collapse-should-fix <auto|always|never> ] \
  [ --collapse-suggestions <auto|always|never> ] \
  [ --collapse-questions <auto|always|never> ] \
  [ --label-approve <text> ] \
  [ --label-changes-needed <text> ] \
  [ --label-hold <text> ]
```

**Precedence**: CLI flags (action inputs) > `.open-review/config.yml` config > environment variables (`OPEN_REVIEW_API_KEY`).

### JSON Output Contract

The CLI writes a single JSON object to stdout. The action parses this from `RESULT_FILE`.

#### Normal Review

```typescript
interface AgentOutput {
  verdict: 'approve' | 'changes_needed' | 'hold';
  summary: string;
  findings: AgentFinding[];
  sectionSummaries?: {
    mustFix?: string;
    shouldFix?: string;
    questions?: string;
    suggestions?: string;
  };
  stats: {
    critical: number;
    warnings: number;
    suggestions: number;
    tokens: number;
  };
  sections?: {
    must_fix?: { enabled?: boolean; collapse?: 'auto' | 'always' | 'never' };
    should_fix?: { enabled?: boolean; collapse?: 'auto' | 'always' | 'never' };
    suggestions?: { enabled?: boolean; collapse?: 'auto' | 'always' | 'never' };
    questions?: { enabled?: boolean; collapse?: 'auto' | 'always' | 'never' };
  };
  verdicts?: {
    approve?: { label?: string };
    changes_needed?: { label?: string };
    hold?: { label?: string };
  };
  timezone?: string;
  disciplineWarnings?: string[];
}

interface AgentFinding {
  id?: string;
  type: 'issue' | 'suggestion' | 'question';
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  file?: string;
  line?: number;
  suggestedFix?: string;
}
```

#### Skipped Review

```typescript
interface SkippedOutput {
  skipped: true;
  reason: string;
  files: string[];
}
```

**Action behavior**: When `skipped: true`, the action does **not** post a comment. It outputs `verdict=skipped`, `summary=reason`, `findings_count=0`, and `skipped=true`.

### Formatter Inputs

`format-and-post.js` reads the parsed JSON and passes it to `formatForGitHub(result, version, baseUrl)`. The formatter reads presentation settings directly from the JSON output.

**JSON fields consumed by `formatter.js`**:

| Field | Purpose |
|---|---|
| `result.timezone` | Timestamp formatting (falls back to harness default) |
| `result.sections[key].collapse` | Per-section collapse behavior (default: `never`) |
| `result.sections[key].enabled` | Per-section visibility (default: `true`) |
| `result.verdicts[key].label` | Verdict label overrides |

If these fields are missing (older CLI version), the formatter falls back to sensible defaults.

### Architecture Note

The action does **not** bundle methodology, presets, or prompts. The harness reads these from the checked-out repo at runtime:
- **Config**: `.open-review/config.yml` (optional; harness falls back to built-in defaults)
- **Methodology**: Built-in default, or local override at `.open-review/methodology/core.md`
- **Presets**: Built-in defaults, or local overrides at `.open-review/presets/`
- **Conventions**: Auto-discovered by the agent, or specified in config

This keeps the action thin and ensures the harness is the single source of truth for review behavior.

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
4. If changing inputs/outputs or CLI passthrough, update `action.yml`
5. Run `node --check` to verify syntax
6. If the CLI output contract changes, update this doc and check `plans/` for related specs
