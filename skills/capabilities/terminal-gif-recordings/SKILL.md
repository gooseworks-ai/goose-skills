---
name: terminal-gif-recordings
description: Create polished terminal GIF recordings using VHS (Video Hardware Software) by Charmbracelet. Use when asked to create terminal demos, CLI gifs, command-line recordings, or animated terminal screenshots for documentation, READMEs, or marketing.
source: orthogonal
---


# VHS Terminal Recordings

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Create professional terminal GIF/video recordings using [VHS](https://github.com/charmbracelet/vhs).

## Quick Start

```bash
# Install VHS
brew install vhs

# Run a tape file
vhs demo.tape
```

## Style Settings (Orthogonal Standard)

Use these settings for consistent, polished recordings:

```tape
Set Shell "zsh"
Set FontSize 18
Set Width 900
Set Height 500
Set Theme "Catppuccin Frappe"
Set Padding 20
Set Margin 40
Set MarginFill "gradient-bg.png"  # Optional: gradient background image
Set BorderRadius 10
```

### Theme Options

- `Catppuccin Frappe` - Soft purple/blue tones (recommended)
- `Catppuccin Mocha` - Darker variant
- `Dracula` - Purple/pink tones
- `Tokyo Night` - Blue tones
- `Nord` - Cool blue/gray

## Syntax Highlighting Setup

Enable zsh syntax highlighting before recording:

```tape
Hide
Type "source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
Enter
Show
```

Install if needed: `brew install zsh-syntax-highlighting`

## Tape File Structure

```tape
# Header comment describing the demo
Output demo.gif           # Output filename (.gif, .webm, .mp4)

# Style settings
Set Shell "zsh"
Set FontSize 18
Set Width 900
Set Height 500
Set Theme "Catppuccin Frappe"
Set Padding 20

# Hidden setup (env vars, cd, clear)
Hide
Type "export API_KEY=xxx"
Enter
Type "clear"
Enter
Show

# Demo commands
Type "echo 'Hello World'"
Sleep 500ms
Enter
Sleep 2s

# End with pause
Sleep 1s
```

## Key Commands

| Command | Description |
|---------|-------------|
| `Type "text"` | Type text (with realistic timing) |
| `Enter` | Press enter key |
| `Sleep 500ms` | Pause for duration |
| `Hide` / `Show` | Hide/show terminal during setup |
| `Ctrl+C` | Send interrupt signal |
| `Output file.gif` | Set output file |

## Timing Guidelines

- `Sleep 500ms` - After typing command, before Enter
- `Sleep 2s` - Short command output
- `Sleep 3-4s` - Longer output or API responses
- `Sleep 1s` - End of recording pause

## Example: CLI Demo

```tape
# Orthogonal CLI Demo
Output cli-demo.gif

Set Shell "zsh"
Set FontSize 18
Set Width 900
Set Height 500
Set Theme "Catppuccin Frappe"
Set Padding 20
Set BorderRadius 10

# Setup
Hide
Type "source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
Enter

Enter
Type "clear"
Enter
Show

# Search
Type "orth search 'web scraping'"
Sleep 500ms
Enter
Sleep 2.5s

# Run command
Type "curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/scrapes"}'
Sleep 500ms
Enter
Sleep 4s

Sleep 1s
```

## Output Formats

```tape
Output demo.gif    # Animated GIF (default, best for docs)
Output demo.webm   # WebM video (smaller, web-friendly)
Output demo.mp4    # MP4 video (universal compatibility)
```

## Tips

1. **Keep it short** - 10-20 seconds max for attention
2. **Hide setup** - Use `Hide`/`Show` for env vars and cd commands
3. **Realistic typing** - VHS adds natural typing speed automatically
4. **Clear between sections** - Use `Type "clear"` + `Enter` if needed
5. **Test first** - Run commands manually before recording

## Gradient Background (Optional)

Create `gradient-bg.png` for professional look:
- Use 1200x800px image
- Subtle gradient (dark purple to dark blue works well)
- Set with `Set MarginFill "gradient-bg.png"`
