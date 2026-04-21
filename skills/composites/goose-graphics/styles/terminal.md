# Terminal

CLI / hacker aesthetic. JetBrains Mono everywhere, matrix green on near-black, amber for warnings. Every surface behaves like a terminal pane — command prompts (`$`, `>`), ASCII box-drawing borders, status bars, and uppercase tracked labels. No decorative anything; everything is structural signal.

> Full prose reference: `styles/_full/terminal.md`

## Palette

| Hex | Role |
|-----|------|
| `#1a1a2e` | Terminal dark background |
| `#00ff41` | Matrix green — primary text, rules, active |
| `#ffb000` | Amber — secondary accent (warnings, labels) |
| `#33ff66` | Bright green — hover |
| `#cc8e00` | Dark amber — hover |
| `#00cc33` | Dim green — secondary/body |
| `#00d4ff` | Cyan — tertiary (links, sparingly) |
| `#222240` | Mid dark — card surface |
| `#12122a` | Surface inset |
| `#2a2a3e` | Ghost gray — nested |
| `#3a3a4e` | Faint gray — secondary borders |
| `#4a4a5a` | Dim gray — grid lines, inactive |
| `#00802a` | Muted green — disabled |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display / Body:** `'JetBrains Mono', 'Courier New', Courier, monospace`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | JetBrains Mono | 56px | 700 | 1.10 | -0.5px |
| Section Heading | JetBrains Mono | 36px | 700 | 1.15 | 0 |
| Sub-heading | JetBrains Mono | 24px | 600 | 1.20 | 0 |
| Body Large | JetBrains Mono | 18px | 400 | 1.70 | 0 |
| Body | JetBrains Mono | 15px | 400 | 1.75 | 0.2px |
| Caption | JetBrains Mono | 12px | 400 | 1.50 | 0.5px |
| Big Number | JetBrains Mono | 56px | 700 | 1.00 | 0 |
| System Label | JetBrains Mono | 12px | 600 | 1.00 | 3px UPPER |
| CTA | JetBrains Mono | 14px | 600 | 1.00 | 2px UPPER |
| Prompt Prefix | JetBrains Mono | 15px | 500 | 1.00 | 0 |

**Principles**

- Monospace only — every character takes equal space. This is the identity.
- Prompt prefixes (`$`, `>`, `//`) in amber precede commands and titles.
- Uppercase labels with 3px tracking for system messages.

## Layout

- Format padding: carousel 60px · infographic 60/80 · slides 80px · poster 60/80.
- ASCII box-drawing borders: `┌──┐ │ └──┘` or `+---+` using 1px green borders with mono characters.
- Rules: 1px solid `#00ff41` (often with `box-shadow: 0 0 8px rgba(0,255,65,0.3)` for CRT glow).
- Cards: 0-2px radius. Squared, structural.
- Status bars at top/bottom: `[STATUS: ACTIVE]` `[MEM: 47%]` `[UPTIME: 99.9%]`.

## Do / Don't

**Do**

- Use command prefixes (`$`, `>`, `//`) before commands, headlines, and callouts.
- Use uppercase tracked labels for system messages.
- Apply subtle CRT glow `text-shadow: 0 0 8px rgba(0,255,65,0.3)` on primary green text.
- Use ASCII box-drawing or `+---+` borders for containers when appropriate.
- Use amber (`#ffb000`) for warnings, highlights, and secondary markers.

**Don't**

- Don't use any sans-serif or serif font — monospace only.
- Don't use colors beyond green/amber/cyan/grays. No reds, blues, purples, pinks.
- Don't use border-radius > 2px.
- Don't use decorative shadows (only CRT glow on accent elements).
- Don't use warm palettes.
- Don't mix case on system labels — always UPPERCASE with tracking.

## CSS snippets

### `:root` variables

```css
:root {
  --color-bg: #1a1a2e;
  --color-green: #00ff41;
  --color-amber: #ffb000;
  --color-dim-green: #00cc33;
  --color-cyan: #00d4ff;
  --color-surface: #222240;
  --color-surface-inset: #12122a;
  --color-border: #4a4a5a;

  --font: 'JetBrains Mono', 'Courier New', Courier, monospace;

  --glow-green: 0 0 8px rgba(0, 255, 65, 0.3);
}
```

### Title block with prompt prefix

```html
<div style="background:#1a1a2e; padding:80px 60px; font-family:'JetBrains Mono',monospace;">
  <p style="font-size:12px; font-weight:600; letter-spacing:3px; text-transform:uppercase; color:#ffb000; margin:0 0 12px;">[SYSTEM: INITIALIZED]</p>
  <h1 style="font-size:56px; font-weight:700; line-height:1.10; letter-spacing:-0.5px; color:#00ff41; margin:0 0 24px; text-shadow:0 0 8px rgba(0,255,65,0.3);">&gt; The future of<br>&gt; autonomous_work.exe</h1>
  <p style="font-size:18px; font-weight:400; line-height:1.70; color:#00cc33; max-width:600px; margin:0;">// how AI coworkers are reshaping the way teams operate</p>
</div>
```

### Numbered step with command prompt

```html
<div style="border:1px solid #4a4a5a; padding:24px; background:#222240;">
  <p style="font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:600; letter-spacing:3px; text-transform:uppercase; color:#ffb000; margin:0 0 8px;">&gt; STEP_01 // RESEARCH</p>
  <h3 style="font-family:'JetBrains Mono',monospace; font-size:24px; font-weight:600; color:#00ff41; margin:0 0 12px;">Find buyers before they find you</h3>
  <p style="font-family:'JetBrains Mono',monospace; font-size:15px; font-weight:400; line-height:1.75; color:#00cc33; margin:0;">$ monitor --hiring --funding --stack</p>
</div>
```

### Stat in terminal frame

```html
<div style="border:1px solid #00ff41; padding:32px; background:#12122a; text-align:center;">
  <p style="font-family:'JetBrains Mono',monospace; font-size:56px; font-weight:700; color:#00ff41; margin:0; text-shadow:0 0 12px rgba(0,255,65,0.3);">47%</p>
  <p style="font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:600; letter-spacing:3px; text-transform:uppercase; color:#ffb000; margin:8px 0 0;">FASTER_RESPONSE</p>
</div>
```

### CTA pill (uppercase tracked)

```html
<a style="display:inline-block; background:#00ff41; color:#1a1a2e; font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:600; letter-spacing:2px; text-transform:uppercase; text-decoration:none; padding:14px 36px; border-radius:2px;">&gt; GET_STARTED</a>
```
