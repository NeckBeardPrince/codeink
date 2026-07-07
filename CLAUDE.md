# Project Overview

Self-hostable web app that converts plaintext code into syntax-highlighted rich text, optimized for pasting into Microsoft Outlook with formatting preserved.

## Architecture

- **Server**: nginx-unprivileged (alpine, non-root, port 8080) — serves static files, gzip, security headers, CSP
- **Frontend**: Vanilla HTML/CSS/JS with [highlight.js](https://highlightjs.org/) vendored under `static/vendor/` for client-side syntax highlighting (no CDN, no external requests)
- **Deployment**: Single Dockerfile + docker-compose.yml (read-only rootfs, all capabilities dropped)

## File Structure

```
Dockerfile             # nginx-unprivileged, copies static files and nginx config
docker-compose.yml     # One-command startup, maps host 8080 -> container 8080
nginx.conf             # Server config: gzip, caching, security header includes
security-headers.conf  # Shared security headers incl. CSP; included by every
                       # nginx block that uses add_header (inheritance footgun)
main.go                # Go HTTP server for local dev (binds 127.0.0.1 only)
go.mod                 # Go module
scripts/
  update-hljs.sh       # Re-vendor highlight.js at a given version
static/
  index.html           # Single-page app, loads vendored highlight.js + language packs
  style.css            # Dark UI theme, responsive grid layout
  app.js               # Highlighting logic, inline style resolution, clipboard copy
  sw.js                # Service worker: network-first shell, cache-first /vendor/
  vendor/highlight.js/<version>/  # Vendored highlight.js core, languages, themes
```

## Key Design Decisions

- **Inline styles on copy**: Outlook ignores CSS classes. The `inlineStyles()` function in app.js walks the rendered DOM, reads `getComputedStyle()` for each span, and bakes colors/weights into `style=""` attributes before writing to clipboard.
- **Background color resolution**: `resolveBackground()` walks up the DOM tree to find the actual background color since different highlight.js themes set it on different elements. Falls back to dim gray (#2d2d2d) for dark themes, light gray (#f5f5f5) for light themes.
- **No build step**: No bundler, no npm. The frontend is plain files served directly.
- **Vendored highlight.js**: All highlight.js assets live in `static/vendor/highlight.js/<version>/` (version-stamped so caches invalidate on upgrade). This enables a strict `'self'`-only Content-Security-Policy and removes the CDN as a dependency. Update with `scripts/update-hljs.sh <version>`.
- **CSP everywhere**: nginx sends the policy via `security-headers.conf`; `index.html` carries a matching `<meta>` CSP for hosts that can't set headers (GitHub Pages). Inline scripts and inline styles are banned — new JS goes in `app.js`, new styles in `style.css`.
- **nginx add_header footgun**: any `location` that declares its own `add_header` must also `include /etc/nginx/security-headers.conf;` or it silently drops every inherited security header. CI checks this on multiple paths.

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

- Languages: Add the language to `LANGUAGES` in scripts/update-hljs.sh and re-run it, then add a `<script>` tag in index.html for the vendored language pack and a corresponding `<option>` in the language `<select>`.
- Themes: Add the theme to `THEMES` in scripts/update-hljs.sh and re-run it, then add an `<option>` in the theme `<select>` in index.html and a path entry in `THEME_PATH` in app.js. If the theme is dark, add its value to the `DARK_THEMES` set in app.js.
