#!/usr/bin/env python3
"""
Conference & Event Attendee Prospecting CLI

Scrapes speakers, hosts, and guest profiles from Luma events.
Two modes:
  1. Direct scrape (free): Gets hosts + any public guest profiles from event URLs
  2. Apify search (paid): Searches Luma, returns events with full guest profiles

Usage:
    # Direct scrape of specific events (free, hosts only)
    python3 scrape_event.py https://lu.ma/abc123

    # Search Luma via Apify for events + guest profiles ($29/mo)
    python3 scrape_event.py --search "AI San Francisco"

    # Export to CSV
    python3 scrape_event.py --search "SaaS NYC" --output speakers.csv
"""
import argparse
import csv
import json
import os
import sys
import hashlib
import time
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

# Add scripts dir to path
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

# Load .env file if present
env_path = script_dir.parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())

from apify_client import LumaClient, LumaApifyClient, parse_luma_people


def get_cache_path(key: str) -> Path:
    """Generate cache file path"""
    cache_dir = script_dir.parent / ".cache"
    cache_dir.mkdir(exist_ok=True)
    cache_hash = hashlib.md5(key.lower().encode()).hexdigest()[:12]
    return cache_dir / f"event_{cache_hash}.json"


def load_cache(cache_path: Path, max_age_hours: int = 24) -> Optional:
    """Load cached data if fresh enough"""
    if not cache_path.exists():
        return None
    age_seconds = time.time() - cache_path.stat().st_mtime
    age_hours = age_seconds / 3600
    if age_hours > max_age_hours:
        return None
    with open(cache_path) as f:
        data = json.load(f)
        print(f"   Loaded from cache ({age_hours:.1f}h old)")
        return data


def save_cache(cache_path: Path, data):
    """Save data to cache"""
    with open(cache_path, "w") as f:
        json.dump(data, f, indent=2)


def detect_platform(url: str) -> str:
    """Detect event platform from URL"""
    url_lower = url.lower()
    if "lu.ma" in url_lower or "luma" in url_lower:
        return "luma"
    elif "eventbrite" in url_lower:
        return "eventbrite"
    return "unknown"


def scrape_single_event(url: str, no_cache: bool = False, cache_hours: int = 24) -> Dict:
    """Scrape a single event URL directly (free, hosts + public guests only)"""
    cache_path = get_cache_path(url)

    if not no_cache:
        cached = load_cache(cache_path, max_age_hours=cache_hours)
        if cached:
            return cached

    client = LumaClient()
    event_data = client.scrape_event(url)

    if event_data:
        save_cache(cache_path, event_data)

    return event_data


def search_events_apify(query: str, no_cache: bool = False, cache_hours: int = 24) -> List[Dict]:
    """Search Luma via Apify actor (paid, gets full guest profiles)"""
    cache_path = get_cache_path(f"search_{query}")

    if not no_cache:
        cached = load_cache(cache_path, max_age_hours=cache_hours)
        if cached:
            return cached

    client = LumaApifyClient()
    events = client.search_events(query)

    if events:
        save_cache(cache_path, events)

    return events


def extract_people(event_data: Dict, event_url: str = "") -> List[Dict]:
    """Extract all people from event data"""
    people = parse_luma_people(event_data)

    event_name = event_data.get("name", event_data.get("event", {}).get("name", "Unknown"))
    event_info = event_data.get("event", {})
    event_date = event_data.get("start_at", "")
    if not event_url:
        slug = event_info.get("url", event_data.get("slug", ""))
        if slug:
            event_url = f"https://lu.ma/{slug}"

    for person in people:
        person["event_name"] = event_name
        person["event_date"] = event_date
        person["event_url"] = event_url

    if not people:
        # Check ticket types for registered guest count
        total_registered = 0
        for tt in event_data.get("ticket_types", []):
            total_registered += tt.get("num_guests", 0)

        if total_registered > 0:
            print(f"   {event_name}: {total_registered} registered guests but guest profiles not public.")
            print(f"   Use --search mode (Apify) to get guest profiles if available.")
        else:
            print(f"   {event_name}: No guest data found.")

    return people


def write_csv(people: List[Dict], output_path: str):
    """Write people to CSV"""
    if not people:
        print("   No people to write")
        return

    columns = [
        "name", "event_role", "bio", "title", "company",
        "linkedin_url", "twitter_url", "instagram_url", "website_url",
        "username", "event_name", "event_date", "event_url",
    ]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(people)

    print(f"   Wrote {len(people)} people to {output_path}")


def write_json(people: List[Dict], output_path: str):
    """Write people to JSON"""
    with open(output_path, "w") as f:
        json.dump(people, f, indent=2)
    print(f"   Wrote {len(people)} people to {output_path}")


