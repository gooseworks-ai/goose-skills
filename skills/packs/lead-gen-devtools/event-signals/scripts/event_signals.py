#!/usr/bin/env python3
"""Event Signals — Conference & Community Event Lead Extraction Tool.

Searches conferences, meetups, hackathons, and podcasts for intent signals:
speaker lists, sponsor lists, meetup attendees, hackathon entries, and
podcast guests discussing relevant topics.

Structured Sources:
  - Sessionize (free API) — conference speakers, bios, companies, talk topics
  - Confs.tech (free JSON) — conference discovery
  - Meetup.com (Apify) — meetup events, RSVPs
  - Luma (Apify) — events, attendees
  - ListenNotes (free tier) — podcast episode search
  - Devpost (scraping) — hackathon projects, teams, tech stacks

Usage:
    python tools/event_signals.py \
        --config .tmp/event_signals_config.json \
        --output .tmp/event_signals.csv
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

try:
    import requests as req
except ImportError:
    print("[error] requests is required. Install with: pip install requests", file=sys.stderr)
    sys.exit(1)

import csv


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).parent.parent
TMP_DIR = PROJECT_ROOT / ".tmp"

SESSIONIZE_BASE = "https://sessionize.com/api/v2"
CONFSTECH_BASE = "https://raw.githubusercontent.com/tech-conferences/conference-data/main/conferences"
LISTENNOTES_BASE = "https://listen-api.listennotes.com/api/v2"
APIFY_BASE = "https://api.apify.com/v2"
APIFY_MEETUP_ACTOR = "qaDijpjO2HlVfLvoE"  # automation-lab/meetup-scraper
APIFY_LUMA_ACTOR = "matyascimbulka~luma-event-scraper"

APIFY_POLL_INTERVAL = 10
APIFY_MAX_WAIT = 300

# Signal types
SIGNAL_TYPES = {
    "conference_speaker": {"label": "Conference Speaker", "weight": 9},
    "conference_sponsor": {"label": "Conference Sponsor", "weight": 8},
    "workshop_host": {"label": "Workshop Host", "weight": 9},
    "meetup_organizer": {"label": "Meetup Organizer", "weight": 7},
    "meetup_attendee": {"label": "Meetup Attendee", "weight": 5},
    "hackathon_entry": {"label": "Hackathon Entry", "weight": 7},
    "podcast_guest": {"label": "Podcast Guest", "weight": 8},
    "podcast_host": {"label": "Podcast Host", "weight": 6},
    "panel_participant": {"label": "Panel Participant", "weight": 8},
    "event_attendee": {"label": "Event Attendee", "weight": 5},
}


def load_apify_key():
    if load_dotenv:
        for env_path in [
            PROJECT_ROOT / ".env",
            PROJECT_ROOT.parent / ".env",
        ]:
            if env_path.exists():
                load_dotenv(env_path)
                break
    return os.environ.get("APIFY_API_TOKEN", "")


def load_listennotes_key():
    if load_dotenv:
        for env_path in [
            PROJECT_ROOT / ".env",
            PROJECT_ROOT.parent / ".env",
        ]:
            if env_path.exists():
                load_dotenv(env_path)
                break
    return os.environ.get("LISTENNOTES_API_KEY", "")


def ensure_tmp():
    TMP_DIR.mkdir(exist_ok=True)


def clean_html(text):
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&[a-z]+;", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# ---------------------------------------------------------------------------
# Source: Sessionize (Conference Speakers)
# ---------------------------------------------------------------------------

def fetch_sessionize_speakers(event_ids, keywords=None):
    """Fetch speakers from Sessionize events. Returns list of signal dicts."""
    signals = []
    keywords_lower = [k.lower() for k in (keywords or [])]

    for event_id in event_ids:
        print(f"[sessionize] Fetching event {event_id}...", file=sys.stderr)

        # Fetch speakers
        try:
            resp = req.get(f"{SESSIONIZE_BASE}/{event_id}/view/Speakers", timeout=30)
            if resp.status_code != 200:
                print(f"[sessionize] Event {event_id}: HTTP {resp.status_code}", file=sys.stderr)
                continue
            speakers_data = resp.json()
        except Exception as e:
            print(f"[sessionize-error] {event_id}: {e}", file=sys.stderr)
            continue

        # Fetch sessions for talk titles
        sessions_map = {}
        try:
            resp = req.get(f"{SESSIONIZE_BASE}/{event_id}/view/Sessions", timeout=30)
            if resp.status_code == 200:
                sessions_data = resp.json()
                for group in sessions_data:
                    for session in group.get("sessions", []):
                        for speaker in session.get("speakers", []):
                            sid = speaker.get("id", "")
                            if sid:
                                if sid not in sessions_map:
                                    sessions_map[sid] = []
                                sessions_map[sid].append({
                                    "title": session.get("title", ""),
                                    "description": session.get("description", ""),
                                    "room": session.get("room", ""),
                                    "startsAt": session.get("startsAt", ""),
                                    "categories": [
                                        c.get("name", "")
                                        for cat_group in session.get("categories", [])
                                        for c in cat_group.get("categoryItems", [])
                                    ] if isinstance(session.get("categories"), list) else [],
                                })
        except Exception:
            pass

        for speaker_group in speakers_data:
            speakers = speaker_group.get("speakers", []) if isinstance(speaker_group, dict) else []
            if isinstance(speakers_data, list) and isinstance(speakers_data[0], dict) and "id" in speakers_data[0]:
                speakers = speakers_data
                # flat list of speakers, not grouped

            for speaker in (speakers if speakers else [speaker_group] if isinstance(speaker_group, dict) and "id" in speaker_group else []):
                name = speaker.get("fullName", speaker.get("firstName", ""))
                bio = clean_html(speaker.get("bio", ""))
                company = speaker.get("tagLine", "")  # Sessionize uses tagLine for company/role

                # Extract social links
                links = {}
                for link in speaker.get("links", []):
                    link_type = link.get("linkType", "").lower()
                    links[link_type] = link.get("url", "")

                speaker_id = speaker.get("id", "")
                speaker_sessions = sessions_map.get(speaker_id, [])

                # Check keyword relevance
                all_text = f"{name} {bio} {company}".lower()
                for s in speaker_sessions:
                    all_text += f" {s['title']} {s.get('description', '')}".lower()

                is_relevant = not keywords_lower or any(kw in all_text for kw in keywords_lower)
                if not is_relevant:
                    continue

                # Determine signal type
                signal_type = "conference_speaker"
                for s in speaker_sessions:
                    title_lower = s["title"].lower()
                    cats = [c.lower() for c in s.get("categories", [])]
                    if "workshop" in title_lower or "workshop" in " ".join(cats):
                        signal_type = "workshop_host"
                        break
                    if "panel" in title_lower or "panel" in " ".join(cats):
                        signal_type = "panel_participant"
                        break

                talk_titles = "; ".join(s["title"] for s in speaker_sessions) if speaker_sessions else ""

                signals.append({
                    "person_name": name,
                    "company": company,
                    "signal_type": signal_type,
                    "signal_label": SIGNAL_TYPES.get(signal_type, {}).get("label", signal_type),
                    "event_name": f"Sessionize Event {event_id}",
                    "event_type": "Conference",
                    "talk_or_role": talk_titles[:300],
                    "bio": bio[:300],
                    "url": links.get("linkedin", links.get("twitter", links.get("blog", ""))),
                    "linkedin": links.get("linkedin", ""),
                    "twitter": links.get("twitter", ""),
                    "website": links.get("blog", links.get("company_website", "")),
                    "date": speaker_sessions[0].get("startsAt", "")[:10] if speaker_sessions else "",
                    "source": "Sessionize",
                })

        print(f"[sessionize] Event {event_id}: {len([s for s in signals if f'Event {event_id}' in s['event_name']])} relevant speakers", file=sys.stderr)
        time.sleep(0.5)

    print(f"[sessionize] Total: {len(signals)} speakers", file=sys.stderr)
    return signals


# ---------------------------------------------------------------------------
# Source: Confs.tech (Conference Discovery)
# ---------------------------------------------------------------------------

def discover_conferences(topics, year=None):
    """Discover conferences from confs.tech. Returns list of conference dicts."""
    if not year:
        now = datetime.now(timezone.utc)
        year = now.year

    conferences = []
    for topic in topics:
        topic_clean = topic.strip().lower().replace(" ", "-")
        url = f"{CONFSTECH_BASE}/{year}/{topic_clean}.json"

        try:
            resp = req.get(url, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                for conf in data:
                    conferences.append({
                        "name": conf.get("name", ""),
                        "url": conf.get("url", ""),
                        "startDate": conf.get("startDate", ""),
                        "endDate": conf.get("endDate", ""),
                        "city": conf.get("city", ""),
                        "country": conf.get("country", ""),
                        "cfpUrl": conf.get("cfpUrl", ""),
                        "cfpEndDate": conf.get("cfpEndDate", ""),
                        "topic": topic,
                    })
                print(f"[confstech] {topic}: {len(data)} conferences found", file=sys.stderr)
            else:
                print(f"[confstech] {topic}: no data (HTTP {resp.status_code})", file=sys.stderr)
        except Exception as e:
            print(f"[confstech-error] {topic}: {e}", file=sys.stderr)

    print(f"[confstech] Total: {len(conferences)} conferences discovered", file=sys.stderr)
    return conferences


# ---------------------------------------------------------------------------
# Source: Meetup (Apify)
# ---------------------------------------------------------------------------

def fetch_meetup_events(search_queries, apify_key, location=None):
    """Search Meetup events via Apify actor."""
    if not apify_key:
        print("[meetup] Skipping — no Apify API token", file=sys.stderr)
        return []

    signals = []

    for query in search_queries:
        actor_input = {
            "searchQuery": query,
            "maxResults": 25,
        }
        if location:
            actor_input["location"] = location

        print(f"[meetup] Searching: '{query}'...", file=sys.stderr)

        try:
            resp = req.post(
                f"{APIFY_BASE}/acts/{APIFY_MEETUP_ACTOR}/runs",
                params={"token": apify_key},
                json=actor_input,
                timeout=30,
            )
            resp.raise_for_status()
            run_id = resp.json().get("data", {}).get("id")
        except Exception as e:
            print(f"[meetup-error] Failed to start: {e}", file=sys.stderr)
            continue

        # Poll
        elapsed = 0
        status_data = {}
        while elapsed < APIFY_MAX_WAIT:
            time.sleep(APIFY_POLL_INTERVAL)
            elapsed += APIFY_POLL_INTERVAL
            try:
                sr = req.get(f"{APIFY_BASE}/actor-runs/{run_id}", params={"token": apify_key}, timeout=15)
                status_data = sr.json().get("data", {})
                if status_data.get("status") == "SUCCEEDED":
                    break
                elif status_data.get("status") in ("FAILED", "ABORTED", "TIMED-OUT"):
                    print(f"[meetup-error] Run {status_data.get('status')}", file=sys.stderr)
                    status_data = {}
                    break
            except Exception:
                pass

        if not status_data.get("defaultDatasetId"):
            continue

        # Fetch results
        try:
            dataset_id = status_data["defaultDatasetId"]
            dr = req.get(f"{APIFY_BASE}/datasets/{dataset_id}/items", params={"token": apify_key, "format": "json"}, timeout=30)
            events = dr.json()
        except Exception as e:
            print(f"[meetup-error] Fetch failed: {e}", file=sys.stderr)
            continue

        for event in events:
            event_name = event.get("title", event.get("name", ""))
            group_name = event.get("group", {}).get("name", "") if isinstance(event.get("group"), dict) else str(event.get("group", ""))
            rsvp_count = event.get("rsvpCount", event.get("going", 0))
            event_url = event.get("url", event.get("eventUrl", ""))
            event_date = event.get("dateTime", event.get("date", ""))

            signals.append({
                "person_name": group_name,  # Group/organizer as the "lead"
                "company": "",
                "signal_type": "meetup_organizer",
                "signal_label": "Meetup Organizer",
                "event_name": event_name,
                "event_type": "Meetup",
                "talk_or_role": f"Organizer ({rsvp_count} RSVPs)",
                "bio": clean_html(event.get("description", ""))[:300],
                "url": event_url,
                "linkedin": "",
                "twitter": "",
                "website": "",
                "date": str(event_date)[:10],
                "source": "Meetup",
            })

        print(f"[meetup] '{query}': {len(events)} events found", file=sys.stderr)

    print(f"[meetup] Total: {len(signals)} meetup signals", file=sys.stderr)
    return signals


# ---------------------------------------------------------------------------
# Source: Luma (Apify)
# ---------------------------------------------------------------------------

def fetch_luma_events(luma_categories, luma_cities, apify_key):
    """Search Luma events via Apify actor.

    Args:
        luma_categories: list of category slugs from: "tech", "food", "ai",
            "arts", "climate", "fitness", "wellness", "crypto"
        luma_cities: list of city slugs like "san-francisco", "new-york", "london"
        apify_key: Apify API token
    """
    if not apify_key:
        print("[luma] Skipping — no Apify API token", file=sys.stderr)
        return []

    signals = []

    actor_input = {
        "slugs": luma_categories,
        "cities": luma_cities,
    }

    print(f"[luma] Searching categories={luma_categories}, cities={luma_cities}...", file=sys.stderr)

    try:
        resp = req.post(
            f"{APIFY_BASE}/acts/{APIFY_LUMA_ACTOR}/runs",
            params={"token": apify_key},
            json=actor_input,
            timeout=30,
        )
        resp.raise_for_status()
        run_id = resp.json().get("data", {}).get("id")
    except Exception as e:
        print(f"[luma-error] Failed to start: {e}", file=sys.stderr)
        return []

    # Poll
    elapsed = 0
    status_data = {}
    while elapsed < APIFY_MAX_WAIT:
        time.sleep(APIFY_POLL_INTERVAL)
        elapsed += APIFY_POLL_INTERVAL
        try:
            sr = req.get(f"{APIFY_BASE}/actor-runs/{run_id}", params={"token": apify_key}, timeout=15)
            status_data = sr.json().get("data", {})
            if status_data.get("status") == "SUCCEEDED":
                break
            elif status_data.get("status") in ("FAILED", "ABORTED", "TIMED-OUT"):
                status_data = {}
                break
        except Exception:
            pass

    if not status_data.get("defaultDatasetId"):
        print("[luma] No dataset returned", file=sys.stderr)
        return signals

    try:
        dataset_id = status_data["defaultDatasetId"]
        dr = req.get(f"{APIFY_BASE}/datasets/{dataset_id}/items", params={"token": apify_key, "format": "json"}, timeout=30)
        events = dr.json()
    except Exception as e:
        print(f"[luma-error] Fetch failed: {e}", file=sys.stderr)
        return signals

    for event in events:
        event_name = event.get("name", event.get("title", ""))
        organizer = event.get("organizer", event.get("host", ""))
        event_url = event.get("url", event.get("eventUrl", ""))
        event_date = event.get("date", event.get("startDate", ""))

        signals.append({
            "person_name": str(organizer)[:100] if organizer else "",
            "company": "",
            "signal_type": "event_attendee",
            "signal_label": "Event (Luma)",
            "event_name": str(event_name)[:200],
            "event_type": "Luma Event",
            "talk_or_role": "Organizer/Host",
            "bio": clean_html(event.get("description", ""))[:300],
            "url": str(event_url),
            "linkedin": "",
            "twitter": "",
            "website": "",
            "date": str(event_date)[:10],
            "source": "Luma",
        })

    print(f"[luma] {len(events)} events found", file=sys.stderr)
    print(f"[luma] Total: {len(signals)} luma signals", file=sys.stderr)
    return signals


# ---------------------------------------------------------------------------
# Source: ListenNotes (Podcast Search)
# ---------------------------------------------------------------------------

def search_podcasts(search_queries, api_key=None):
    """Search podcast episodes via ListenNotes API."""
    if not api_key:
        print("[podcast] Skipping — no LISTENNOTES_API_KEY", file=sys.stderr)
        return []

    signals = []
    headers = {"X-ListenAPI-Key": api_key}

    for query in search_queries:
        print(f"[podcast] Searching: '{query}'...", file=sys.stderr)

        try:
            resp = req.get(
                f"{LISTENNOTES_BASE}/search",
                params={
                    "q": query,
                    "type": "episode",
                    "sort_by_date": 1,
                    "len_min": 10,
                    "offset": 0,
                },
                headers=headers,
                timeout=30,
            )

            if resp.status_code == 401:
                print("[podcast-error] Invalid API key", file=sys.stderr)
                return signals
            if resp.status_code == 429:
                print("[podcast-error] Rate limited", file=sys.stderr)
                break

            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"[podcast-error] {e}", file=sys.stderr)
            continue

        for result in data.get("results", []):
            episode_title = result.get("title_original", "")
            podcast_name = result.get("podcast", {}).get("title_original", "")
            publisher = result.get("podcast", {}).get("publisher_original", "")
            description = clean_html(result.get("description_original", ""))
            pub_date = result.get("pub_date_ms")
            episode_url = result.get("listennotes_url", "")

            # Convert pub_date_ms to date string
            date_str = ""
            if pub_date:
                try:
                    dt = datetime.fromtimestamp(pub_date / 1000, tz=timezone.utc)
                    date_str = dt.strftime("%Y-%m-%d")
                except (ValueError, TypeError, OSError):
                    pass

            signals.append({
                "person_name": publisher,
                "company": podcast_name,
                "signal_type": "podcast_guest",
                "signal_label": "Podcast Episode",
                "event_name": podcast_name,
                "event_type": "Podcast",
                "talk_or_role": episode_title[:300],
                "bio": description[:300],
                "url": episode_url,
                "linkedin": "",
                "twitter": "",
                "website": "",
                "date": date_str,
                "source": "ListenNotes",
            })

        print(f"[podcast] '{query}': {len(data.get('results', []))} episodes", file=sys.stderr)
        time.sleep(1)  # Free tier rate limiting

    print(f"[podcast] Total: {len(signals)} podcast signals", file=sys.stderr)
    return signals


# ---------------------------------------------------------------------------
# Source: Devpost (Hackathon Scraping)
# ---------------------------------------------------------------------------

def fetch_devpost_projects(hackathon_slugs, keywords=None):
    """Scrape hackathon projects from Devpost."""
    signals = []
    keywords_lower = [k.lower() for k in (keywords or [])]

    for slug in hackathon_slugs:
        slug = slug.strip()
        url = f"https://devpost.com/api/hackathons/{slug}/projects"

        print(f"[devpost] Fetching: {slug}...", file=sys.stderr)

        page = 1
        while page <= 5:  # Max 5 pages per hackathon
            try:
                resp = req.get(
                    url,
                    params={"page": page, "per_page": 50},
                    headers={"User-Agent": "Mozilla/5.0 LeadGenToolkit/1.0"},
                    timeout=30,
                )
                if resp.status_code != 200:
                    break
                data = resp.json()
            except Exception as e:
                print(f"[devpost-error] {slug}: {e}", file=sys.stderr)
                break

            projects = data.get("projects", data) if isinstance(data, dict) else data
            if not projects or not isinstance(projects, list):
                break

            for project in projects:
                title = project.get("title", project.get("name", ""))
                tagline = project.get("tagline", "")
                built_with = project.get("built_with", project.get("technologies", []))
                if isinstance(built_with, list):
                    built_with_str = ", ".join(built_with)
                else:
                    built_with_str = str(built_with)

                members = project.get("members", project.get("team_members", []))
                project_url = project.get("url", "")

                # Check relevance
                all_text = f"{title} {tagline} {built_with_str}".lower()
                if keywords_lower and not any(kw in all_text for kw in keywords_lower):
                    continue

                # Create signal per team member
                if isinstance(members, list):
                    for member in members:
                        member_name = member.get("name", member.get("screen_name", "")) if isinstance(member, dict) else str(member)
                        signals.append({
                            "person_name": member_name,
                            "company": "",
                            "signal_type": "hackathon_entry",
                            "signal_label": "Hackathon Entry",
                            "event_name": slug,
                            "event_type": "Hackathon",
                            "talk_or_role": f"{title} — Built with: {built_with_str}"[:300],
                            "bio": tagline[:300],
                            "url": project_url,
                            "linkedin": "",
                            "twitter": "",
                            "website": "",
                            "date": "",
                            "source": "Devpost",
                        })
                else:
                    signals.append({
                        "person_name": "",
                        "company": "",
                        "signal_type": "hackathon_entry",
                        "signal_label": "Hackathon Entry",
                        "event_name": slug,
                        "event_type": "Hackathon",
                        "talk_or_role": f"{title} — Built with: {built_with_str}"[:300],
                        "bio": tagline[:300],
                        "url": project_url,
                        "linkedin": "",
                        "twitter": "",
                        "website": "",
                        "date": "",
                        "source": "Devpost",
                    })

            if len(projects) < 50:
                break
            page += 1
            time.sleep(0.5)

        print(f"[devpost] {slug}: {len([s for s in signals if s['event_name'] == slug])} relevant entries", file=sys.stderr)

    print(f"[devpost] Total: {len(signals)} hackathon signals", file=sys.stderr)
    return signals


# ---------------------------------------------------------------------------
# Manual Signals (from agent-scraped data)
# ---------------------------------------------------------------------------

def load_manual_signals(manual_file):
    """Load manually scraped signals from a JSON file.

    The agent can scrape conference websites, sponsor pages, etc. and save
    results as a JSON array of signal dicts to this file.
    """
    if not manual_file or not Path(manual_file).exists():
        return []

    try:
        with open(manual_file) as f:
            data = json.load(f)
        print(f"[manual] Loaded {len(data)} manual signals", file=sys.stderr)
        return data
    except Exception as e:
        print(f"[manual-error] {e}", file=sys.stderr)
        return []


# ---------------------------------------------------------------------------
# CSV Output
# ---------------------------------------------------------------------------

def build_csv(signals, output_path):
    """Build single CSV file from event signals."""
    headers = [
        "person_name", "company", "signal_type", "signal_label",
        "event_name", "event_type", "talk_or_role", "bio",
        "linkedin", "twitter", "website", "date",
        "signal_score", "source", "url",
    ]

    # Add signal scores
    for s in signals:
        s["signal_score"] = SIGNAL_TYPES.get(s.get("signal_type", ""), {}).get("weight", 5)

    # Sort by signal_score desc, then date desc
    signals.sort(key=lambda s: (s.get("signal_score", 0), s.get("date", "")), reverse=True)

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for signal in signals:
            writer.writerow([signal.get(h, "") for h in headers])

    print(f"\n[output] Saved {len(signals)} signals to {output_path}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run(config_path, output=None):
    output = output or str(TMP_DIR / "event_signals.csv")
    ensure_tmp()

    with open(config_path) as f:
        config = json.load(f)

    keywords = config.get("keywords", [])
    sessionize_ids = config.get("sessionize_event_ids", [])
    confstech_topics = config.get("confstech_topics", [])
    meetup_queries = config.get("meetup_queries", [])
    meetup_location = config.get("meetup_location", "")
    luma_categories = config.get("luma_categories", [])
    luma_cities = config.get("luma_cities", [])
    podcast_queries = config.get("podcast_queries", [])
    devpost_slugs = config.get("devpost_slugs", [])
    manual_file = config.get("manual_signals_file", "")
    skip = set(config.get("skip", []))

    print(f"[start] Keywords: {', '.join(keywords)}", file=sys.stderr)

    apify_key = load_apify_key()
    listennotes_key = load_listennotes_key()
    all_signals = []

    # Sessionize
    if "sessionize" not in skip and sessionize_ids:
        print(f"\n{'='*60}", file=sys.stderr)
        all_signals.extend(fetch_sessionize_speakers(sessionize_ids, keywords))

    # Confs.tech discovery
    if "confstech" not in skip and confstech_topics:
        print(f"\n{'='*60}", file=sys.stderr)
        conferences = discover_conferences(confstech_topics)
        # Save discovered conferences for the agent to review
        disc_path = TMP_DIR / "discovered_conferences.json"
        with open(disc_path, "w") as f:
            json.dump(conferences, f, indent=2)
        print(f"[confstech] Saved discovery results to {disc_path}", file=sys.stderr)

    # Meetup
    if "meetup" not in skip and meetup_queries and apify_key:
        print(f"\n{'='*60}", file=sys.stderr)
        all_signals.extend(fetch_meetup_events(meetup_queries, apify_key, meetup_location))

    # Luma
    if "luma" not in skip and (luma_categories or luma_cities) and apify_key:
        print(f"\n{'='*60}", file=sys.stderr)
        all_signals.extend(fetch_luma_events(luma_categories, luma_cities, apify_key))

    # Podcasts
    if "podcast" not in skip and podcast_queries and listennotes_key:
        print(f"\n{'='*60}", file=sys.stderr)
        all_signals.extend(search_podcasts(podcast_queries, listennotes_key))

    # Devpost
    if "devpost" not in skip and devpost_slugs:
        print(f"\n{'='*60}", file=sys.stderr)
        all_signals.extend(fetch_devpost_projects(devpost_slugs, keywords))

    # Manual signals
    if manual_file:
        all_signals.extend(load_manual_signals(manual_file))

    if not all_signals:
        print("\n[warning] No signals found", file=sys.stderr)
        return

    # Build output
    build_csv(all_signals, output)

    # Summary
    type_counts = {}
    source_counts = {}
    for s in all_signals:
        type_counts[s.get("signal_label", "")] = type_counts.get(s.get("signal_label", ""), 0) + 1
        source_counts[s.get("source", "")] = source_counts.get(s.get("source", ""), 0) + 1

    print(f"\n{'='*60}", file=sys.stderr)
    print(f"[summary] Total signals: {len(all_signals)}", file=sys.stderr)
    print(f"\n  By type:", file=sys.stderr)
    for t, c in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"    {t}: {c}", file=sys.stderr)
    print(f"\n  By source:", file=sys.stderr)
    for s, c in sorted(source_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"    {s}: {c}", file=sys.stderr)
    print(f"{'='*60}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Event Signals — Conference & Community Event Lead Extraction")
    parser.add_argument("--config", required=True, help="Path to config JSON file")
    parser.add_argument("--output", default=None, help="Output .csv path")
    args = parser.parse_args()
    run(config_path=args.config, output=args.output)


if __name__ == "__main__":
    main()
