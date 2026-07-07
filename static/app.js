const codeInput = document.getElementById("code-input");
const highlightedCode = document.getElementById("highlighted-code");
const languageSelect = document.getElementById("language");
const themeSelect = document.getElementById("theme");
const lineNumbersToggle = document.getElementById("line-numbers");
const copyBtn = document.getElementById("copy-btn");
const themeLink = document.getElementById("hljs-theme");

// Vendored highlight.js theme CSS; scripts/update-hljs.sh rewrites the version.
const HLJS_STYLES = "vendor/highlight.js/11.11.1/styles";

// Map theme select values to stylesheet paths (most are just the value, dracula is under base16/)
const THEME_PATH = {
  "default": "default",
  "github": "github",
  "github-dark": "github-dark",
  "monokai": "monokai",
  "vs": "vs",
  "vs2015": "vs2015",
  "atom-one-light": "atom-one-light",
  "atom-one-dark": "atom-one-dark",
  "dracula": "base16/dracula",
  "nord": "nord",
  "tokyo-night-dark": "tokyo-night-dark",
  "stackoverflow-light": "stackoverflow-light",
  "stackoverflow-dark": "stackoverflow-dark",
};

// Themes that use a dark background
const DARK_THEMES = new Set([
  "github-dark",
  "monokai",
  "vs2015",
  "atom-one-dark",
  "dracula",
  "nord",
  "tokyo-night-dark",
  "stackoverflow-dark",
]);

const FALLBACK_BG_DARK = "#2d2d2d";
const FALLBACK_BG_LIGHT = "#f5f5f5";

// Parse an rgb/rgba string and check if it's effectively transparent or white
function isTransparentOrMissing(colorStr) {
  if (!colorStr || colorStr === "transparent") return true;
  const m = colorStr.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/
  );
  if (!m) return true;
  // rgba with alpha 0 is transparent
  if (m[4] !== undefined && parseFloat(m[4]) === 0) return true;
  return false;
}

// Resolve the actual background color by walking up the DOM from the element
function resolveBackground(el) {
  let node = el;
  while (node && node !== document.body) {
    const bg = getComputedStyle(node).backgroundColor;
    if (!isTransparentOrMissing(bg)) return bg;
    node = node.parentElement;
  }
  // Nothing found — use a fallback based on whether the theme is dark or light
  const theme = themeSelect.value;
  return DARK_THEMES.has(theme) ? FALLBACK_BG_DARK : FALLBACK_BG_LIGHT;
}

function highlight() {
  const code = codeInput.value;
  if (!code.trim()) {
    highlightedCode.innerHTML = "";
    highlightedCode.className = "";
    return;
  }

  const lang = languageSelect.value;
  let result;

  if (lang === "auto") {
    result = hljs.highlightAuto(code);
  } else {
    result = hljs.highlight(code, { language: lang });
  }

  const showLineNumbers = lineNumbersToggle.checked;

  if (showLineNumbers) {
    const lines = result.value.split("\n");
    // Remove trailing empty line that split creates
    if (lines.length > 1 && lines[lines.length - 1] === "") {
      lines.pop();
    }
    const wrapped = lines
      .map((line) => `<span class="line">${line}</span>`)
      .join("\n");
    highlightedCode.innerHTML = wrapped; // lgtm[js/xss-through-dom]
    highlightedCode.className = `hljs ${result.language || ""} with-line-numbers`;
  } else {
    highlightedCode.innerHTML = result.value; // lgtm[js/xss-through-dom]
    highlightedCode.className = `hljs ${result.language || ""}`;
  }
}

function changeTheme() {
  const theme = themeSelect.value;
  const path = THEME_PATH[theme];
  if (!path) {
    // Unknown theme value; do not update the theme link with untrusted data.
    return;
  }
  themeLink.href = `${HLJS_STYLES}/${path}.min.css`;
}

