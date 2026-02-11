# codeink

Self-hostable web app that converts plaintext code into syntax-highlighted rich text, optimized for pasting into **Microsoft Outlook** with formatting preserved.

Outlook strips CSS classes from pasted HTML. **codeink** solves this by walking the rendered DOM, reading `getComputedStyle()` for every element, and baking the resolved colors and font weights into inline `style=""` attributes before writing to the clipboard.

## Features

- 40+ languages via [highlight.js](https://highlightjs.org/)
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
docker run -p 8080:80 ghcr.io/neckbeardprince/codeink:latest
```

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

**Languages:** Add a `<script>` tag in `index.html` for the highlight.js language pack and a corresponding `<option>` in the language `<select>`.

**Themes:** Add an `<option>` in the theme `<select>` in `index.html`. If the theme is dark, add its value to the `DARK_THEMES` set in `app.js`.

## Project Structure

```
Dockerfile              # nginx:alpine, serves static files
docker-compose.yml      # One-command startup (host 8080 -> container 80)
nginx.conf              # gzip, caching, security headers
main.go                 # Go HTTP server for local dev
go.mod                  # Go module
static/
  index.html            # Single-page app with highlight.js from CDN
  style.css             # Dark UI theme, responsive grid layout
  app.js                # Highlighting, inline style resolution, clipboard copy
  favicon.svg           # SVG favicon (code brackets + ink drop)
  manifest.json         # PWA manifest
  sw.js                 # Service worker for offline support
.github/
  workflows/
    docker-publish.yml  # Build + push to GHCR on push/tag
    ci.yml              # Docker build smoke test + CDN link validation
    pages.yml           # Deploy to GitHub Pages
  dependabot.yml        # Automated dependency updates
```

## License

[MIT](LICENSE)
