#!/usr/bin/env python3
"""
Create a Google Sheet via Rube MCP server using SSE transport.
Uses RUBE_REMOTE_WORKBENCH to run Composio tools for Google Sheets.
"""

import json
import os
import sys
import requests
import uuid

RUBE_MCP_URL = "https://rube.app/mcp"
RUBE_TOKEN = os.getenv("RUBE_TOKEN", "")

HEADERS = {
    "Authorization": f"Bearer {RUBE_TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
}

# Track session ID for MCP Streamable HTTP
session_id = None


def mcp_call(method, params=None):
    """Make a JSON-RPC call to Rube MCP (SSE transport)."""
    if not RUBE_TOKEN:
        print("ERROR: RUBE_TOKEN environment variable is not set.")
        print("Set it with: export RUBE_TOKEN='your_jwt_token_here'")
        return None
    global session_id
    payload = {
        "jsonrpc": "2.0",
        "id": str(uuid.uuid4()),
        "method": method,
    }
    if params:
        payload["params"] = params

    hdrs = dict(HEADERS)
    if session_id:
        hdrs["Mcp-Session-Id"] = session_id

    resp = requests.post(RUBE_MCP_URL, headers=hdrs, json=payload, timeout=120)
    resp.raise_for_status()

    # Check for session ID in response headers
    if "Mcp-Session-Id" in resp.headers:
        session_id = resp.headers["Mcp-Session-Id"]

    # Parse SSE response
    text = resp.text
    for line in text.split("\n"):
        if line.startswith("data: "):
            data = json.loads(line[6:])
            if "error" in data:
                print(f"MCP Error: {json.dumps(data['error'], indent=2)}")
                return None
            return data.get("result")

    # Try as plain JSON
    try:
        data = json.loads(text)
        return data.get("result")
    except:
        pass

    return None


def call_tool(tool_name, arguments):
    """Call an MCP tool."""
    return mcp_call("tools/call", {"name": tool_name, "arguments": arguments})


def create_sheet(title, header, rows):
    """Create and populate a Google Sheet using RUBE_REMOTE_WORKBENCH."""

    all_values = [header] + rows
    all_values_json = json.dumps(all_values)

    # Use RUBE_REMOTE_WORKBENCH to create sheet and write data
    workbench_code = f"""
import json

# Step 1: Create spreadsheet
print("Creating spreadsheet...")
result, error = run_composio_tool("GOOGLESHEETS_CREATE_GOOGLE_SHEET1", {{
    "title": {json.dumps(title)}
}})

if error:
    print(f"ERROR creating sheet: {{error}}")
    raise Exception(f"Failed to create sheet: {{error}}")

# Extract spreadsheet ID
spreadsheet_id = None
if isinstance(result, dict):
    spreadsheet_id = result.get("spreadsheetId") or result.get("data", {{}}).get("spreadsheetId")
    if not spreadsheet_id and "response_data" in result:
        rd = result["response_data"]
        if isinstance(rd, dict):
            spreadsheet_id = rd.get("spreadsheetId")
        elif isinstance(rd, str):
            import json as j
            try:
                spreadsheet_id = j.loads(rd).get("spreadsheetId")
            except:
                pass

if not spreadsheet_id:
    print(f"DEBUG result: {{json.dumps(result, default=str)[:2000]}}")
    raise Exception("Could not extract spreadsheet ID")

sheet_url = f"https://docs.google.com/spreadsheets/d/{{spreadsheet_id}}"
print(f"Created: {{sheet_url}}")

# Step 2: Write all data
all_values = {all_values_json}
print(f"Writing {{len(all_values)-1}} data rows...")

result2, error2 = run_composio_tool("GOOGLESHEETS_BATCH_UPDATE", {{
    "spreadsheet_id": spreadsheet_id,
    "sheet_name": "Sheet1",
    "first_cell_location": "A1",
    "values": all_values,
    "valueInputOption": "USER_ENTERED"
}})

if error2:
    print(f"Write warning: {{error2}}")
else:
    print("Data written successfully.")

# Step 3: Format header row (bold)
try:
    result3, error3 = run_composio_tool("GOOGLESHEETS_FORMAT_CELL", {{
        "spreadsheet_id": spreadsheet_id,
        "range": "A1:{chr(64+len(header))}1",
        "bold": True,
        "fontSize": 11,
    }})
    if not error3:
        print("Header formatted.")
except Exception as e:
    print(f"Format note: {{e}}")

# Step 4: Resize columns
try:
    widths = [70, 70, 180, 80, 160, 200, 250, 80, 250, 300, 150, 180, 180, 200, 200, 200, 300]
    requests_list = []
    for i, w in enumerate(widths[:len(all_values[0])]):
        requests_list.append({{
            "updateDimensionProperties": {{
                "range": {{"sheetId": 0, "dimension": "COLUMNS", "startIndex": i, "endIndex": i+1}},
                "properties": {{"pixelSize": w}},
                "fields": "pixelSize"
            }}
        }})

    proxy_execute(
        "POST",
        f"https://sheets.googleapis.com/v4/spreadsheets/{{spreadsheet_id}}:batchUpdate",
        "googlesheets",
        body={{"requests": requests_list}}
    )
    print("Columns resized.")
except Exception as e:
    print(f"Resize note: {{e}}")

print(f"\\nSHEET_URL={{sheet_url}}")
"""

    print("Launching Rube workbench...")
    result = call_tool("RUBE_REMOTE_WORKBENCH", {
        "code_to_execute": workbench_code,
        "toolkits": ["googlesheets"],
    })

    if not result:
        print("ERROR: Workbench returned no result")
        sys.exit(1)

    # Extract output
    content = result.get("content", [])
    output_text = ""
    for item in content:
        text = item.get("text", "")
        output_text += text + "\n"
        print(text)

    # Extract sheet URL
    for line in output_text.split("\n"):
        if line.startswith("SHEET_URL="):
            return line.split("=", 1)[1].strip()

    return None


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 create_sheet_mcp.py <rows.json>")
        sys.exit(1)

    results_file = sys.argv[1]
    data = json.load(open(results_file))

    header = [
        "Tier", "Signal", "Company", "Employees", "Industry",
        "Website", "LinkedIn", "# Postings", "Job Titles",
        "Job URL", "Location", "Decision Maker", "Outreach Angle",
        "Tech Stack", "Growth Signals", "Pain Points", "Description"
    ]

    url = create_sheet("Job Posting Intent Signals - 2026-02-22", header, data)
    if url:
        print(f"\nSheet ready: {url}")
