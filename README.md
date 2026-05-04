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
| `provider` | No | LLM provider: `anthropic`, `openai`, or `openrouter`. Can also be set in `.open-review/config.yml`. |
| `model` | No | Model name (e.g., `claude-sonnet-4-20250514`, `gpt-4o`). Can also be set in `.open-review/config.yml`. |
| `api_key` | No | API key for the provider. Can also use `OPEN_REVIEW_API_KEY` secret or `.open-review/config.yml`. |
| `config_path` | No | Path to `.open-review/config.yml` (optional, defaults to repo root) |
| `prompt` | No | Ephemeral focus for this review only |
| `verbose` | No | Show review progress in logs (default: `false`) |

### Output Options

| Input | Required | Description |
|-------|----------|-------------|
| `timezone` | No | IANA timezone for timestamps. Falls back to `.open-review/config.yml` or harness default. |

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

## Configuration File

The underlying `open-review` CLI automatically reads `.open-review/config.yml` from your repository. Action inputs are passed to the CLI as flags and take precedence over config file values.

**Precedence:** Action inputs (CLI flags) > `.open-review/config.yml` config > defaults

```yaml
version: "1.0"

llm:
  provider: anthropic
  model: claude-sonnet-4-20250514
  api_key: "${OPEN_REVIEW_API_KEY}"

review:
  methodology: default
  presets: auto
  conventions: auto

output:
  timezone: America/New_York
  sections:
    must_fix:
      enabled: true
      collapse: auto
    should_fix:
      enabled: true
      collapse: auto
    suggestions:
      enabled: true
      collapse: always
    questions:
      enabled: true
      collapse: auto
  verdicts:
    approve:
      label: "SHIP IT"
    changes_needed:
      label: "BLOCKED"
    hold:
      label: "DISCUSS"
```

Methodology and presets are built into the harness. You can customize them locally by running `npx open-review publish` or `npx open-review preset apply <name>`.

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
