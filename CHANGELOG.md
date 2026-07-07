# Changelog

## v1.1.0 — 2026-07-06

### Security

- **Vendor highlight.js locally** — all highlight.js assets (core, 40 language packs, 13 themes) now live in `static/vendor/highlight.js/<version>/` instead of loading from cdnjs. Every vendored JS file was verified byte-for-byte against the SRI hashes previously committed in `index.html`. Removes the CDN as a runtime dependency and fixes a version drift where theme CSS loaded 11.9.0 while the library was 11.11.1. Added `scripts/update-hljs.sh` for future upgrades.
- **Add Content-Security-Policy** — strict `'self'`-only policy sent as an nginx header (`security-headers.conf`) and as a `<meta>` tag for GitHub Pages. Required moving the service worker registration out of an inline `<script>` and footer inline styles into `style.css`.
- **Fix nginx `add_header` inheritance bug** — the `Cache-Control` header in the CSS/JS location block was silently dropping all security headers on those responses. Headers now come from a shared `security-headers.conf` included in every block. CI now asserts security headers are present on every response type.
- **Fix service worker staleness** — local assets were cache-first with a fixed cache name, so deployed fixes never reached returning users. The app shell is now network-first with cache fallback; version-stamped `/vendor/` assets stay cache-first. Also: only successful GET responses are cached, and precache paths are now relative so the PWA works on GitHub Pages project sites.
- **Run container as non-root** — switched base image to `nginx-unprivileged` (port 8080), and hardened docker-compose with `read_only`, `cap_drop: ALL`, and `no-new-privileges`.
- **Remove deprecated `X-XSS-Protection` header** — obsolete; the browser XSS auditor it invoked was removed from modern browsers and enabled XS-Leak side channels in old ones. Superseded by CSP.
- Add `server_tokens off` to stop advertising the nginx version
- Bind the Go dev server to `127.0.0.1` instead of all interfaces
- Docker image builds now attach SLSA provenance and an SBOM
- Remove unused `escapeHtml()` helper from `app.js`

### Breaking

- The container now listens on **8080** instead of 80 and runs as uid 101: use `docker run -p 8080:8080` / update reverse proxy upstreams accordingly.

## v1.0.1 — 2026-02-12

### Security

- Add SRI `integrity` hashes to all CDN `<script>` and `<link>` tags in `index.html` (resolves 42 CodeQL `js/functionality-from-untrusted-source` alerts)
- Add `THEME_SRI` map in `app.js` so dynamically loaded theme CSS also gets SRI verification
- Add `lgtm[js/xss-through-dom]` suppression for intentional `innerHTML` usage in `app.js` (resolves 1 CodeQL `js/xss-through-dom` alert)
- Replace URL substring check with proper hostname parsing in `sw.js` (resolves 1 CodeQL `js/incomplete-url-substring-sanitization` alert)

### Bug Fixes

- Fix Dracula theme 404 — theme CSS lives at `styles/base16/dracula.min.css`, added `THEME_PATH` map to resolve correct URL

### UI

- Add bottom padding to footer for breathing room
- Add Changelog link to footer

## v1.0.0 — 2026-02-11

### Features

- Client-side syntax highlighting with [highlight.js](https://highlightjs.org/) (40+ languages, 12 themes)
- **Inline style resolution** — walks the DOM and bakes computed styles into `style=""` attributes so formatting survives Outlook's CSS stripping
- **Background color detection** — `resolveBackground()` walks the DOM tree to find the actual background, with dark/light theme fallbacks
- Copy as rich text to clipboard (`text/html` + `text/plain`) via the Clipboard API, with fallback to manual selection
- Live preview with split-pane editor layout
- Optional line numbers using CSS counters
- Tab key support in the code textarea
- Keyboard shortcut: `Ctrl+Enter` / `Cmd+Enter` to copy
- Theme switcher with dark/light theme support
- Auto-detect language mode

### Infrastructure

- **Docker deployment** — `nginx:alpine` image serving static files with gzip, caching, and security headers
- **Go dev server** — `go run main.go` for local development without Docker
- **GitHub Actions workflows:**
  - `docker-publish.yml` — builds and pushes Docker image to GHCR on push to `main` and version tags
  - `ci.yml` — Docker build smoke test + CDN link validation on PRs
  - `pages.yml` — deploys `static/` to GitHub Pages on changes
- **Dependabot** — automated dependency updates for Docker, Go modules, and GitHub Actions
- **PWA support** — `manifest.json` + service worker with offline caching (cache-first for local assets, network-first for CDN)

### UI

- Dark theme UI (`#1a1a2e` background)
- Responsive grid layout (collapses to single column on mobile)
- Branded logo: "code" in light gray, "ink" with animated pink-to-purple gradient
- SVG favicon with code brackets and ink drop
- Footer with keyboard hints and contributor credits
- Open Graph and Twitter Card meta tags for link previews
