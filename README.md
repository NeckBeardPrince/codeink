# codeink

Self-hostable web app that converts plaintext code into syntax-highlighted rich text, optimized for pasting into **Microsoft Outlook** with formatting preserved.

Outlook strips CSS classes from pasted HTML. **codeink** solves this by walking the rendered DOM, reading `getComputedStyle()` for every element, and baking the resolved colors and font weights into inline `style=""` attributes before writing to the clipboard.

## Features

- 40+ languages via a vendored copy of [highlight.js](https://highlightjs.org/) (no CDN, no external requests)
- 12 themes (dark and light)
- Auto-detect language mode
- Live split-pane preview
- Optional line numbers
- Keyboard shortcuts: `Ctrl+Enter` / `Cmd+Enter` to copy, `Tab` to indent
- Works offline (PWA with service worker)
- No build step — plain HTML/CSS/JS

## Quick Start

### Docker (recommended)

```bash
docker compose up --build
# http://localhost:8080
```

### Pull from GHCR

```bash
docker pull ghcr.io/neckbeardprince/codeink:latest
docker run -p 8080:8080 ghcr.io/neckbeardprince/codeink:latest
```

The image is based on [nginx-unprivileged](https://github.com/nginx/docker-nginx-unprivileged) and runs as a non-root user on port 8080.

### Local dev (no Docker)

```bash
go run main.go
# http://localhost:8080
```

### GitHub Pages

The app is entirely client-side, so it can also be hosted on [GitHub Pages](https://pages.github.com/). The included `pages.yml` workflow deploys automatically on push to `main`.

## How It Works

1. You paste code into the left pane
2. highlight.js renders syntax-highlighted HTML in the right pane
3. When you click **Copy as Rich Text**:
   - `inlineStyles()` clones the highlighted DOM and walks every node
   - For each `<span>`, it reads `getComputedStyle()` and writes `color`, `font-weight`, `font-style`, and `text-decoration` as inline styles
   - `resolveBackground()` walks up the DOM tree to find the actual background color (different themes set it on different elements)
   - The result is wrapped in a `<pre>` with inline styles and written to the clipboard as `text/html`
4. Paste into Outlook — formatting is preserved

## Adding Languages or Themes

**Languages:** Add the language to the `LANGUAGES` list in `scripts/update-hljs.sh`, re-run the script, then add a `<script>` tag in `index.html` for the vendored language pack and a corresponding `<option>` in the language `<select>`.

**Themes:** Add the theme to the `THEMES` list in `scripts/update-hljs.sh`, re-run the script, then add an `<option>` in the theme `<select>` in `index.html` and a path entry in `THEME_PATH` in `app.js`. If the theme is dark, add its value to the `DARK_THEMES` set in `app.js`.

## Updating highlight.js

highlight.js is vendored under `static/vendor/highlight.js/<version>/` so the app makes zero external requests:

```bash
scripts/update-hljs.sh 11.11.1   # downloads, updates references, removes old versions
```

## Project Structure

```
Dockerfile              # nginx-unprivileged (non-root), serves static files
docker-compose.yml      # One-command startup (host 8080 -> container 8080)
nginx.conf              # gzip, caching, security header includes
security-headers.conf   # Shared security headers incl. Content-Security-Policy
main.go                 # Go HTTP server for local dev (binds 127.0.0.1)
go.mod                  # Go module
scripts/
  update-hljs.sh        # Re-vendor highlight.js at a given version
static/
  index.html            # Single-page app
  style.css             # Dark UI theme, responsive grid layout
  app.js                # Highlighting, inline style resolution, clipboard copy
  favicon.svg           # SVG favicon (code brackets + ink drop)
  manifest.json         # PWA manifest
  sw.js                 # Service worker for offline support
  vendor/highlight.js/  # Vendored highlight.js core, languages, and themes
.github/
  workflows/
    docker-publish.yml  # Build + push to GHCR on push/tag
    ci.yml              # Docker smoke test, security header + vendored asset checks
    pages.yml           # Deploy to GitHub Pages
renovate.json           # Automated dependency updates
```

## License

[MIT](LICENSE)
