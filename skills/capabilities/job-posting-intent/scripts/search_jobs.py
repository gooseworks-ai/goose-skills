#!/usr/bin/env python3
"""
Job Posting Intent Signal Detection - Apify LinkedIn Jobs Scraper

Searches LinkedIn Jobs for postings that indicate buying intent,
groups by company, and outputs qualified leads with context.

Pricing (harvestapi/linkedin-job-search):
  - $0.001 per job result + $0.001 actor start cost per run
  - One run per job title × location combination
  - Example: 5 titles × 1 location × 25 jobs each = $0.005 start + $0.125 jobs = ~$0.13

Usage:
  python3 search_jobs.py --titles "GTM Engineer,SDR Manager" --locations "United States" --max-per-title 25
  python3 search_jobs.py --titles "AI Engineer" --posted-limit week --output results.json
"""

import os
import sys
import json
import time
import argparse
import hashlib
import uuid
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime, date

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package required. Install with: pip3 install requests")
    sys.exit(1)


ACTOR_ID = "harvestapi~linkedin-job-search"

GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    BASE_URL = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    BASE_URL = "https://api.apify.com/v2"

# Pricing constants
COST_PER_JOB = 0.001      # $0.001 per job result
COST_PER_START = 0.001     # $0.001 per actor run start
APIFY_MARGIN = 0.20        # 20% Apify platform margin

# Rube MCP config for Google Sheets
RUBE_MCP_URL = "https://rube.app/mcp"
RUBE_TOKEN = os.getenv("RUBE_TOKEN", "")
_mcp_session_id = None


