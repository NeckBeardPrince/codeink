const codeInput = document.getElementById("code-input");
const highlightedCode = document.getElementById("highlighted-code");
const languageSelect = document.getElementById("language");
const themeSelect = document.getElementById("theme");
const lineNumbersToggle = document.getElementById("line-numbers");
const copyBtn = document.getElementById("copy-btn");
const themeLink = document.getElementById("hljs-theme");

const HLJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles";

// SRI hashes for theme CSS files (verified against cdnjs)
const THEME_SRI = {
  "default": "sha512-hasIneQUHlh06VNBe7f6ZcHmeRTLIaQWFd43YriJ0UND19bvYRauxthDg8E4eVNPm9bRUhr5JGeqH7FRFXQu5g==",
  "github": "sha512-0aPQyyeZrWj9sCA46UlmWgKOP0mUipLQ6OZXu8l4IcAmD2u31EPEy9VcIMvl7SoAaKe8bLXZhYoMaE/in+gcgA==",
  "github-dark": "sha512-rO+olRTkcf304DQBxSWxln8JXCzTHlKnIdnMUwYvQa9/Jd4cQaNkItIUj6Z4nvW1dqK0SKXLbn9h4KwZTNtAyw==",
  "monokai": "sha512-RLF8eOxhuwsRINc7r56dpl9a3VStqrXD+udWahutJrYdyh++2Ghnf+s4jFsOyryKZt/GNjPwbXVPH3MJpKrn2g==",
  "vs": "sha512-AVoZ71dJLtHRlsgWwujPT1hk2zxtFWsPlpTPCc/1g0WgpbmlzkqlDFduAvnOV4JJWKUquPc1ZyMc5eq4fRnKOQ==",
  "vs2015": "sha512-mtXspRdOWHCYp+f4c7CkWGYPPRAhq9X+xCvJMUBVAb6pqA4U8pxhT3RWT3LP3bKbiolYL2CkL1bSKZZO4eeTew==",
  "atom-one-dark": "sha512-Jk4AqjWsdSzSWCSuQTfYRIF84Rq/eV0G2+tu07byYwHcbTGfdmLrHjUSwvzp5HvbiqK4ibmNwdcG49Y5RGYPTg==",
  "atom-one-light": "sha512-o5v54Kh5PH0dgnf9ei0L+vMRsbm5fvIvnR/XkrZZjN4mqdaeH7PW66tumBoQVIaKNVrLCZiBEfHzRY4JJSMK/Q==",
  "dracula": "sha512-zKpFlhUX8c+WC6H/XTJavnEpWFt2zH9BU9vu0Hry5Y+SEgG21pRMFcecS7DgDXIegXBQ3uK9puwWPP3h6WSR9g==",
  "nord": "sha512-U/cZqAAOThvb4J9UCt/DWkkjoJWHXvutFDS/nZmZlirci2ZMuH6qFokOQDuuKgE7pXD+FmhDNH2jT43x0GreCQ==",
  "tokyo-night-dark": "sha512-dSQLLtgaq2iGigmy9xowRshaMzUHeiIUTvJW/SkUpb1J+ImXOPNGAI7ZC8V5/PiN/XN83B8uIk4qET7AMhdC5Q==",
  "stackoverflow-light": "sha512-RDtnAhiPytLVV3AwzHkGVMVI4szjtSjxxyhDaH3gqdHPIw5qwQld1MVGuMu1EYoof+CaEccrO3zUVb13hQFU/A==",
  "stackoverflow-dark": "sha512-Xn1b0y/BrCD7usnEh6r9CcKxHXFVleVUjGDnfc95zDDwFUwtOz3lJC/XtJcuLRNyrMQJEEToFfwjC9Ue/aWY/g==",
};

// Map theme select values to CDN paths (most are just the value, dracula is under base16/)
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

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML; // lgtm[js/xss-through-dom]
}

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
  themeLink.href = `${HLJS_CDN}/${path}.min.css`;
  if (THEME_SRI[theme]) {
    themeLink.integrity = THEME_SRI[theme];
    themeLink.crossOrigin = "anonymous";
  } else {
    themeLink.removeAttribute("integrity");
    themeLink.removeAttribute("crossorigin");
  }
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
