# Gantry

A terminal UI for visualizing and managing macOS launchctl/launchd scheduled jobs.

Gantry gives you a clear overview of all your launch agents and daemons — their schedules, health status, logs, and more — without memorizing `launchctl` commands.

## Install

```bash
npm install -g @elicollinson/gantry-cli
```

Then run:

```bash
gantry
```

> **Tip:** For better performance, run with [Bun](https://bun.sh):
>
> ```bash
> bun gantry
> ```

### Requirements

- macOS (uses `launchctl` and `plutil`)
- Node.js 18+ or Bun 1.0+

## Features

- Browse all launch agents and daemons in a scrollable list
- Search and filter jobs in real time
- View job details: schedule, program, log output, health status
- Edit schedules for user agents (natural language or cron syntax)
- Run jobs on demand with `launchctl kickstart`
- Live tail log files after triggering a job
- Toggle visibility of `com.apple.*` system services

## Keyboard Shortcuts

### List View

| Key | Action |
|-----|--------|
| `Up/Down` | Navigate jobs |
| `Enter` | Open detail view |
| `/` | Search (type to filter, arrow keys still navigate) |
| `a` | Toggle Apple services |
| `s` | Settings |
| `r` | Refresh |
| `q` | Quit |

### Detail View

| Key | Action |
|-----|--------|
| `Esc` | Back to list |
| `Up/Down` | Scroll |
| `e` | Edit schedule (user agents only) |
| `x` | Run job |
| `t` | Live tail logs |
| `r` | Refresh |
| `q` | Quit |

### Live Tail View

| Key | Action |
|-----|--------|
| `Esc` | Back to detail |
| `Up/Down` | Scroll |
| `p` | Pause/resume |
| `q` | Quit |

## Development

Requires [Bun](https://bun.sh) for development.

```bash
# Install dependencies
bun install

# Run in dev mode
bun run src/cli.tsx

# Run tests
bun test

# Type check
bun run typecheck

# Build for distribution
bun run build
```

## Publishing

The package is published to npm via GitHub Actions when a version tag is pushed.

### Setup (one-time)

1. Create an npm access token at [npmjs.com](https://www.npmjs.com/settings/~/tokens)
2. Add it as a repository secret named `NPM_TOKEN` in GitHub repo settings

### Releasing a new version

```bash
# Bump version (creates a git tag automatically)
npm version patch   # 0.1.0 -> 0.1.1
npm version minor   # 0.1.0 -> 0.2.0
npm version major   # 0.1.0 -> 1.0.0

# Push the commit and tag to trigger the publish workflow
git push --follow-tags
```

The GitHub Action will run typecheck, tests, build, and publish to npm.

## License

MIT
