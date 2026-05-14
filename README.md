# LocalRun

A terminal UI for managing your localhost development servers. No more remembering paths and commands — add them once, start and stop them from a single place.


## Features

- **Start / stop servers** with `Enter` or `Space`
- **Auto-detect port** from process output — shown as soon as the server is up
- **Copy URL** to clipboard with `c` (`http://localhost:PORT`)
- **Servers keep running** after you close the TUI — reconnects on next launch
- **Start at login** via macOS LaunchAgent
- **Add to shell** — optional `localrun` alias written to `~/.zshrc`
- **Dynamic layout** — adapts to any terminal width

## Install

```bash
npm install -g localrun
```

Or run without installing:

```bash
npx localrun
```

## Usage

```
LocalRun  localhost server manager

▶  my-blog    ● running :3000
   npm run dev             192.168.1.5:3000

──────────────────────────────────────────────────
↑↓ navigate   Enter / Space start·stop   c copy url
add  edit  delete  ? help  q quit
```

### Keybindings

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate server list |
| `Enter` / `Space` | Start or stop selected server |
| `c` | Copy `http://localhost:PORT` to clipboard |
| `a` | Add new server |
| `e` | Edit selected server |
| `d` | Delete selected server |
| `?` | Show help / welcome screen |
| `q` | Quit (servers keep running) |

### Adding a server

Press `a` and fill in:

- **Name** — a short label shown in the list
- **Start** — the command to start the server (e.g. `npm run dev`, `npx serve ./dist`)
- **Stop** — optional stop command; falls back to `SIGTERM` if left blank
- **Start at login** — toggle to register a macOS LaunchAgent

### Servers survive TUI exit

Servers are spawned as detached processes. Closing LocalRun (or pressing `q`) does **not** stop them. When you reopen LocalRun it reconnects to any already-running servers and picks up their ports.

To stop a server, select it and press `Enter` or `Space`.

## Requirements

- Node.js 18+
- macOS (LaunchAgent and `pbcopy` features are macOS-only; core functionality works on Linux/WSL)

## Development

```bash
git clone https://github.com/appecta/localrun
cd localrun
npm install      # also runs the build step
node dist/localrun.js
```

To rebuild after editing source files:

```bash
npm run build
```

Source files are in `src/` and use JSX (compiled by esbuild — no separate dev server needed).

## License

MIT
