#!/usr/bin/env python3
"""
Event scraping clients for Luma and Eventbrite.

Two approaches for Luma:
1. LumaClient (free) - Direct page scraping via __NEXT_DATA__ JSON.
   Gets event metadata + hosts. Guest list only if publicly visible in page.
2. LumaApifyClient (paid) - Uses lexis-solutions/lu-ma-scraper Apify actor.
   Gets full event data including featured_guests (registered attendee profiles
   with LinkedIn, Twitter, bio, etc). Requires APIFY_API_TOKEN. $29/month flat.
"""
import os
import re
import json
import requests
import time
from typing import Dict, List, Optional
from urllib.parse import urlparse


def _normalize_linkedin(handle: str) -> str:
    """Convert a LinkedIn handle to a full URL."""
    if not handle:
        return ""
    if handle.startswith("http"):
        return handle
    if handle.startswith("/"):
        return f"https://linkedin.com{handle}"
    return f"https://linkedin.com/in/{handle}"


def _normalize_twitter(handle: str) -> str:
    """Convert a Twitter handle to a full URL."""
    if not handle:
        return ""
    if handle.startswith("http"):
        return handle
    return f"https://twitter.com/{handle.lstrip('@')}"


def _parse_luma_person(person: Dict, role: str) -> Dict:
    """Parse a Luma host/guest dict into a normalized person dict."""
    if isinstance(person, str):
        return {"name": person, "event_role": role}

    return {
        "name": person.get("name", ""),
        "bio": person.get("bio_short", "") or "",
        "title": person.get("title", "") or "",
        "company": person.get("company", "") or "",
        "avatar_url": person.get("avatar_url", ""),
        "linkedin_url": _normalize_linkedin(person.get("linkedin_handle", "") or ""),
        "twitter_url": _normalize_twitter(person.get("twitter_handle", "") or ""),
        "instagram_url": person.get("instagram_handle", "") or "",
        "website_url": person.get("website", "") or "",
        "username": person.get("username", "") or "",
        "event_role": role,
    }


def parse_luma_people(event_data: Dict) -> List[Dict]:
    """
    Extract all people (hosts, featured guests, session speakers) from Luma event data.
    Works with both direct-scraped and Apify-scraped data.
    """
    people = []

    for host in event_data.get("hosts", []):
        people.append(_parse_luma_person(host, "Host"))

    for guest in event_data.get("featured_guests", []):
        people.append(_parse_luma_person(guest, "Guest"))

    for session in event_data.get("sessions", []):
        if isinstance(session, dict):
            for speaker in session.get("speakers", []):
                people.append(_parse_luma_person(speaker, "Speaker"))

    return people


class LumaClient:
    """
    Direct Luma event scraper (free, no API key needed).

    Extracts structured data from Luma event pages by parsing the embedded
    __NEXT_DATA__ JSON. Gets event metadata, hosts, and featured_guests
    (only if the event has show_guest_list enabled and guests are in the page).
    """

    def scrape_event(self, event_url: str) -> Dict:
        """Scrape a single Luma event page directly."""
        print(f"   Fetching: {event_url}")

        response = requests.get(event_url, timeout=30, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        })
        response.raise_for_status()

        match = re.search(
            r'<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)</script>',
            response.text,
            re.DOTALL,
        )
        if not match:
            raise ValueError(f"Could not find __NEXT_DATA__ in page: {event_url}")

        next_data = json.loads(match.group(1))
        props = next_data.get("props", {}).get("pageProps", {}).get("initialData", {}).get("data", {})

        if not props:
            raise ValueError(f"No event data found in page: {event_url}")

        event = props.get("event", {})

        return {
            "name": event.get("name", ""),
            "description": event.get("description", ""),
            "url": event_url,
            "slug": event.get("url", ""),
            "start_at": props.get("start_at", ""),
            "show_guest_list": event.get("show_guest_list", False),
            "hosts": props.get("hosts", []),
            "featured_guests": props.get("featured_guests", []),
            "guest_count": props.get("guest_count", 0),
            "ticket_count": props.get("ticket_count", 0),
            "categories": props.get("categories", []),
            "sessions": props.get("sessions", []),
            "sold_out": props.get("sold_out", False),
            "geo_address_info": event.get("geo_address_info", {}),
            "ticket_types": props.get("ticket_types", []),
        }


class LumaApifyClient:
    """
    Luma scraper via Apify (lexis-solutions/lu-ma-scraper).

    Searches Luma's explore page and returns full event data including
    featured_guests with profiles (name, bio, LinkedIn, Twitter, etc).

    Requires: APIFY_API_TOKEN
    Pricing: $29/month flat subscription
    Rental: https://console.apify.com/actors/r5gMxLV2rOF3J1fxu
    """

    ACTOR_ID = "lexis-solutions~lu-ma-scraper"
    _GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
    _GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

    if _GOOSEWORKS_API_KEY:
        BASE_URL = f"{_GOOSEWORKS_API_BASE}/v1/proxy/apify"
    else:
        BASE_URL = "https://api.apify.com/v2"

    def __init__(self, api_token: Optional[str] = None):
        self.api_token = api_token or self._GOOSEWORKS_API_KEY or os.getenv("APIFY_API_TOKEN")
        if not self.api_token:
            raise ValueError(
                "Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var."
            )

    def _run_actor(self, run_input: Dict, timeout: int = 180) -> List[Dict]:
        """Start the Apify actor and wait for results."""
        print(f"   Starting Apify Luma scraper...")

        response = requests.post(
            f"{self.BASE_URL}/acts/{self.ACTOR_ID}/runs",
            json=run_input,
            params={"token": self.api_token},
        )

        if response.status_code == 402:
            raise ValueError(
                "Apify actor not rented. Rent it at: https://console.apify.com/actors/r5gMxLV2rOF3J1fxu\n"
                "Cost: $29/month flat. Free 24h trial available."
            )
        response.raise_for_status()

        run_data = response.json()
        run_id = run_data["data"]["id"]
        print(f"   Run started (ID: {run_id}), waiting for results...")

        start_time = time.time()
        while True:
            if time.time() - start_time > timeout:
                raise TimeoutError(f"Apify actor timed out after {timeout}s")

            status_response = requests.get(
                f"{self.BASE_URL}/acts/{self.ACTOR_ID}/runs/{run_id}",
                params={"token": self.api_token},
            )
            status_response.raise_for_status()
            status_data = status_response.json()
            status = status_data["data"]["status"]

            if status == "SUCCEEDED":
                break
            elif status in ["FAILED", "ABORTED", "TIMED-OUT"]:
                raise Exception(f"Apify actor run {status}")

            time.sleep(5)

        dataset_id = status_data["data"]["defaultDatasetId"]
        dataset_response = requests.get(
            f"{self.BASE_URL}/datasets/{dataset_id}/items",
            params={"token": self.api_token, "format": "json"},
        )
        dataset_response.raise_for_status()
        return dataset_response.json()

    def search_events(self, query: str) -> List[Dict]:
        """
        Search Luma for events matching a query.

        Args:
            query: Search terms (e.g., "AI San Francisco", "SaaS NYC")

        Returns:
            List of full event data dicts, each with featured_guests
        """
        print(f"   Searching Luma for: {query}")
        return self._run_actor({"query": query})

    def scrape_event_by_query(self, event_name: str) -> List[Dict]:
        """
        Find a specific event by name/keyword.
        Since this actor uses search, pass the event name as the query.
        """
        return self.search_events(event_name)
