#!/usr/bin/env python3
"""
Tech Stack Teardown — Reverse-engineer a company's sales & marketing infrastructure.

Detects CRMs, cold email tools, people databases, ad pixels, email delivery services,
and outbound sending domains from public signals (DNS, website source, Apify profiler,
blacklists, spam complaints).

Usage:
    python3 recon.py --domains "pump.co,dili.ai,runautomat.com"
    python3 recon.py --domains pump.co --no-apify
    python3 recon.py --domains pump.co --json
    python3 recon.py --domains pump.co --output report.md
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone

GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    APIFY_BASE = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    APIFY_BASE = "https://api.apify.com/v2"

# ── Config ──────────────────────────────────────────────────────────────────

DKIM_SELECTORS = [
    "google", "s1", "s2", "selector1", "selector2",
    "k1", "k2", "k3", "smtp", "mail", "default", "dkim",
    "sendgrid", "em", "pm", "mandrill", "mesmtp", "cm", "smtpapi",
]

EMAIL_TOOL_SUBDOMAINS = [
    "email", "tracking", "click", "links", "go", "t", "e", "o",
    "em", "em1", "em2", "em3", "em4", "em5",
    "url", "link", "open", "img", "pixel", "track",
    "bounce", "unsubscribe", "send", "smtp",
    "mail", "mail1", "mail2", "mail3", "newsletter",
    "apollo", "hubspot", "intercom", "sendgrid",
]

BLACKLISTS = [
    "zen.spamhaus.org",
    "b.barracudacentral.org",
    "bl.spamcop.net",
    "dbl.spamhaus.org",
    "multi.surbl.org",
    "black.uribl.com",
]

# Patterns to grep for in website HTML source
SOURCE_PATTERNS = [
    # People databases / visitor tracking
    "apollo", "zoominfo", "clearbit", "6sense", "bombora", "demandbase",
    # CRM / marketing automation
    "hubspot", "hs-script", "hbspt", "hs-analytics", "hsforms",
    "salesforce", "pardot", "marketo",
    # Cold email tools
    "smartlead", "instantly", "outreach", "salesloft", "lemlist",
    "woodpecker", "reply.io", "mixmax", "mailshake",
    # Email delivery
    "sendgrid", "postmark", "mailgun", "mandrill", "amazonses",
    # Analytics
    "segment", "mixpanel", "amplitude", "posthog", "heap",
    "google-analytics", "googletagmanager", "gtag",
    # Ad pixels
    "facebook.*pixel", "fbq", "linkedin.*insight", "px.ads.linkedin",
    "adroll", "d.adroll", "doubleclick", "reddit.*ads", "twitter.*ads",
    # Chat / support
    "intercom", "drift", "crisp", "zendesk", "freshdesk", "chatwoot", "tawk",
    # B2B visitor identification
    "reb2b", "clearbit.*reveal",
]

# SPF include → tool mapping
SPF_MAP = {
    "_spf.google.com": "Google Workspace",
    "spf.protection.outlook.com": "Microsoft 365",
    "sendgrid.net": "SendGrid",
    "amazonses.com": "Amazon SES",
    "hubspotemail.net": "HubSpot",
    "rsgsv.net": "Mailchimp",
    "servers.mcsv.net": "Mailchimp",
    "spf.mandrillapp.com": "Mandrill",
    "mail.zendesk.com": "Zendesk",
    "freshdesk.com": "Freshdesk",
    "spf.mailjet.com": "Mailjet",
    "spf.brevo.com": "Brevo",
    "_spf.salesforce.com": "Salesforce",
    "mktomail.com": "Marketo",
    "postmarkapp.com": "Postmark",
    "mailgun.org": "Mailgun",
}

# DKIM CNAME target → tool mapping
DKIM_MAP = {
    "sendgrid.net": "SendGrid",
    "mcsv.net": "Mailchimp",
    "mandrillapp.com": "Mandrill",
    "postmarkapp.com": "Postmark",
    "mailgun.org": "Mailgun",
}

# TXT record patterns → tool mapping
TXT_PATTERNS = {
    "sleadtrack.com": "Smartlead",
    "hubspot-developer-verification": "HubSpot",
    "anthropic-domain-verification": "Anthropic (Claude)",
    "slack-domain-verification": "Slack",
    "atlassian-domain-verification": "Atlassian",
    "facebook-domain-verification": "Facebook/Meta",
    "docusign": "DocuSign",
    "stripe-verification": "Stripe",
    "MS=": "Microsoft 365",
}


# ── DNS Helpers ─────────────────────────────────────────────────────────────

def dig(record_type, name, timeout=5):
    """Run dig and return lines of output."""
    try:
        result = subprocess.run(
            ["dig", "+short", record_type, name],
            capture_output=True, text=True, timeout=timeout,
        )
        return [l.strip().strip('"') for l in result.stdout.strip().split("\n") if l.strip()]
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return []


def dig_cname(name, timeout=5):
    """Get CNAME for a hostname."""
    try:
        result = subprocess.run(
            ["dig", "+short", "CNAME", name],
            capture_output=True, text=True, timeout=timeout,
        )
        return result.stdout.strip().strip('"') or None
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None


def dig_a(name, timeout=5):
    """Get A records for a hostname."""
    try:
        result = subprocess.run(
            ["dig", "+short", "A", name],
            capture_output=True, text=True, timeout=timeout,
        )
        return [l.strip() for l in result.stdout.strip().split("\n") if l.strip()]
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return []


# ── Scan Functions ──────────────────────────────────────────────────────────

def scan_dns(domain):
    """Layer 1: Full DNS scan."""
    print(f"  [DNS] Scanning {domain}...")
    results = {
        "mx": [],
        "spf": "",
        "spf_includes": [],
        "spf_tools": [],
        "dkim": {},
        "dkim_tools": [],
        "dmarc": "",
        "dmarc_policy": "missing",
        "txt_signals": [],
        "subdomains": {},
        "blacklists": {},
    }

    # MX
    results["mx"] = dig("MX", domain)

    # SPF (from TXT)
    txt_records = dig("TXT", domain)
    for rec in txt_records:
        if "v=spf1" in rec.lower():
            results["spf"] = rec
            # Extract includes
            includes = re.findall(r"include:(\S+)", rec)
            results["spf_includes"] = includes
            for inc in includes:
                for pattern, tool in SPF_MAP.items():
                    if pattern in inc:
                        results["spf_tools"].append({"tool": tool, "evidence": f"SPF include:{inc}"})
        else:
            # Check TXT for tool signals
            for pattern, tool in TXT_PATTERNS.items():
                if pattern.lower() in rec.lower():
                    results["txt_signals"].append({"tool": tool, "evidence": f"TXT record: {rec[:80]}"})

    # DMARC
    dmarc_records = dig("TXT", f"_dmarc.{domain}")
    for rec in dmarc_records:
        if "dmarc" in rec.lower():
            results["dmarc"] = rec
            # Use regex to match p= but not sp= (sp=reject contains p=reject)
            p_match = re.search(r'(?<![s])p=(reject|quarantine|none)', rec.lower())
            if p_match:
                results["dmarc_policy"] = p_match.group(1)
            # Check for Postmark DMARC reporting
            if "postmarkapp.com" in rec:
                results["txt_signals"].append({"tool": "Postmark", "evidence": "DMARC rua -> postmarkapp.com"})
            if "easydmarc" in rec:
                results["txt_signals"].append({"tool": "EasyDMARC", "evidence": "DMARC rua -> easydmarc"})

    # DKIM selectors
    for sel in DKIM_SELECTORS:
        fqdn = f"{sel}._domainkey.{domain}"
        txt = dig("TXT", fqdn)
        cname = dig_cname(fqdn)
        if txt or cname:
            results["dkim"][sel] = {"txt": " ".join(txt)[:100], "cname": cname or ""}
            # Map to tools
            target = (cname or " ".join(txt)).lower()
            for pattern, tool in DKIM_MAP.items():
                if pattern in target:
                    results["dkim_tools"].append({
                        "tool": tool,
                        "evidence": f"DKIM {sel} -> {cname or target[:60]}",
                    })
            if sel == "google" and txt:
                results["dkim_tools"].append({
                    "tool": "Google Workspace",
                    "evidence": f"DKIM google selector active",
                })

    # Subdomains
    for sub in EMAIL_TOOL_SUBDOMAINS:
        fqdn = f"{sub}.{domain}"
        cname = dig_cname(fqdn)
        a_records = dig_a(fqdn) if not cname else []
        if cname or a_records:
            results["subdomains"][sub] = {"cname": cname or "", "a": a_records}

    # Blacklists
    for bl in BLACKLISTS:
        bl_result = dig_a(f"{domain}.{bl}")
        results["blacklists"][bl] = "LISTED" if bl_result else "clean"

    return results


def scan_website_source(domain):
    """Layer 2: Fetch homepage HTML and grep for tool signatures."""
    print(f"  [SRC] Scanning https://www.{domain}...")
    findings = []
    try:
        result = subprocess.run(
            ["curl", "-sL", "--max-time", "15", f"https://www.{domain}"],
            capture_output=True, text=True, timeout=20,
        )
        html = result.stdout
        if not html:
            return findings

        html_lower = html.lower()
        seen = set()

        # Grep for known patterns
        for pattern in SOURCE_PATTERNS:
            if re.search(pattern, html_lower) and pattern not in seen:
                seen.add(pattern)
                findings.append(pattern)

        # Extract specific tool details
        # Apollo tracker
        apollo_match = re.search(r'assets\.apollo\.io.*?tracker', html)
        if apollo_match:
            app_id = re.search(r'appId["\s:=]+["\']?([a-f0-9]+)', html)
            findings.append(f"Apollo.io tracker" + (f" (appId={app_id.group(1)})" if app_id else ""))

        # HubSpot portal ID
        hs_match = re.search(r'js\.hs-scripts\.com/(\d+)', html)
        if hs_match:
            findings.append(f"HubSpot (portal={hs_match.group(1)})")

        # GA4 measurement ID
        ga_match = re.search(r"gtag\(['\"]config['\"],\s*['\"]([A-Z0-9-]+)['\"]", html)
        if ga_match:
            findings.append(f"Google Analytics ({ga_match.group(1)})")

        # Facebook Pixel ID
        fb_match = re.search(r'facebook\.com/tr\?id=(\d+)', html)
        if fb_match:
            findings.append(f"Facebook Pixel (id={fb_match.group(1)})")

        # LinkedIn Insight pid
        li_match = re.search(r'px\.ads\.linkedin\.com.*?pid=(\d+)', html)
        if li_match:
            findings.append(f"LinkedIn Insight Tag (pid={li_match.group(1)})")

    except (subprocess.TimeoutExpired, Exception) as e:
        print(f"    Warning: website source scan failed: {e}")

    return list(set(findings))


def scan_apify_profiler(domains, token):
    """Layer 3: Apify Technology Profiling Engine."""
    print(f"  [APIFY] Profiling {len(domains)} domain(s)...")
    start_urls = [{"url": f"https://www.{d}"} for d in domains]
    payload = {"startUrls": start_urls}

    try:
        import requests
        resp = requests.post(
            f"{APIFY_BASE}/acts/justa~technology-profiling-engine/runs",
            json=payload,
            params={"token": token, "waitForFinish": 300},
            timeout=330,
        )
        if resp.status_code != 201:
            print(f"    Apify error: {resp.status_code} {resp.text[:200]}")
            return {}

        run_data = resp.json()["data"]
        run_id = run_data["id"]
        status = run_data["status"]

        if status != "SUCCEEDED":
            for _ in range(60):
                time.sleep(5)
                check = requests.get(
                    f"{APIFY_BASE}/actor-runs/{run_id}",
                    params={"token": token},
                ).json()
                status = check["data"]["status"]
                if status == "SUCCEEDED":
                    run_data = check["data"]
                    break
                elif status in ("FAILED", "ABORTED", "TIMED-OUT"):
                    print(f"    Apify run {status}")
                    return {}

        dataset_id = run_data["defaultDatasetId"]
        ds_resp = requests.get(
            f"{APIFY_BASE}/datasets/{dataset_id}/items",
            params={"token": token},
        )
        items = ds_resp.json()

        # Group by domain
        results = {}
        for item in items:
            if item.get("status") != "success":
                continue
            url = item.get("url", "")
            # Extract domain from URL
            domain = url.replace("https://www.", "").replace("https://", "").rstrip("/")
            techs = item.get("technologies", [])
            if domain not in results or len(techs) > len(results[domain]):
                results[domain] = techs
        return results

    except Exception as e:
        print(f"    Apify profiler failed: {e}")
        return {}


# ── Report Generation ───────────────────────────────────────────────────────

def generate_report(domain, dns, source_findings, apify_techs):
    """Generate a structured markdown report for a single domain."""

    # Deduplicate and categorize all confirmed tools
    confirmed = {}  # tool_name -> {category, evidence[]}

    def add_tool(name, category, evidence):
        if name not in confirmed:
            confirmed[name] = {"category": category, "evidence": []}
        confirmed[name]["evidence"].append(evidence)

    # DNS-derived tools
    for t in dns["spf_tools"]:
        add_tool(t["tool"], "Email Sending", t["evidence"])
    for t in dns["dkim_tools"]:
        cat = "Email Sending" if t["tool"] in ("Google Workspace", "SendGrid", "Postmark", "Mailgun") else "Email Marketing"
        add_tool(t["tool"], cat, t["evidence"])
    for t in dns["txt_signals"]:
        cat = "Cold Email" if t["tool"] == "Smartlead" else "Other"
        add_tool(t["tool"], cat, t["evidence"])

    # MX-derived
    mx_str = " ".join(dns["mx"]).lower()
    if "google" in mx_str:
        add_tool("Google Workspace", "Primary Email", "MX records -> Google")
    elif "outlook" in mx_str or "microsoft" in mx_str:
        add_tool("Microsoft 365", "Primary Email", "MX records -> Microsoft")

    # Source-derived
    tool_category_map = {
        "apollo": ("Apollo.io", "People Database"),
        "zoominfo": ("ZoomInfo", "People Database"),
        "clearbit": ("Clearbit", "People Database"),
        "6sense": ("6sense", "Intent Data"),
        "bombora": ("Bombora", "Intent Data"),
        "demandbase": ("Demandbase", "Intent Data"),
        "hubspot": ("HubSpot", "CRM / Marketing Automation"),
        "hs-script": ("HubSpot", "CRM / Marketing Automation"),
        "hbspt": ("HubSpot", "CRM / Marketing Automation"),
        "salesforce": ("Salesforce", "CRM"),
        "smartlead": ("Smartlead", "Cold Email"),
        "instantly": ("Instantly", "Cold Email"),
        "outreach": ("Outreach", "Sales Engagement"),
        "salesloft": ("Salesloft", "Sales Engagement"),
        "lemlist": ("Lemlist", "Cold Email"),
        "intercom": ("Intercom", "Chat / Support"),
        "drift": ("Drift", "Chat / Support"),
        "crisp": ("Crisp", "Chat / Support"),
        "zendesk": ("Zendesk", "Support"),
        "segment": ("Segment", "Analytics"),
        "mixpanel": ("Mixpanel", "Analytics"),
        "amplitude": ("Amplitude", "Analytics"),
        "posthog": ("PostHog", "Analytics"),
        "heap": ("Heap", "Analytics"),
        "reb2b": ("REB2B", "B2B Visitor ID"),
        "adroll": ("AdRoll", "Ad Retargeting"),
        "sendgrid": ("SendGrid", "Email Delivery"),
        "postmark": ("Postmark", "Transactional Email"),
    }

    for finding in source_findings:
        finding_lower = finding.lower()
        for pattern, (tool, cat) in tool_category_map.items():
            if pattern in finding_lower:
                add_tool(tool, cat, f"Website source: {finding}")
                break

    # Source findings with details (Apollo tracker, HubSpot portal, etc.)
    for finding in source_findings:
        if "Apollo.io tracker" in finding:
            add_tool("Apollo.io", "People Database + Visitor Tracking", f"Website source: {finding}")
        elif "HubSpot (portal=" in finding:
            add_tool("HubSpot", "CRM / Marketing Automation", f"Website source: {finding}")
        elif "Google Analytics" in finding:
            add_tool("Google Analytics", "Analytics", f"Website source: {finding}")
        elif "Facebook Pixel" in finding:
            add_tool("Facebook Pixel", "Ad Retargeting", f"Website source: {finding}")
        elif "LinkedIn Insight" in finding:
            add_tool("LinkedIn Insight Tag", "B2B Ad Retargeting", f"Website source: {finding}")

    # Apify-derived
    for tech in apify_techs:
        name = tech.get("name", "")
        category = tech.get("category", "")
        score = tech.get("confidence_score", 0)
        add_tool(name, category, f"Apify profiler (confidence: {score}%)")

    # Build report
    lines = []
    lines.append(f"## {domain}\n")

    # Confirmed tools table
    if confirmed:
        lines.append("### Confirmed Tools\n")
        lines.append("| Tool | Category | Evidence |")
        lines.append("|------|----------|---------|")
        for tool_name in sorted(confirmed.keys()):
            info = confirmed[tool_name]
            evidence = "; ".join(info["evidence"][:3])
            lines.append(f"| **{tool_name}** | {info['category']} | {evidence} |")
        lines.append("")

    # Email authentication
    lines.append("### Email Authentication\n")
    lines.append("| Record | Value | Assessment |")
    lines.append("|--------|-------|------------|")

    mx_display = ", ".join(dns["mx"][:3]) if dns["mx"] else "None"
    lines.append(f"| MX | {mx_display} | {'Google Workspace' if 'google' in mx_str else 'Microsoft 365' if 'outlook' in mx_str else 'Other'} |")

    spf_display = dns["spf"][:80] + "..." if len(dns["spf"]) > 80 else dns["spf"]
    spf_assessment = f"{len(dns['spf_includes'])} includes"
    if dns["spf"].endswith("-all"):
        spf_assessment += " (hard fail)"
    elif dns["spf"].endswith("~all"):
        spf_assessment += " (soft fail)"
    lines.append(f"| SPF | `{spf_display}` | {spf_assessment} |")

    dmarc_display = dns["dmarc"][:80] if dns["dmarc"] else "None"
    policy_labels = {"reject": "Strong", "quarantine": "Good", "none": "Weak (monitor only)", "missing": "**Missing**"}
    lines.append(f"| DMARC | `{dmarc_display}` | {policy_labels.get(dns['dmarc_policy'], 'Unknown')} |")
    lines.append("")

    # Blacklist status
    listed = [bl for bl, status in dns["blacklists"].items() if status == "LISTED"]
    if listed:
        lines.append("### Blacklist Status: ISSUES FOUND\n")
        for bl in listed:
            lines.append(f"- **LISTED** on {bl}")
    else:
        lines.append("### Blacklist Status: Clean\n")
        lines.append(f"Clean on all {len(BLACKLISTS)} major blacklists.")
    lines.append("")

    # Active subdomains
    active_subs = {k: v for k, v in dns["subdomains"].items() if v.get("cname") or v.get("a")}
    if active_subs:
        lines.append("### Active Subdomains\n")
        lines.append("| Subdomain | CNAME | A Records |")
        lines.append("|-----------|-------|-----------|")
        for sub, info in sorted(active_subs.items()):
            cname = info.get("cname", "")
            a = ", ".join(info.get("a", [])[:2])
            lines.append(f"| {sub}.{domain} | {cname} | {a} |")
        lines.append("")

    return "\n".join(lines)


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Tech Stack Recon — reverse-engineer company infrastructure")
    parser.add_argument("--domains", required=True, help="Comma-separated list of domains")
    parser.add_argument("--no-apify", action="store_true", help="Skip Apify profiler (free-only mode)")
    parser.add_argument("--json", action="store_true", help="Output as JSON instead of markdown")
    parser.add_argument("--output", "-o", help="Write report to file")
    args = parser.parse_args()

    domains = [d.strip().lower() for d in args.domains.split(",") if d.strip()]
    print(f"\nTech Stack Recon — {len(domains)} domain(s)")
    print("=" * 50)

    # Get Apify token
    apify_token = None
    if not args.no_apify:
        apify_token = GOOSEWORKS_API_KEY or os.environ.get("APIFY_API_TOKEN")
        if not apify_token:
            try:
                from dotenv import load_dotenv
                env_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")
                load_dotenv(env_path)
                apify_token = os.environ.get("APIFY_API_TOKEN")
            except ImportError:
                pass
        if not apify_token:
            print("  Warning: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN. Skipping Apify profiler.")
            print("  Set it in .env or pass --no-apify for free-only mode.")

    # Run DNS + source scans for all domains
    all_dns = {}
    all_source = {}
    for domain in domains:
        print(f"\n[{domain}]")
        all_dns[domain] = scan_dns(domain)
        all_source[domain] = scan_website_source(domain)

    # Run Apify profiler (batch)
    all_apify = {}
    if apify_token and not args.no_apify:
        est_cost = len(domains) * 0.005
        print(f"\n  [APIFY] Estimated cost: ~${est_cost:.3f} for {len(domains)} domain(s)")
        raw_apify = scan_apify_profiler(domains, apify_token)
        all_apify = raw_apify
    else:
        for domain in domains:
            all_apify[domain] = []

    # Generate reports
    if args.json:
        output = {
            domain: {
                "dns": all_dns[domain],
                "source_findings": all_source[domain],
                "apify_technologies": all_apify.get(domain, []),
            }
            for domain in domains
        }
        report_text = json.dumps(output, indent=2, default=str)
    else:
        parts = []
        parts.append(f"# Tech Stack Recon Report\n")
        parts.append(f"**Date:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
        parts.append(f"**Domains:** {', '.join(domains)}")
        parts.append(f"**Method:** DNS (MX, SPF, DKIM, DMARC, TXT, CNAME), website source inspection"
                     + (", Apify Technology Profiling Engine" if apify_token else "")
                     + f", blacklist checks ({len(BLACKLISTS)} lists)")
        parts.append("\n---\n")

        for domain in domains:
            apify_techs = all_apify.get(domain, [])
            parts.append(generate_report(domain, all_dns[domain], all_source[domain], apify_techs))
            parts.append("---\n")

        report_text = "\n".join(parts)

    # Output
    if args.output:
        with open(args.output, "w") as f:
            f.write(report_text)
        print(f"\nReport saved to: {args.output}")
    else:
        print("\n" + report_text)

    print(f"\nDone. Scanned {len(domains)} domain(s).")


if __name__ == "__main__":
    main()
