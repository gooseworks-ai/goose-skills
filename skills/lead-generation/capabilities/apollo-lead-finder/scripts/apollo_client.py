#!/usr/bin/env python3
"""
Apollo REST Client — Thin API wrapper using only urllib
--------------------------------------------------------
Provides People Search (free), enrichment (paid), list management,
and contact creation against the Apollo.io API.

No external dependencies — uses urllib.request only, following
the zero-dependency pattern used across all tools in this project.

Supports a proxy+fallback pattern:
  - If GOOSEWORKS_API_KEY is set, routes requests through the GooseWorks proxy.
  - Otherwise, hits https://api.apollo.io directly using the caller's APOLLO_API_KEY.

Usage:
    from apollo_client import ApolloClient

    client = ApolloClient(api_key)
    results = client.search_people({"person_titles": ["VP Sales"]})
    enriched = client.bulk_enrich_people([{"linkedin_url": "..."}])
"""

import json
import os
import time
import urllib.request
import urllib.parse
import urllib.error

GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    BASE_URL = f"{GOOSEWORKS_API_BASE}/v1/proxy/apollo"
else:
    BASE_URL = "https://api.apollo.io"

MAX_RETRIES = 3


class ApolloClient:
    """Thin REST client for the Apollo.io API."""

    def __init__(self, api_key=None):
        """
        Args:
            api_key: APOLLO_API_KEY from Apollo settings.
                     Optional when running under GooseWorks (key is managed server-side).
        """
        self.api_key = api_key or ""
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; ApolloClient/1.0)",
        }
        if GOOSEWORKS_API_KEY:
            self.headers["Authorization"] = f"Bearer {GOOSEWORKS_API_KEY}"

    def _request(self, method, path, data=None, retries=MAX_RETRIES):
        """Generic HTTP request to Apollo API with retry logic.

        Handles:
          - 429 rate limit with Retry-After header
          - 5xx server errors with exponential backoff

        Args:
            method: HTTP method (GET, POST)
            path: API path (e.g., "/mixed_people/search")
            data: Request body dict (will be JSON-encoded)
            retries: Max retry attempts

        Returns:
            Parsed JSON response dict.

        Raises:
            urllib.error.HTTPError: On non-recoverable errors.
        """
        url = f"{BASE_URL}{path}"
        # Include api_key in body for POST requests (Apollo's primary auth method)
        if data is not None and method == "POST":
            data = dict(data)
            if self.api_key:
                data["api_key"] = self.api_key
        body = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=body, headers=self.headers, method=method)

        for attempt in range(retries):
            try:
                with urllib.request.urlopen(req, timeout=60) as resp:
                    raw = resp.read().decode("utf-8")
                    if not raw:
                        return None
                    return json.loads(raw)
            except urllib.error.HTTPError as e:
                error_body = e.read().decode("utf-8") if e.fp else ""
                if e.code == 429:
                    # Rate limited — check Retry-After header
                    retry_after = e.headers.get("Retry-After")
                    wait = int(retry_after) if retry_after else 60
                    print(f"  Rate limited (429). Waiting {wait}s...")
                    time.sleep(wait)
                    continue
                elif e.code >= 500 and attempt < retries - 1:
                    wait = 5 * (2 ** attempt)
                    print(f"  Server error ({e.code}). Retrying in {wait}s... (attempt {attempt + 1}/{retries})")
                    time.sleep(wait)
                    continue
                else:
                    print(f"  Apollo API error ({e.code}): {error_body[:500]}")
                    raise
            except urllib.error.URLError as e:
                if attempt < retries - 1:
                    wait = 5 * (2 ** attempt)
                    print(f"  Connection error: {e}. Retrying in {wait}s...")
                    time.sleep(wait)
                    continue
                raise

        print("  ERROR: Max retries exceeded.")
        return None

    # -- Search (FREE) -----------------------------------------------------

    def search_people(self, filters, page=1, per_page=100):
        """Search for people matching filters. FREE — no credits consumed.

        Args:
            filters: Dict of Apollo search filters, e.g.:
                {
                    "person_titles": ["VP Sales"],
                    "person_seniority": ["vp", "director"],
                    "person_locations": ["United States"],
                    "organization_num_employees_ranges": ["51,200"],
                    "q_organization_keyword_tags": ["SaaS"]
                }
            page: Page number (1-indexed)
            per_page: Results per page (max 100)

        Returns:
            Full API response dict with 'people' and 'pagination' keys.
        """
        payload = {
            "page": page,
            "per_page": min(per_page, 100),
        }
        payload.update(filters)
        return self._request("POST", "/mixed_people/api_search", data=payload)

    # -- Enrichment (COSTS CREDITS) ----------------------------------------

    def enrich_person(self, first_name=None, last_name=None, organization_name=None,
                      linkedin_url=None, email=None, domain=None):
        """Enrich a single person to reveal email/phone. Costs 1 credit.

        Provide as many identifiers as possible for best match rate.
        At minimum, provide linkedin_url OR (first_name + last_name + organization_name).

        Returns:
            API response dict with 'person' key containing enriched data.
        """
        payload = {}
        if first_name:
            payload["first_name"] = first_name
        if last_name:
            payload["last_name"] = last_name
        if organization_name:
            payload["organization_name"] = organization_name
        if linkedin_url:
            payload["linkedin_url"] = linkedin_url
        if email:
            payload["email"] = email
        if domain:
            payload["domain"] = domain
        return self._request("POST", "/people/match", data=payload)

    def bulk_enrich_people(self, details_list):
        """Bulk enrich up to 10 people per request. Costs 1 credit each.

        Args:
            details_list: List of dicts, each with identifiers:
                [
                    {"linkedin_url": "https://linkedin.com/in/john"},
                    {"first_name": "Jane", "last_name": "Doe", "organization_name": "Acme"},
                ]
                Max 10 per request.

        Returns:
            API response dict with 'matches' key — list of matched person objects.
        """
        payload = {"details": details_list[:10]}
        return self._request("POST", "/people/bulk_match", data=payload)

    # -- Organization Search (COSTS CREDITS) -------------------------------

    def search_organizations(self, filters, page=1, per_page=100):
        """Search for organizations. Costs credits — use sparingly.

        Args:
            filters: Dict of Apollo org search filters.
            page: Page number (1-indexed)
            per_page: Results per page (max 100)

        Returns:
            Full API response dict.
        """
        payload = {
            "page": page,
            "per_page": min(per_page, 100),
        }
        payload.update(filters)
        return self._request("POST", "/mixed_companies/search", data=payload)

    # -- Organization Search (by name, to discover domain) -----------------

    def search_organizations_by_name(self, name, page=1, per_page=5):
        """Search for organizations by name. Returns matching orgs with domains.

        Useful for discovering a company's domain when you only have its name,
        so you can then call enrich_organization(domain=...).

        Args:
            name: Company name to search for (e.g., "Acme Corp").
            page: Page number (1-indexed).
            per_page: Results per page (max 100, default 5 for lookup use).

        Returns:
            Full API response dict with 'organizations' key, or None on error.
        """
        payload = {
            "q_organization_name": name,
            "page": page,
            "per_page": min(per_page, 100),
        }
        return self._request("POST", "/mixed_companies/search", data=payload)

    # -- Organization Enrichment (COSTS CREDITS) ---------------------------

    def enrich_organization(self, domain=None, name=None):
        """Enrich a single organization by domain. Costs 1 credit.

        Apollo's /organizations/enrich endpoint requires a domain parameter.
        If only a name is provided, this method will first search for the
        organization by name to discover its domain, then enrich by domain.

        Returns the full organization profile: industry, employee count,
        funding stage, tech stack, keywords, location, and more.

        Args:
            domain: Company domain (e.g., "acme.com"). Primary lookup key.
            name: Company name (fallback — triggers a search to find domain first).

        Returns:
            API response dict with 'organization' key containing enriched data,
            or None if the domain cannot be resolved.
        """
        # If we don't have a domain but have a name, search to find the domain
        if not domain and name:
            domain = self._resolve_domain_from_name(name)
            if not domain:
                return None

        if not domain:
            print("  enrich_organization: no domain or name provided")
            return None

        payload = {"domain": domain}
        if self.api_key:
            payload["api_key"] = self.api_key
        params = urllib.parse.urlencode(payload)
        return self._request("GET", f"/organizations/enrich?{params}")

    def _resolve_domain_from_name(self, name):
        """Search Apollo for a company by name and return its primary domain.

        Args:
            name: Company name to look up.

        Returns:
            Domain string (e.g., "acme.com") or None if not found.
        """
        try:
            resp = self.search_organizations_by_name(name, per_page=3)
            orgs = (resp or {}).get("organizations", [])
            if not orgs:
                return None

            # Try exact name match first, then fall back to first result
            name_lower = name.lower().strip()
            for org in orgs:
                org_name = (org.get("name") or "").lower().strip()
                org_domain = org.get("primary_domain") or org.get("domain") or ""
                if org_name == name_lower and org_domain:
                    return org_domain

            # No exact match — use first result that has a domain
            for org in orgs:
                org_domain = org.get("primary_domain") or org.get("domain") or ""
                if org_domain:
                    return org_domain

            return None
        except Exception as e:
            print(f"    _resolve_domain_from_name('{name}'): {e}")
            return None

    # -- List Management ---------------------------------------------------

    def create_list(self, name, list_type="contacts"):
        """Create a named list (label) in Apollo.

        Args:
            name: List name (e.g., "vp-sales-us-2026-03")
            list_type: "contacts" (default) or "accounts"

        Returns:
            API response dict with created label info including 'id'.
        """
        payload = {
            "name": name,
            "modality": list_type,
        }
        return self._request("POST", "/labels", data=payload)

    # -- Contact Management ------------------------------------------------

    def create_contact(self, person_data, label_ids=None):
        """Create a contact in Apollo CRM.

        Args:
            person_data: Dict with contact fields:
                {
                    "first_name": "John",
                    "last_name": "Doe",
                    "organization_name": "Acme",
                    "title": "VP Sales",
                    "linkedin_url": "https://linkedin.com/in/john"
                }
            label_ids: Optional list of label (list) IDs to add contact to.

        Returns:
            API response dict with created contact info.
        """
        payload = dict(person_data)
        if label_ids:
            payload["label_ids"] = label_ids
        return self._request("POST", "/contacts", data=payload)