// Walk a DOM node tree and bake all computed styles into inline style attributes.
// This is necessary because Outlook (and most email clients) ignore CSS classes
// and only respect inline styles. highlight.js uses classes like .hljs-keyword,
// so we must resolve them to "color:#xxx; font-weight:bold" etc.
function inlineStyles(sourceEl) {
  const clone = sourceEl.cloneNode(true);

  // Resolve the actual background — walk up the DOM if the element itself is transparent
  const bgColor = resolveBackground(sourceEl);
  const fgColor = getComputedStyle(sourceEl).color || "#000000";

  function walkAndInline(original, cloned) {
    if (original.nodeType !== Node.ELEMENT_NODE) return;

    const computed = getComputedStyle(original);
    const styles = [];

    const color = computed.color;
    const fontWeight = computed.fontWeight;
    const fontStyle = computed.fontStyle;
    const textDecoration = computed.textDecorationLine || computed.textDecoration;

    if (color) styles.push(`color:${color}`);
    if (fontWeight && fontWeight !== "400" && fontWeight !== "normal")
      styles.push(`font-weight:${fontWeight}`);
    if (fontStyle && fontStyle !== "normal")
      styles.push(`font-style:${fontStyle}`);
    if (textDecoration && textDecoration !== "none")
      styles.push(`text-decoration:${textDecoration}`);

    if (styles.length) {
      cloned.setAttribute("style", styles.join(";"));
    }
    // Strip class attributes — Outlook doesn't use them
    cloned.removeAttribute("class");

    const origChildren = original.childNodes;
    const clonedChildren = cloned.childNodes;
    for (let i = 0; i < origChildren.length; i++) {
      walkAndInline(origChildren[i], clonedChildren[i]);
    }
  }

  // Process all children (the <span> elements inside <code>)
  const origChildren = sourceEl.childNodes;
  const cloneChildren = clone.childNodes;
  for (let i = 0; i < origChildren.length; i++) {
    walkAndInline(origChildren[i], cloneChildren[i]);
  }

  clone.removeAttribute("class");
  return { html: clone.innerHTML, bgColor, fgColor };
}

async function copyRichText() {
  const { html: inlinedHTML, bgColor, fgColor } = inlineStyles(highlightedCode);

  // Wrap each line in a <span class="line_wrapper"> just like tohtml.com does.
  // This ensures each line is a block element that Outlook respects.
  const lines = inlinedHTML.split("\n");
  const wrappedLines = lines
    .map((line) => `<span class="line_wrapper">${line}</span>`)
    .join("\n");

  const html = `<pre class="code_syntax" style="color:${fgColor};background:${bgColor};font-family:Consolas,'Courier New',monospace;font-size:11pt;line-height:1.4;padding:8px;">${wrappedLines}</pre>`;

  try {
    const blob = new Blob([html], { type: "text/html" });
    const textBlob = new Blob([codeInput.value], { type: "text/plain" });
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": blob,
        "text/plain": textBlob,
      }),
    ]);
    copyBtn.textContent = "Copied!";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.textContent = "Copy as Rich Text";
      copyBtn.classList.remove("copied");
    }, 2000);
  } catch (err) {
    console.error("Clipboard write failed:", err);
    // Fallback: select the preview content so user can Ctrl+C
    const preEl = document.querySelector("#preview pre");
    const range = document.createRange();
    range.selectNodeContents(preEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    copyBtn.textContent = "Selected — press Ctrl+C";
    setTimeout(() => {
      copyBtn.textContent = "Copy as Rich Text";
    }, 3000);
  }
}

// Event listeners
codeInput.addEventListener("input", highlight);
languageSelect.addEventListener("change", highlight);
lineNumbersToggle.addEventListener("change", highlight);
themeSelect.addEventListener("change", () => {
  changeTheme();
  // Re-highlight after theme loads to pick up new styles
  highlight();
});
copyBtn.addEventListener("click", copyRichText);

// Ctrl+Enter / Cmd+Enter to copy
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    copyRichText();
  }
});

// Handle tab key in textarea
codeInput.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = codeInput.selectionStart;
    const end = codeInput.selectionEnd;
    codeInput.value =
      codeInput.value.substring(0, start) +
      "\t" +
      codeInput.value.substring(end);
    codeInput.selectionStart = codeInput.selectionEnd = start + 1;
    highlight();
  }
});

// Registered here instead of an inline <script> so the CSP can stay 'self'-only.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
