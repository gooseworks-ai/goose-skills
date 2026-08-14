#!/usr/bin/env python3
"""
Extruct REST Client — Thin API wrapper using only urllib
---------------------------------------------------------
Provides semantic search, lookalike search, Deep Search,
table management, column operations, and enrichment runs
against the Extruct API.

No external dependencies — uses urllib.request only.

Usage:
    from extruct_client import ExtructClient

    client = ExtructClient(api_token)
    results = client.search("AI procurement startups", limit=20)
    similar = client.lookalike("stripe.com", limit=20)
    task = client.deep_search_create(query="...", num_results=25)
"""

import json
import time
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = "https://api.extruct.ai"
MAX_RETRIES = 3


class ExtructClient:
    """Thin REST client for the Extruct API."""

    def __init__(self, api_token, base_url=BASE_URL):
        if not base_url.startswith("https://"):
            raise ValueError(
                f"base_url must use HTTPS to protect the API token: {base_url}"
            )
        self.api_token = api_token
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _request(self, method, path, data=None, query=None, retries=MAX_RETRIES):
        """Generic HTTP request with retry logic.

        Handles:
          - 429 rate limit / billing rejection
          - 5xx server errors with exponential backoff

        Returns:
            Parsed JSON response dict.
        """
        url = self.base_url + path
        if query:
            url += "?" + urllib.parse.urlencode(query, doseq=True)

        body = json.dumps(data).encode("utf-8") if data else None

        for attempt in range(retries):
            req = urllib.request.Request(
                url=url, data=body, headers=self.headers, method=method
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    raw = resp.read()
                    return json.loads(raw) if raw else None
            except urllib.error.HTTPError as e:
                error_body = e.read().decode("utf-8", errors="replace")
                if e.code == 429:
                    print(f"  Rate limited (429). Billing or quota issue.")
                    raise
                elif e.code >= 500 and attempt < retries - 1:
                    wait = 5 * (2 ** attempt)
                    print(f"  Server error ({e.code}). Retrying in {wait}s...")
                    time.sleep(wait)
                    continue
                else:
                    raise Exception(
                        f"Extruct API error {e.code} {method} {path}: {error_body}"
                    )

    # ── Auth ──────────────────────────────────────────────────────

    def auth_user(self):
        """Verify API token and return user info."""
        return self._request("GET", "/auth/user")

    def healthcheck(self):
        """Check API connectivity."""
        return self._request("GET", "/healthcheck")

    # ── Semantic Search ───────────────────────────────────────────

    def search(self, query, limit=20, offset=0, filters=None):
        """Semantic company search.

        Args:
            query: Natural language description of target companies.
            limit: Max results per page.
            offset: Pagination offset.
            filters: Optional dict with include/exclude/range filters.

        Returns:
            List of company results.
        """
        payload = {"query": query, "limit": limit, "offset": offset}
        if filters:
            payload["filters"] = filters
        return self._request("POST", "/companies/search", data=payload)

    # ── Lookalike Search ──────────────────────────────────────────

    def lookalike(self, company_identifier, limit=20, offset=0, filters=None):
        """Find companies similar to a seed company.

        Args:
            company_identifier: Domain, URL, or Extruct UUID of seed company.
            limit: Max results per page.
            offset: Pagination offset.
            filters: Optional dict with include/exclude/range filters.

        Returns:
            List of similar company results.
        """
        payload = {
            "company_identifier": company_identifier,
            "limit": limit,
            "offset": offset,
        }
        if filters:
            payload["filters"] = filters
        return self._request("POST", "/companies/similar", data=payload)

    # ── Deep Search ───────────────────────────────────────────────

    def deep_search_create(self, query, num_results=25, criteria=None):
        """Create an async Deep Search task.

        Args:
            query: 2-3 sentence description of ideal companies.
            num_results: Desired number of verified results.
            criteria: Optional list of scoring criteria dicts.

        Returns:
            Task dict with task ID and status.
        """
        payload = {"query": query, "desired_num_results": num_results}
        if criteria:
            payload["criteria"] = criteria
        return self._request("POST", "/deep-search", data=payload)

    def deep_search_get(self, task_id):
        """Get Deep Search task status."""
        return self._request("GET", f"/deep-search/{task_id}")

    def deep_search_results(self, task_id, limit=50, offset=0):
        """Fetch Deep Search results (can be called while task is running)."""
        return self._request(
            "GET", f"/deep-search/{task_id}/results",
            query={"limit": limit, "offset": offset},
        )

    def deep_search_poll(self, task_id, interval=10, max_attempts=120):
        """Poll Deep Search task until done or exhausted.

        Returns:
            Final task status dict.
        """
        for _ in range(max_attempts):
            status = self.deep_search_get(task_id)
            state = status.get("status", "")
            if state == "done" or status.get("is_exhausted"):
                return status
            time.sleep(interval)
        raise TimeoutError(f"Deep Search {task_id} did not complete in time")

    # ── Tables ────────────────────────────────────────────────────

    def tables_create(self, name, kind="company"):
        """Create a new table.

        Args:
            name: Table display name.
            kind: "company", "people", or "generic".
        """
        return self._request("POST", "/tables", data={"name": name, "kind": kind})

    def tables_get(self, table_id):
        """Get table metadata."""
        return self._request("GET", f"/tables/{table_id}")

    def tables_list(self, limit=20, offset=0):
        """List tables."""
        return self._request("GET", "/tables", query={"limit": limit, "offset": offset})

    def tables_data(self, table_id, limit=50, offset=0, columns=None):
        """Fetch table row data.

        Args:
            columns: Optional comma-separated column keys to fetch.
        """
        query = {"limit": limit, "offset": offset}
        if columns:
            query["columns"] = columns
        return self._request("GET", f"/tables/{table_id}/data", query=query)

    def tables_run(self, table_id, mode="new", columns=None):
        """Trigger a table run.

        Args:
            mode: "new", "all", or "failed".
            columns: Optional list of column IDs to scope the run.
        """
        payload = {"mode": mode}
        if columns:
            payload["columns"] = columns
        return self._request("POST", f"/tables/{table_id}/run", data=payload)

    def tables_poll(self, table_id, interval=5, max_attempts=60):
        """Poll table until run completes."""
        for _ in range(max_attempts):
            status = self.tables_get(table_id)
            if status.get("status") in ("done", "idle"):
                return status
            time.sleep(interval)
        raise TimeoutError(f"Table {table_id} run did not complete in time")

    # ── Rows ──────────────────────────────────────────────────────

    def rows_create(self, table_id, rows, run=False):
        """Add rows to a table.

        Args:
            rows: List of dicts, each with {"data": {"input": "domain.com"}}.
            run: Whether to trigger enrichment immediately.
        """
        return self._request(
            "POST", f"/tables/{table_id}/rows",
            data={"rows": rows, "run": run},
        )

    def rows_delete(self, table_id, row_ids):
        """Delete rows by ID."""
        return self._request(
            "DELETE", f"/tables/{table_id}/rows",
            data={"rows": row_ids},
        )

    # ── Columns ───────────────────────────────────────────────────

    def columns_list(self, table_id):
        """List all columns on a table."""
        return self._request("GET", f"/tables/{table_id}/columns")

    def columns_add(self, table_id, column_configs):
        """Add columns to a table.

        Args:
            column_configs: List of column config dicts.
        """
        return self._request(
            "POST", f"/tables/{table_id}/columns",
            data={"column_configs": column_configs},
        )

    def columns_delete(self, table_id, column_id):
        """Delete a column."""
        return self._request("DELETE", f"/tables/{table_id}/columns/{column_id}")