def get_token() -> str:
    token = GOOSEWORKS_API_KEY or os.getenv("APIFY_API_TOKEN")
    if not token:
        print("Error: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)
    return token


def estimate_cost(num_titles: int, num_locations: int, max_per_title: int) -> dict:
    """Estimate cost before running."""
    num_runs = num_titles * max(num_locations, 1)
    max_jobs = num_runs * max_per_title

    start_costs = num_runs * COST_PER_START
    job_costs = max_jobs * COST_PER_JOB
    subtotal = start_costs + job_costs
    with_margin = subtotal * (1 + APIFY_MARGIN)

    return {
        "num_runs": num_runs,
        "max_jobs": max_jobs,
        "start_costs": start_costs,
        "job_costs": job_costs,
        "subtotal": subtotal,
        "with_margin": with_margin,
        "breakdown": f"{num_runs} runs × $0.001 start = ${start_costs:.4f} + up to {max_jobs} jobs × $0.001 = ${job_costs:.3f} + 20% platform fee"
    }


def print_cost_estimate(estimate: dict):
    """Print a human-readable cost estimate."""
    print("\n--- COST ESTIMATE ---")
    print(f"Runs:      {estimate['num_runs']}")
    print(f"Max jobs:  {estimate['max_jobs']}")
    print(f"Est. cost: ${estimate['with_margin']:.4f} (max)")
    print(f"Breakdown: {estimate['breakdown']}")
    print("---")


def run_actor(token: str, input_data: dict) -> dict:
    """Start an Apify actor run and wait for results."""
    # Start run
    resp = requests.post(
        f"{BASE_URL}/acts/{ACTOR_ID}/runs",
        json=input_data,
        headers={"Authorization": f"Bearer {token}"},
    )
    resp.raise_for_status()
    run_data = resp.json()["data"]
    run_id = run_data["id"]
    dataset_id = run_data["defaultDatasetId"]

    print(f"  Run started: {run_id}")

    # Poll for completion
    for _ in range(120):  # max 10 min
        time.sleep(5)
        status_resp = requests.get(
            f"{BASE_URL}/actor-runs/{run_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        status_resp.raise_for_status()
        status = status_resp.json()["data"]["status"]

        if status == "SUCCEEDED":
            usage = status_resp.json()["data"].get("usageTotalUsd", 0)
            print(f"  Completed. Cost: ${usage:.4f}")
            break
        elif status in ("FAILED", "ABORTED", "TIMED-OUT"):
            print(f"  ERROR: Run {status}")
            return {"items": [], "usage": 0, "status": status}
        # still running
    else:
        print("  WARNING: Timed out waiting for results")
        return {"items": [], "usage": 0, "status": "TIMEOUT"}

    # Fetch results
    items_resp = requests.get(
        f"{BASE_URL}/datasets/{dataset_id}/items",
        params={"format": "json"},
        headers={"Authorization": f"Bearer {token}"},
    )
    items_resp.raise_for_status()
    items = items_resp.json()

    return {"items": items, "usage": usage, "status": "SUCCEEDED"}


def search_jobs(
    token: str,
    titles: List[str],
    locations: List[str],
    max_per_title: int = 25,
    posted_limit: str = "week",
    employment_types: Optional[List[str]] = None,
) -> List[dict]:
    """Search LinkedIn Jobs for each title/location combo."""
    all_jobs = []
    total_cost = 0.0

    for title in titles:
        print(f"\nSearching: '{title}'")

        input_data = {
            "jobTitles": [title],
            "maxItems": max_per_title,
            "postedLimit": posted_limit,
            "sortBy": "date",
        }

        if locations:
            input_data["locations"] = locations

        if employment_types:
            input_data["employmentType"] = employment_types

        result = run_actor(token, input_data)
        total_cost += result["usage"]

        for job in result["items"]:
            job["_search_title"] = title
            all_jobs.append(job)

        print(f"  Found {len(result['items'])} jobs")

    print(f"\nTotal jobs fetched: {len(all_jobs)}")
    print(f"Total cost: ${total_cost:.4f}")

    return all_jobs


def group_by_company(jobs: List[dict]) -> Dict[str, dict]:
    """Group jobs by company, dedup, and count signals."""
    companies = {}

    for job in jobs:
        company = job.get("company", {})
        company_name = company.get("name", "Unknown")

        if company_name == "Unknown" or not company_name:
            continue

        key = company_name.lower().strip()

        if key not in companies:
            companies[key] = {
                "company_name": company_name,
                "company_linkedin": company.get("linkedinUrl", ""),
                "company_website": company.get("website", ""),
                "company_description": company.get("description", ""),
                "employee_count": company.get("employeeCount"),
                "employee_range": company.get("employeeCountRange", {}),
                "industries": [i.get("name", "") for i in company.get("industries", [])],
                "locations": company.get("locations", []),
                "specialities": company.get("specialities", []),
                "postings": [],
            }

        companies[key]["postings"].append({
            "title": job.get("title", ""),
            "url": job.get("linkedinUrl", ""),
            "description_text": job.get("descriptionText", "")[:500],
            "description_full": job.get("descriptionText", ""),
            "posted_date": job.get("postedDate", ""),
            "location": job.get("location", {}).get("linkedinText", ""),
            "employment_type": job.get("employmentType", ""),
            "workplace_type": job.get("workplaceType", ""),
            "applicants": job.get("applicants", 0),
            "search_title": job.get("_search_title", ""),
            "hiring_team": job.get("hiringTeam", []),
        })

    return companies


def compute_signal_strength(company_data: dict) -> str:
    """Compute signal strength based on number and seniority of postings."""
    num_postings = len(company_data["postings"])

    # Check for senior-level keywords in titles
    senior_keywords = ["head", "director", "vp", "vice president", "chief", "lead", "senior", "manager", "principal"]
    has_senior = any(
        any(kw in p["title"].lower() for kw in senior_keywords)
        for p in company_data["postings"]
    )

    if num_postings >= 3 or (num_postings >= 2 and has_senior):
        return "HIGH"
    elif num_postings >= 2 or has_senior:
        return "MEDIUM"
    else:
        return "LOW"


def extract_personalization(postings: List[dict]) -> dict:
    """Extract personalization context from job descriptions."""
    all_text = " ".join((p.get("description_full") or "") for p in postings).lower()

    # Detect tech stack mentions
    tech_keywords = [
        "salesforce", "hubspot", "marketo", "pardot", "outreach", "salesloft",
        "gong", "chorus", "zoominfo", "apollo", "clay", "clearbit",
        "segment", "amplitude", "mixpanel", "snowflake", "dbt",
        "python", "sql", "javascript", "react", "node",
        "aws", "gcp", "azure", "kubernetes", "docker",
        "openai", "langchain", "llm", "ai/ml", "machine learning",
    ]
    detected_stack = [kw for kw in tech_keywords if kw in all_text]

    # Detect growth signals
    growth_signals = []
    growth_phrases = {
        "first hire": "First hire in this function - building from scratch",
        "build from scratch": "Building new function/system",
        "scaling": "Scaling existing team/process",
        "growing team": "Team expansion phase",
        "0 to 1": "Zero-to-one stage",
        "ground up": "Building from the ground up",
        "fast-paced": "Fast-paced growth environment",
        "hypergrowth": "Hypergrowth stage",
        "series a": "Series A stage",
        "series b": "Series B stage",
        "series c": "Series C stage",
        "recently funded": "Recently funded",
        "just raised": "Just raised funding",
    }
    for phrase, signal in growth_phrases.items():
        if phrase in all_text:
            growth_signals.append(signal)

    # Detect pain points
    pain_indicators = []
    pain_phrases = {
        "optimize": "Looking to optimize existing processes",
        "automate": "Wants to automate manual work",
        "streamline": "Needs to streamline operations",
        "improve efficiency": "Efficiency is a priority",
        "reduce": "Looking to reduce costs/time",
        "manual": "Has manual processes to fix",
        "bottleneck": "Experiencing bottlenecks",
    }
    for phrase, pain in pain_phrases.items():
        if phrase in all_text:
            pain_indicators.append(pain)

    return {
        "tech_stack": detected_stack,
        "growth_signals": growth_signals,
        "pain_indicators": pain_indicators,
    }


def format_output(companies: Dict[str, dict], format_type: str = "summary") -> str:
    """Format output for display or export."""
    if format_type == "json":
        output = []
        for key, data in sorted(companies.items(), key=lambda x: len(x[1]["postings"]), reverse=True):
            signal = compute_signal_strength(data)
            personalization = extract_personalization(data["postings"])
            output.append({
                "company_name": data["company_name"],
                "company_linkedin": data["company_linkedin"],
                "company_website": data["company_website"],
                "employee_count": data["employee_count"],
                "industries": data["industries"],
                "num_relevant_postings": len(data["postings"]),
                "signal_strength": signal,
                "postings": [
                    {
                        "title": p["title"],
                        "url": p["url"],
                        "location": p["location"],
                        "posted_date": p["posted_date"],
                        "description_summary": p["description_text"],
                        "search_title": p["search_title"],
                    }
                    for p in data["postings"]
                ],
                "personalization": personalization,
                "company_description": (data["company_description"] or "")[:300],
            })
        return json.dumps(output, indent=2)

    # Summary format
    lines = []
    sorted_companies = sorted(companies.items(), key=lambda x: len(x[1]["postings"]), reverse=True)

    lines.append(f"\n{'='*80}")
    lines.append(f"SIGNAL DETECTION: Job Posting Intent")
    lines.append(f"Found {len(sorted_companies)} companies with relevant job postings")
    lines.append(f"{'='*80}\n")

    for i, (key, data) in enumerate(sorted_companies, 1):
        signal = compute_signal_strength(data)
        personalization = extract_personalization(data["postings"])

        lines.append(f"--- #{i} [{signal}] {data['company_name']} ---")
        lines.append(f"  LinkedIn: {data['company_linkedin']}")
        lines.append(f"  Website:  {data['company_website']}")
        lines.append(f"  Size:     {data['employee_count']} employees")
        lines.append(f"  Industry: {', '.join(data['industries'])}")
        lines.append(f"  Postings: {len(data['postings'])} relevant roles")

        for p in data["postings"]:
            lines.append(f"    - {p['title']} ({p['location']})")
            lines.append(f"      URL: {p['url']}")
            lines.append(f"      Posted: {p['posted_date'][:10] if p['posted_date'] else 'unknown'}")

        if personalization["tech_stack"]:
            lines.append(f"  Tech Stack: {', '.join(personalization['tech_stack'][:8])}")
        if personalization["growth_signals"]:
            lines.append(f"  Growth: {'; '.join(personalization['growth_signals'][:3])}")
        if personalization["pain_indicators"]:
            lines.append(f"  Pain Points: {'; '.join(personalization['pain_indicators'][:3])}")

        lines.append("")

    return "\n".join(lines)


def qualify_and_build_rows(companies: Dict[str, dict], relevance_keywords: Optional[List[str]] = None) -> List[list]:
    """
    Qualify companies against ICP and build spreadsheet rows.

    If relevance_keywords is provided, only postings whose title contains
    at least one keyword are kept. Otherwise all postings are kept.
    """
    qualified = []

    for key, data in companies.items():
        if relevance_keywords:
            relevant = [
                p for p in data["postings"]
                if any(kw in p["title"].lower() for kw in relevance_keywords)
            ]
        else:
            relevant = data["postings"]

        if not relevant:
            continue

        data["relevant_postings"] = relevant
        data["num_truly_relevant"] = len(relevant)
        qualified.append(data)

    # Sort: most relevant postings first, then smallest company
    qualified.sort(key=lambda x: (-x["num_truly_relevant"], x.get("employee_count") or 9999))

    rows = []
    for c in qualified:
        n = c["num_truly_relevant"]
        signal = compute_signal_strength(c)
        personalization = extract_personalization(c["relevant_postings"])

        # Determine suggested decision-maker
        titles = [p["title"] for p in c["relevant_postings"]]
        emp = c.get("employee_count") or 0
        if any("sdr" in t.lower() or "bdr" in t.lower() or "sales" in t.lower() for t in titles):
            dm = "VP Sales / Head of Growth"
        elif any("growth" in t.lower() or "demand" in t.lower() or "marketing" in t.lower() for t in titles):
            dm = "VP Marketing / CMO" if emp > 80 else "CEO / Founder"
        elif any("gtm" in t.lower() or "revops" in t.lower() for t in titles):
            dm = "CEO / Head of Revenue" if emp < 80 else "VP Revenue / CRO"
        else:
            dm = "CEO / Head of Growth"

        # Determine outreach angle
        growth = personalization["growth_signals"]
        if any("first hire" in g.lower() or "from scratch" in g.lower() or "ground up" in g.lower() for g in growth):
            angle = "Replace the hire"
        elif n >= 2 or any("scaling" in g.lower() for g in growth):
            angle = "Multiply the hire"
        else:
            angle = "Accelerate while you hire"

        posting_titles = " | ".join(set(p["title"] for p in c["relevant_postings"]))
        posting_url = c["relevant_postings"][0]["url"]
        posting_locations = ", ".join(set(p["location"] for p in c["relevant_postings"] if p["location"]))

        rows.append([
            signal,
            c["company_name"],
            str(emp),
            ", ".join(c.get("industries", [])),
            c.get("company_website", ""),
            c.get("company_linkedin", ""),
            str(n),
            posting_titles,
            posting_url,
            posting_locations,
            dm,
            angle,
            ", ".join(personalization["tech_stack"][:6]),
            "; ".join(growth[:2]),
            "; ".join(personalization["pain_indicators"][:2]),
            (c.get("company_description") or "")[:200],
        ])

    return rows


# ---------------------------------------------------------------------------
# Google Sheets via Rube MCP
# ---------------------------------------------------------------------------

def _mcp_call(method, params=None):
    """Make a JSON-RPC call to Rube MCP (SSE transport)."""
    if not RUBE_TOKEN:
        print("ERROR: RUBE_TOKEN environment variable is not set.")
        print("Set it with: export RUBE_TOKEN='your_jwt_token_here'")
        return None
    global _mcp_session_id
    payload = {
        "jsonrpc": "2.0",
        "id": str(uuid.uuid4()),
        "method": method,
    }
    if params:
        payload["params"] = params

    hdrs = {
        "Authorization": f"Bearer {RUBE_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if _mcp_session_id:
        hdrs["Mcp-Session-Id"] = _mcp_session_id

    resp = requests.post(RUBE_MCP_URL, headers=hdrs, json=payload, timeout=120)
    resp.raise_for_status()

    if "Mcp-Session-Id" in resp.headers:
        _mcp_session_id = resp.headers["Mcp-Session-Id"]

    for line in resp.text.split("\n"):
        if line.startswith("data: "):
            data = json.loads(line[6:])
            if "error" in data:
                print(f"MCP Error: {json.dumps(data['error'], indent=2)}")
                return None
            return data.get("result")

    try:
        return json.loads(resp.text).get("result")
    except Exception:
        return None


def _mcp_tool(name, arguments):
    return _mcp_call("tools/call", {"name": name, "arguments": arguments})


def create_google_sheet(title: str, header: List[str], rows: List[list]) -> Optional[str]:
    """Create a Google Sheet with the results via Rube MCP workbench.

    Returns the sheet URL on success, None on failure.
    """
    all_values = [header] + rows
    all_values_json = json.dumps(all_values)
    last_col = chr(64 + len(header))

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

# Step 3: Format header row
try:
    result3, error3 = run_composio_tool("GOOGLESHEETS_FORMAT_CELL", {{
        "spreadsheet_id": spreadsheet_id,
        "range": "A1:{last_col}1",
        "bold": True,
        "fontSize": 11,
    }})
    if not error3:
        print("Header formatted.")
except Exception as e:
    print(f"Format note: {{e}}")

# Step 4: Resize columns
try:
    widths = [70, 180, 80, 160, 200, 250, 80, 250, 300, 150, 180, 180, 200, 200, 200, 300]
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

    print("\nCreating Google Sheet...")
    result = _mcp_tool("RUBE_REMOTE_WORKBENCH", {
        "code_to_execute": workbench_code,
        "toolkits": ["googlesheets"],
    })

    if not result:
        print("ERROR: Google Sheets workbench returned no result")
        return None

    # Extract output text and sheet URL
    # The MCP response content[].text is a JSON string wrapping the workbench output.
    # The actual stdout is at: JSON.parse(text).data.data.stdout
    output_text = ""
    for item in result.get("content", []):
        raw_text = item.get("text", "")
        try:
            parsed = json.loads(raw_text)
            stdout = parsed.get("data", {}).get("data", {}).get("stdout", "")
            if stdout:
                output_text = stdout
                break
        except (json.JSONDecodeError, AttributeError):
            output_text += raw_text + "\n"

    # Print only meaningful progress lines from workbench stdout
    progress_prefixes = ("Creating", "Created:", "Writing", "Data written", "Header formatted", "Columns resized", "SHEET_URL=", "ERROR", "DEBUG", "Write warning", "Format note", "Resize note")
    for line in output_text.strip().split("\n"):
        stripped = line.strip()
        if any(stripped.startswith(p) for p in progress_prefixes):
            print(f"  {stripped}")

    for line in output_text.split("\n"):
        if line.startswith("SHEET_URL="):
            return line.split("=", 1)[1].strip()

    return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

SHEET_HEADER = [
    "Signal", "Company", "Employees", "Industry",
    "Website", "LinkedIn", "# Postings", "Job Titles",
    "Job URL", "Location", "Decision Maker", "Outreach Angle",
    "Tech Stack", "Growth Signals", "Pain Points", "Description",
]


def main():
    parser = argparse.ArgumentParser(
        description="Search LinkedIn Jobs for buying intent signals",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic search (creates Google Sheet automatically)
  python3 search_jobs.py --titles "GTM Engineer,SDR Manager" --locations "United States"

  # Cost estimate only (no API calls)
  python3 search_jobs.py --titles "GTM Engineer,SDR Manager" --estimate-only

  # Search with more results
  python3 search_jobs.py --titles "AI Engineer,ML Ops" --max-per-title 50

  # Last 24 hours only
  python3 search_jobs.py --titles "Growth Marketing Manager" --posted-limit 24h

  # Skip Google Sheet, just output JSON
  python3 search_jobs.py --titles "GTM Engineer" --no-sheet --json
        """
    )

    parser.add_argument("--titles", required=True, help="Comma-separated job titles to search")
    parser.add_argument("--locations", default="", help="Comma-separated locations (default: no filter)")
    parser.add_argument("--max-per-title", type=int, default=25, help="Max jobs per title (default: 25)")
    parser.add_argument("--posted-limit", default="week", choices=["1h", "24h", "week", "month"], help="How recent (default: week)")
    parser.add_argument("--output", "-o", help="Also save JSON to this file path")
    parser.add_argument("--estimate-only", action="store_true", help="Only show cost estimate, don't run")
    parser.add_argument("--json", action="store_true", help="Print JSON output to console")
    parser.add_argument("--no-sheet", action="store_true", help="Skip Google Sheet creation")
    parser.add_argument("--sheet-name", default="", help="Custom Google Sheet title")
    parser.add_argument("--relevance-keywords", default="", help="Comma-separated keywords to filter relevant postings (e.g. 'gtm,growth,sdr,marketing')")

    args = parser.parse_args()

    titles = [t.strip() for t in args.titles.split(",") if t.strip()]
    locations = [l.strip() for l in args.locations.split(",") if l.strip()]

    if not titles:
        print("ERROR: No job titles provided")
        sys.exit(1)

    # Cost estimate
    estimate = estimate_cost(len(titles), len(locations), args.max_per_title)
    print_cost_estimate(estimate)

    if args.estimate_only:
        sys.exit(0)

    # Run search
    token = get_token()
    jobs = search_jobs(token, titles, locations, args.max_per_title, args.posted_limit)

    if not jobs:
        print("\nNo jobs found. Try broader search terms or longer time window.")
        sys.exit(0)

    # Group by company
    companies = group_by_company(jobs)

    # Qualify and build rows for the sheet
    relevance_kw = None
    if args.relevance_keywords:
        relevance_kw = [k.strip().lower() for k in args.relevance_keywords.split(",") if k.strip()]
    rows = qualify_and_build_rows(companies, relevance_kw)

    print(f"\nQualified leads: {len(rows)} companies")

    # JSON output (to file and/or console)
    if args.json:
        fmt_output = format_output(companies, "json")
        print(fmt_output)
    if args.output:
        fmt_output = format_output(companies, "json")
        Path(args.output).parent.mkdir(parents=True, exist_ok=True)
        Path(args.output).write_text(fmt_output)
        print(f"JSON saved to {args.output}")

    # Google Sheet (default unless --no-sheet)
    if not args.no_sheet and rows:
        today = date.today().isoformat()
        sheet_title = args.sheet_name or f"Job Posting Intent Signals - {today}"
        sheet_url = create_google_sheet(sheet_title, SHEET_HEADER, rows)
        if sheet_url:
            print(f"\nGoogle Sheet: {sheet_url}")
        else:
            print("\nWARNING: Google Sheet creation failed. Results are still available via --output.")
    elif not rows:
        print("\nNo qualified leads found. Try broader search terms.")

    # Print summary to console
    if not args.json:
        print(format_output(companies, "summary"))


if __name__ == "__main__":
    main()
