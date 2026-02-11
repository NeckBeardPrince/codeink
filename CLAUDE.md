# Project Overview

Self-hostable web app that converts plaintext code into syntax-highlighted rich text, optimized for pasting into Microsoft Outlook with formatting preserved.

## Architecture

- **Server**: nginx:alpine — serves static files, gzip, security headers
- **Frontend**: Vanilla HTML/CSS/JS with [highlight.js](https://highlightjs.org/) loaded from CDN for client-side syntax highlighting
- **Deployment**: Single Dockerfile (nginx:alpine) + docker-compose.yml

## File Structure

```
Dockerfile           # nginx:alpine, copies static files and nginx config
docker-compose.yml   # One-command startup, maps host 8080 -> container 80
nginx.conf           # Server config: gzip, caching, security headers
main.go              # Go HTTP server (for local dev without Docker)
go.mod               # Go module
static/
  index.html         # Single-page app, loads highlight.js + language packs from cdnjs
  style.css          # Dark UI theme, responsive grid layout
  app.js             # Highlighting logic, inline style resolution, clipboard copy
```

## Key Design Decisions

- **Inline styles on copy**: Outlook ignores CSS classes. The `inlineStyles()` function in app.js walks the rendered DOM, reads `getComputedStyle()` for each span, and bakes colors/weights into `style=""` attributes before writing to clipboard.
- **Background color resolution**: `resolveBackground()` walks up the DOM tree to find the actual background color since different highlight.js themes set it on different elements. Falls back to dim gray (#2d2d2d) for dark themes, light gray (#f5f5f5) for light themes.
- **No build step**: No bundler, no npm. The frontend is plain files served directly.

## Running

```bash
# Local dev (no Docker)
go run main.go
# http://localhost:8080

# Production (Docker + nginx)
docker compose up --build
# http://localhost:8080 (mapped to nginx on port 80 inside container)
```

## Adding Languages or Themes

- Languages: Add a `<script>` tag in index.html for the highlight.js language pack and a corresponding `<option>` in the language `<select>`.
- Themes: Add an `<option>` in the theme `<select>` in index.html. If the theme is dark, add its value to the `DARK_THEMES` set in app.js.
