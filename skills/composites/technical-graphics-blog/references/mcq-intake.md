# MCQ Preference Intake

Run this when the user says yes to custom preferences. Present one GROUP at a time.
Mark the option that best matches `[BLOG_*]` analysis as ★ RECOMMENDED.
Always include a Default option that applies the auto-detected value.

---

## GROUP A — Theme & Background

```
A) Light ★ (if BLOG_THEME_HINT=Light)
   White/off-white · dark text · editorial
   BG=#FFFFFF · TEXT=#0F172A · MUTED=#64748B

B) Dark ★ (if BLOG_THEME_HINT=Dark)
   Deep #0F1117 · glowing accents · high contrast
   BG=#0F1117 · TEXT=#F0F4FF · MUTED=#8B95A8

C) Soft Grey
   #F8FAFC background · neutral and professional
   BG=#F8FAFC · TEXT=#1E293B · MUTED=#64748B

D) Default — apply BLOG_THEME_HINT automatically
```

---

## GROUP B — Color Palette

```
A) Auto-detect from blog brand ★ RECOMMENDED
   (use BLOG_BRAND_COLORS if found, else Stormy AI Match)

B) Stormy AI Match
   Indigo #4F63D2 · Teal #0D9488 · Amber #D97706

C) Ocean
   Deep Blue #1E40AF · Cyan #06B6D4 · Sky #0EA5E9

D) Forest
   Emerald #059669 · Sage #6EE7B7 · Lime #84CC16

E) Warm Sunset
   Coral #F97316 · Amber #FBBF24 · Red #EF4444

F) Monochrome
   Greyscale + single accent (ask for accent color next)

G) Custom — user provides hex codes
   Ask: "Share your background, text, and at least 2 accent colors."
```

---

## GROUP C — Typography

```
A) Inter ★ RECOMMENDED (editorial/strategy posts)
   Inter, -apple-system, sans-serif

B) DM Sans
   DM Sans, Inter, sans-serif — friendly, product-y

C) Mono-Accented
   Inter body + JetBrains Mono for diagram node labels
   → best for code-heavy or developer posts

D) Default — match BLOG_FONT_HINT
```

---

## GROUP D — Layout Density

```
A) Spacious — generous whitespace (≤2 sections)
B) Balanced ★ RECOMMENDED — moderate density (3–5 sections)
C) Compact — tighter spacing (≥6 sections)
D) Default — apply from BLOG_DENSITY
```

---

## GROUP E — Diagram Style

Only present if BLOG_DENSITY ≥ 5 sections OR post has multi-step workflows.

```
A) Rounded + L-bend ★ RECOMMENDED
   Soft corners rx=8 · angled connector paths

B) Pill + Curved
   Fully rounded rx=20 · smooth bezier connectors

C) Sharp + Straight
   No border radius · direct straight lines

D) Default — apply A (Rounded + L-bend)
```

---

## GROUP F — Infographic Style

List `BLOG_INFOGRAPHIC_SECTIONS` here so user sees what's being styled.

```
A) Editorial Stat Cards ★ RECOMMENDED
   Bold numbers · white cards · Stormy AI style

B) Icon-Driven Callouts
   Geometric icon per point · headline + 1-line description

C) Horizontal Comparison Panels
   Side-by-side before/after layout

D) Full Infographic
   Icons + stats + mini-diagram in one visual

E) Default — best style per section automatically
```

---

## After all groups answered

Print the confirmed Active Style Profile:

```
✅ Your Visual Style Profile
Theme:      [answer]
Background: [hex]
Text:       [hex] / [muted hex]
Palette:    [name — ACCENT1 · ACCENT2 · ACCENT3]
Font:       [stack]
Density:    [Spacious / Balanced / Compact]
Diagrams:   [style]
Infographic:[style]
Source:     User-defined

Any of the above look wrong? Tell me now and I'll adjust.
Otherwise say "Go" and I'll start generating.
```

Run the contrast check silently before generation:
- Text on BG < 4.5:1 → warn and suggest fix
- Two accents with hue difference < 30° → warn and suggest swap
- Never silently override — always ask before changing
