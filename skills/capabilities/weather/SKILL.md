---
name: weather
description: Get current weather and forecasts using free APIs (no API key required). Use when asked about weather, temperature, forecasts, or climate conditions for any location.
source: orthogonal
---


# Weather

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Get weather data using free services - no API keys needed.

## wttr.in (Primary)

Fast, simple, works everywhere.

**Quick check:**
```bash
curl -s "wttr.in/London?format=3"
# Output: London: ⛅️ +8°C
```

**Compact format:**
```bash
curl -s "wttr.in/London?format=%l:+%c+%t+%h+%w"
# Output: London: ⛅️ +8°C 71% ↙5km/h
```

**Full forecast:**
```bash
curl -s "wttr.in/London?T"
```

### Format Codes
| Code | Meaning |
|------|---------|
| `%c` | Weather condition emoji |
| `%t` | Temperature |
| `%h` | Humidity |
| `%w` | Wind |
| `%l` | Location |
| `%m` | Moon phase |

### Tips
- URL-encode spaces: `wttr.in/New+York` or `wttr.in/San%20Francisco`
- Airport codes work: `wttr.in/JFK`, `wttr.in/SFO`
- Units: `?m` metric, `?u` USCS (Fahrenheit)
- Limit days: `?1` today only, `?0` current only
- Save as image: `curl -s "wttr.in/Berlin.png" -o weather.png`

## Open-Meteo (JSON API)

Better for programmatic use. Free, no key.

```bash
curl -s "https://api.open-meteo.com/v1/forecast?latitude=37.77&longitude=-122.42&current_weather=true"
```

Response includes: temperature, windspeed, weathercode, time.

### Get coordinates first
```bash
curl -s "https://geocoding-api.open-meteo.com/v1/search?name=San+Francisco&count=1"
```

## Examples

**San Francisco right now:**
```bash
curl -s "wttr.in/San+Francisco?format=3"
```

**Tokyo 3-day forecast:**
```bash
curl -s "wttr.in/Tokyo?3T"
```

**JSON weather for coordinates:**
```bash
curl -s "https://api.open-meteo.com/v1/forecast?latitude=35.68&longitude=139.69&current_weather=true&hourly=temperature_2m"
```
