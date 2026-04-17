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
          api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `provider` | Yes | LLM provider: `anthropic`, `openai`, or `openrouter` |
| `model` | Yes | Model name (e.g., `claude-sonnet-4-20250514`, `gpt-4o`) |
| `api_key` | Yes | API key for the provider |
| `conventions` | No | Path to conventions/instructions file |
| `ignore` | No | Comma-separated glob patterns to ignore |

## Outputs

| Output | Description |
|--------|-------------|
| `verdict` | Review verdict: `approve`, `request_changes`, or `comment` |
| `summary` | Brief summary of the review |
| `findings_count` | Number of issues found |

## Conventions

The action automatically looks for a conventions file in these locations:
- `.open-review/CONVENTIONS.md`
- `CONVENTIONS.md`
- `.github/CONVENTIONS.md`
- `docs/CONVENTIONS.md`
- `CLAUDE.md`

Or specify a custom path with the `conventions` input.

## Examples

### Using OpenAI

```yaml
- uses: elliottlawson/open-review-action@v1
  with:
    provider: openai
    model: gpt-4o
    api_key: ${{ secrets.OPENAI_API_KEY }}
```

### With Custom Conventions

```yaml
- uses: elliottlawson/open-review-action@v1
  with:
    provider: anthropic
    model: claude-sonnet-4-20250514
    api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    conventions: .github/review-rules.md
```

### Ignoring Files

```yaml
- uses: elliottlawson/open-review-action@v1
  with:
    provider: anthropic
    model: claude-sonnet-4-20250514
    api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    ignore: "*.lock,dist/**,vendor/**"
```

## Configuration File

You can also configure options via `.open-review.yml` in your repository:

```yaml
provider: anthropic
model: claude-sonnet-4-20250514

review:
  conventions: .github/CONVENTIONS.md

ignore:
  - "*.lock"
  - "dist/**"
```

Action inputs override config file settings.

## License

MIT
