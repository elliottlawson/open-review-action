# Open Review Action

AI-powered code review for GitHub pull requests.

## Usage

```yaml
name: Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: elliottlawson/open-review-action@v1
        with:
          provider: anthropic
          model: claude-sonnet-4-20250514
          api_key: ${{ secrets.OPEN_REVIEW_API_KEY }}
```

## Inputs

### LLM Options

| Input | Required | Description |
|-------|----------|-------------|
| `provider` | No | LLM provider: `anthropic`, `openai`, or `openrouter` (default: `openrouter`). |
| `model` | No | Model ID from the provider's catalog (default: `moonshotai/kimi-k2.6`). Combined as `provider/model` for the engine — see `opencode models` for valid IDs. |
| `api_key` | No | API key for the provider (usually the `OPEN_REVIEW_API_KEY` secret). Mapped to the provider's env var (`OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`). |
| `config_path` | No | **Deprecated, ignored.** The opencode engine does not read `.open-review/config.yml`. |
| `prompt` | No | Ephemeral focus for this review only |
| `verbose` | No | Show review progress in logs (default: `false`) |

### Skills Version

| Input | Required | Description |
|-------|----------|-------------|
| `skills_ref` | No | Git ref of [elliottlawson/open-review](https://github.com/elliottlawson/open-review) to install the review skills from: tag or branch (default: `v0.2.0`). The skills CLI cannot resolve raw commit shas. |

### Output Options

| Input | Required | Description |
|-------|----------|-------------|
| `timezone` | No | IANA timezone for timestamps (default: `America/New_York`). |

### Section Visibility

| Input | Required | Description |
|-------|----------|-------------|
| `must_fix` | No | Enable/disable must fix section (default: `true`) |
| `should_fix` | No | Enable/disable should fix section (default: `true`) |
| `suggestions` | No | Enable/disable suggestions section (default: `true`) |
| `questions` | No | Enable/disable questions section (default: `true`) |

### Section Collapse

| Input | Required | Description |
|-------|----------|-------------|
| `collapse_must_fix` | No | Collapse behavior: `auto`, `always`, `never` (default: `auto`) |
| `collapse_should_fix` | No | Collapse behavior: `auto`, `always`, `never` (default: `auto`) |
| `collapse_suggestions` | No | Collapse behavior: `auto`, `always`, `never` (default: `auto`) |
| `collapse_questions` | No | Collapse behavior: `auto`, `always`, `never` (default: `auto`) |

### Verdict Labels

| Input | Required | Description |
|-------|----------|-------------|
| `label_approve` | No | Custom label for approve verdict (default: `LGTM`) |
| `label_changes_needed` | No | Custom label for changes_needed verdict (default: `Changes Needed`) |
| `label_hold` | No | Custom label for hold verdict (default: `Hold`) |

## Outputs

| Output | Description |
|--------|-------------|
| `verdict` | Review verdict: `approve`, `changes_needed`, `hold`, or `skipped` |
| `summary` | Brief summary of the review |
| `findings_count` | Number of issues found |
| `skipped` | Whether the review was skipped (`true` or `false`) |

## How It Works

The action runs an agent loop instead of a fixed CLI pipeline:

1. Installs the [opencode](https://opencode.ai) agent CLI and the `review` / `review-as-json` agent skills (from [elliottlawson/open-review](https://github.com/elliottlawson/open-review), pinned to a release tag) into the checked-out repository.
2. Runs `opencode run` with the `review-as-json` skill against `git diff origin/<base>...HEAD`. The agent reviews the diff in six passes — mission, architecture, implementation, craft, security, performance — reading your repo's own `REVIEW.md`, `AGENTS.md`, and docs to judge "correct" against your project's actual standards.
3. Emits the verdict and findings as structured JSON, which the action renders into the PR comment.

There is no config file. Review behavior comes from the skills plus your repo's documentation; comment presentation comes from the action inputs above.

## Examples

### Using OpenAI

```yaml
- uses: elliottlawson/open-review-action@v1
  with:
    provider: openai
    model: gpt-4o
    api_key: ${{ secrets.OPEN_REVIEW_API_KEY }}
```

### With Custom Config Path

```yaml
- uses: elliottlawson/open-review-action@v1
  with:
    provider: anthropic
    model: claude-sonnet-4-20250514
    api_key: ${{ secrets.OPEN_REVIEW_API_KEY }}
    config_path: .github/open-review/config.yml
```

### With Ephemeral Focus

```yaml
- uses: elliottlawson/open-review-action@v1
  with:
    provider: anthropic
    model: claude-sonnet-4-20250514
    api_key: ${{ secrets.OPEN_REVIEW_API_KEY }}
    prompt: "Focus on security vulnerabilities in authentication code"
```

### Custom Verdict Labels

```yaml
- uses: elliottlawson/open-review-action@v1
  with:
    provider: anthropic
    model: claude-sonnet-4-20250514
    api_key: ${{ secrets.OPEN_REVIEW_API_KEY }}
    label_approve: "SHIP IT"
    label_changes_needed: "BLOCKED"
    label_hold: "DISCUSS"
```

### Hide Suggestions Section

```yaml
- uses: elliottlawson/open-review-action@v1
  with:
    provider: anthropic
    model: claude-sonnet-4-20250514
    api_key: ${{ secrets.OPEN_REVIEW_API_KEY }}
    suggestions: false
```

### Collapse All Sections

```yaml
- uses: elliottlawson/open-review-action@v1
  with:
    provider: anthropic
    model: claude-sonnet-4-20250514
    api_key: ${{ secrets.OPEN_REVIEW_API_KEY }}
    collapse_must_fix: always
    collapse_should_fix: always
    collapse_suggestions: always
    collapse_questions: always
```

### Custom Timezone

```yaml
- uses: elliottlawson/open-review-action@v1
  with:
    provider: anthropic
    model: claude-sonnet-4-20250514
    api_key: ${{ secrets.OPEN_REVIEW_API_KEY }}
    timezone: Europe/London
```

## License

MIT
