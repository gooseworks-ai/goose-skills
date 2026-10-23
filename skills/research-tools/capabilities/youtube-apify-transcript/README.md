# 📹 YouTube Transcript Fetcher (APIFY)

Fetch YouTube video transcripts from anywhere — even cloud servers where YouTube blocks direct access.

## ✨ Features

- Works from cloud IPs (AWS, GCP, VPS, etc.)
- Bypasses YouTube bot detection via APIFY proxies
- **Local caching** — repeat requests are FREE
- **Batch mode** — process multiple videos at once
- Text or JSON output with timestamps
- Language preference support
- Simple Python script, no SDK needed

## 💰 Free Tier

APIFY offers a monthly free-credit allowance. No credit card required. [Sign up here](https://apify.com/)

## 🚀 Quick Start

```bash
# 1. Set your API token
export APIFY_API_TOKEN="apify_api_YOUR_TOKEN"

# 2. Fetch a transcript
python3 scripts/fetch_transcript.py "https://youtube.com/watch?v=VIDEO_ID"
```

## 📖 Documentation

See [SKILL.md](skills/youtube-apify-transcript/SKILL.md) for full documentation, setup instructions, and usage examples.

## 🔗 Links

- [APIFY Free Tier](https://apify.com/pricing)
- [Get API Key](https://console.apify.com/account/integrations)
- [YouTube Transcripts Actor](https://apify.com/johnvc/YoutubeTranscripts)
- [Alpha OSINT](https://alphaosint.com/)

## ⚙️ Requirements

- Python 3.6+
- `requests` library (`pip install requests`)
- APIFY API token (free)

## 📄 License

MIT