def print_people(people: List[Dict]):
    """Pretty-print people to console"""
    if not people:
        print("\nNo people found.")
        return

    print(f"\n{'='*80}")
    print(f"Found {len(people)} people across events")
    print(f"{'='*80}")

    # Group by event
    events = {}
    for person in people:
        event = person.get("event_name", "Unknown Event")
        if event not in events:
            events[event] = []
        events[event].append(person)

    for event_name, event_people in events.items():
        # Count by role
        role_counts = {}
        for p in event_people:
            role = p.get("event_role", "Unknown")
            role_counts[role] = role_counts.get(role, 0) + 1
        role_str = ", ".join(f"{count} {role}s" for role, count in role_counts.items())

        print(f"\n--- {event_name} ({role_str}) ---\n")
        for i, person in enumerate(event_people, 1):
            role = person.get("event_role", "")
            name = person.get("name", "Unknown")
            bio = person.get("bio", "")

            print(f"  {i}. {name} [{role}]")
            if bio:
                bio_short = bio[:120].replace("\n", " ") + ("..." if len(bio) > 120 else "")
                print(f"     {bio_short}")

            links = []
            if person.get("linkedin_url"):
                links.append(f"LI: {person['linkedin_url']}")
            if person.get("twitter_url"):
                links.append(f"TW: {person['twitter_url']}")
            if person.get("website_url"):
                links.append(f"Web: {person['website_url']}")
            if links:
                print(f"     {' | '.join(links)}")
            print()


def print_events_summary(events: List[Dict]):
    """Print a summary of discovered events"""
    print(f"\n{'='*80}")
    print(f"Found {len(events)} events")
    print(f"{'='*80}\n")

    total_guests = 0
    for i, event_data in enumerate(events, 1):
        event = event_data.get("event", event_data)
        name = event.get("name", "Unknown")
        date = event_data.get("start_at", "")
        guests = event_data.get("featured_guests", [])
        hosts = event_data.get("hosts", [])
        location = event.get("geo_address_info", {})
        loc_str = location.get("city_state", location.get("full_address", "")) if isinstance(location, dict) else ""

        print(f"  {i}. {name}")
        if date:
            print(f"     Date: {date[:10]}")
        if loc_str:
            print(f"     Location: {loc_str}")
        print(f"     Hosts: {len(hosts)} | Guests: {len(guests)}")

        slug = event.get("url", "")
        if slug:
            print(f"     URL: https://lu.ma/{slug}")
        print()
        total_guests += len(guests)

    print(f"Total guest profiles: {total_guests}")


def main():
    parser = argparse.ArgumentParser(
        description="Scrape conference/event attendees for prospecting",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Direct scrape hosts from specific events (free)
  python3 scrape_event.py https://lu.ma/abc123
  python3 scrape_event.py https://lu.ma/abc https://lu.ma/def

  # Search Luma for events + guest profiles (Apify, $29/mo)
  python3 scrape_event.py --search "AI San Francisco"
  python3 scrape_event.py --search "SaaS conference NYC"

  # Export to CSV
  python3 scrape_event.py --search "AI SF" --output guests.csv

  # Export as JSON
  python3 scrape_event.py --search "AI SF" --output guests.json --json

Environment:
  APIFY_API_TOKEN: Required for --search mode.
                   Get at https://console.apify.com/account/integrations
                   Rent actor at https://console.apify.com/actors/r5gMxLV2rOF3J1fxu
        """,
    )

    parser.add_argument("urls", nargs="*", help="Event URLs to scrape directly (Luma)")
    parser.add_argument("--search", "-s", help="Search Luma via Apify (e.g., 'AI San Francisco')")
    parser.add_argument("--output", "-o", help="Output file path (.csv or .json)")
    parser.add_argument("--json", action="store_true", help="Output JSON format")
    parser.add_argument("--no-cache", action="store_true", help="Skip cache, always fetch fresh")
    parser.add_argument("--cache-hours", type=int, default=24, help="Cache max age in hours (default: 24)")
    parser.add_argument("--events-only", action="store_true", help="Only show event list, don't extract people")

    args = parser.parse_args()

    if not args.urls and not args.search:
        parser.print_help()
        print("\nError: Provide event URLs or use --search to find events.")
        sys.exit(1)

    try:
        all_people = []

        # Apify search mode
        if args.search:
            if not os.getenv("APIFY_API_TOKEN"):
                print("Error: APIFY_API_TOKEN required for --search mode")
                print("Get token: https://console.apify.com/account/integrations")
                print("Rent actor: https://console.apify.com/actors/r5gMxLV2rOF3J1fxu")
                sys.exit(1)

            events = search_events_apify(
                args.search, no_cache=args.no_cache, cache_hours=args.cache_hours
            )

            if args.events_only:
                print_events_summary(events)
                return

            print(f"\n   Found {len(events)} events, extracting people...")
            for event_data in events:
                people = extract_people(event_data)
                all_people.extend(people)

        # Direct URL scrape mode
        if args.urls:
            for url in args.urls:
                print(f"\nScraping: {url}")
                event_data = scrape_single_event(
                    url, no_cache=args.no_cache, cache_hours=args.cache_hours
                )
                people = extract_people(event_data, url)
                all_people.extend(people)

        # Output
        if args.output:
            if args.json or args.output.endswith(".json"):
                write_json(all_people, args.output)
            else:
                write_csv(all_people, args.output)
        else:
            print_people(all_people)

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
