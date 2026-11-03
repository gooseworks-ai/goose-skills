#!/usr/bin/env python3
"""
Create a Google Sheet with job posting intent results via Rube/Composio API.
"""

import json
import os
import sys
import requests

RUBE_URL = "https://rube.app"
RUBE_TOKEN = os.getenv("RUBE_TOKEN", "")

headers = {
    "Authorization": f"Bearer {RUBE_TOKEN}",
    "Content-Type": "application/json",
}


def call_rube_tool(tool_name, params):
    """Call a Composio tool via Rube's MCP endpoint."""
    if not RUBE_TOKEN:
        print("ERROR: RUBE_TOKEN environment variable is not set.")
        print("Set it with: export RUBE_TOKEN='your_jwt_token_here'")
        sys.exit(1)
    resp = requests.post(
        f"{RUBE_URL}/api/composio/execute",
        headers=headers,
        json={"toolName": tool_name, "params": params},
    )
    resp.raise_for_status()
    return resp.json()


def create_sheet(title, header, rows):
    """Create a Google Sheet and populate it."""

    # Step 1: Create the spreadsheet
    print(f"Creating Google Sheet: {title}")
    result = call_rube_tool("GOOGLESHEETS_CREATE_GOOGLE_SHEET1", {"title": title})

    data = result.get("data", result)
    spreadsheet_id = None

    # Try to extract spreadsheet ID from various response formats
    if isinstance(data, dict):
        spreadsheet_id = data.get("spreadsheetId") or data.get("data", {}).get("spreadsheetId")
        if not spreadsheet_id and "response_data" in data:
            rd = data["response_data"]
            if isinstance(rd, dict):
                spreadsheet_id = rd.get("spreadsheetId")
            elif isinstance(rd, str):
                try:
                    rd_parsed = json.loads(rd)
                    spreadsheet_id = rd_parsed.get("spreadsheetId")
                except:
                    pass

    if not spreadsheet_id:
        print(f"DEBUG: Full response: {json.dumps(result, indent=2)[:2000]}")
        print("ERROR: Could not extract spreadsheet ID from response")
        sys.exit(1)

    sheet_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}"
    print(f"Created: {sheet_url}")

    # Step 2: Write data
    all_values = [header] + rows
    print(f"Writing {len(rows)} rows...")

    result = call_rube_tool("GOOGLESHEETS_BATCH_UPDATE", {
        "spreadsheet_id": spreadsheet_id,
        "sheet_name": "Sheet1",
        "first_cell_location": "A1",
        "values": all_values,
        "valueInputOption": "USER_ENTERED",
    })
    print("Data written.")

    # Step 3: Format header
    print("Formatting...")
    try:
        call_rube_tool("GOOGLESHEETS_FORMAT_CELL", {
            "spreadsheet_id": spreadsheet_id,
            "range": f"A1:{chr(64+len(header))}1",
            "bold": True,
            "fontSize": 11,
            "red": 0.15,
            "green": 0.15,
            "blue": 0.15,
        })
    except Exception as e:
        print(f"  Format warning: {e}")

    print(f"\nDone! Sheet URL: {sheet_url}")
    return sheet_url


if __name__ == "__main__":
    results_file = sys.argv[1] if len(sys.argv) > 1 else None
    if not results_file:
        print("Usage: python3 create_sheet.py <results.json>")
        sys.exit(1)

    data = json.load(open(results_file))

    # Build sheet data from the qualified results JSON
    header = [
        "Tier", "Signal", "Company", "Employees", "Industry",
        "Website", "LinkedIn", "# Postings", "Job Titles",
        "Job URL", "Location", "Decision Maker", "Outreach Angle",
        "Tech Stack", "Growth Signals", "Pain Points", "Company Description"
    ]

    # data should already be a list of rows
    if isinstance(data[0], list):
        rows = data
    else:
        print("ERROR: Expected pre-formatted rows")
        sys.exit(1)

    create_sheet("Job Posting Intent Signals - 2026-02-22", header, rows)
