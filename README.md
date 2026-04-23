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
| `verdict` | Review verdict: `approve`, `changes_needed`, or `hold` |
| `summary` | Brief summary of the review |
| `findings_count` | Number of issues found |

## Conventions

You can configure a conventions/instructions file via `.open-review.yml`:

```yaml
review:
  instructions_file: .github/CONVENTIONS.md
```

Or use the `conventions` input to specify a custom path.

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
