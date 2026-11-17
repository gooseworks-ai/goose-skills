---
name: security-auditor
description: >-
  Agentic security auditor that checks every property in a Cloudflare estate
  (servers, web apps, DNS and email domains) against modern security best
  practices, reports prioritized gaps, and applies only non-destructive
  fixes with approval. Destructive changes are always reported, never
  applied automatically.
version: 1.0.0
---

# Security Auditor

An agentic bot that keeps all properties (servers, web apps, DNS/email
domains) aligned with modern security best practices, without ever causing
a destructive outage.

## When to use

Run this skill when the user asks to audit security across their
infrastructure, check for security gaps, or harden their servers, web apps,
or DNS/email configuration.

## Workflow

Run this workflow every time:

### 1. Discover

Build the current property queue from the live Cloudflare account (the
source of truth) plus a curated inventory:

- Enumerate zones, Workers, D1, KV, R2, and email routing via the
  Cloudflare API.
- Merge that with the curated inventory (servers, local repos, domains).
- Deduplicate. Order by criticality: customer-facing product first, then
  marketing sites, then Workers/D1/KV/R2, then servers, then DNS/email.

Secrets (such as a Discord webhook URL for alerts) come from a secret
manager (Bitwarden Secrets Manager or Cloudflare Secrets Store). Never read
config files that may contain plaintext secrets, and never print secret
values.

### 2. Audit

For each property, audit its security posture. Collect a structured finding
per issue with: property, layer (server, web, or dns), category, severity
(critical, high, medium, or low), evidence (measured or observed), and a
concrete remediation. Classify each remediation as either
NON-DESTRUCTIVE (safe to auto-fix) or DESTRUCTIVE (needs a human, reboot,
or downtime).

**Server layer checks:**
- SSH hardening: key-based auth enforced, password auth disabled only when
  key auth is verified working, root login restricted
- Firewall: UFW/iptables rules present, only required ports open
- fail2ban: installed and active
- Unattended-upgrades: configured for security updates
- Kernel and bootloader: up to date (report only, never auto-update)

**Web layer checks:**
- Security headers: HSTS, X-Content-Type-Options, X-Frame-Options,
  Content-Security-Policy
- TLS: valid certificate, modern protocols only (TLS 1.2+), strong cipher
  suites
- Cookies: Secure and HttpOnly flags on session cookies
- Dependency vulnerabilities: npm audit, pip audit, or trivy scan output

**DNS/email layer checks:**
- SPF record present and valid
- DKIM record present and valid
- DMARC record present and policy at least at quarantine
- DNSSEC enabled where supported

### 3. Report

Consolidate all findings, then post a single prioritized summary to the
alert channel (Discord webhook, email, or other configured destination).
Group by severity, mark each fix as AUTO (non-destructive) or MANUAL
(destructive).

### 4. Await approval

End the audit phase. Do NOT auto-fix. Report that non-destructive fixes
are staged and destructive fixes are listed for manual action.

### 5. Fix (approval-gated, non-destructive only)

Only when the run is invoked with explicit approval, apply non-destructive
fixes. Delegate to specialist fix workflows:

- **Server hardening:** SSH/firewall/fail2ban/unattended-upgrades
- **Web security:** headers/TLS/cookies/dependency vulns
- **DNS/email security:** SPF/DKIM/DMARC/DNSSEC

### Hard rules

- Only non-destructive fixes are applied. Anything marked DESTRUCTIVE is
  reported, never applied.
- Every auto-fix runs behind a dry-run or preflight guard and is aborted if
  the tooling reports a removal, downgrade, lockout, or breakage risk.
- Never print secrets (tokens, webhook URLs, SSH keys, env values, found
  credentials). Report the path or location of an exposed secret, never
  its value.
- Secrets come from a secret manager. Never hardcode values.
- Prefer live evidence (curl headers, nmap or nc port checks, dig or host
  DNS, npm or pip or trivy audit output) over assumptions.
- If a property cannot be reached, report it as unreachable rather than
  guessing.
- Never delete files or drop state. Never run a release upgrade. Never
  disable SSH password auth or root login unless key-based auth is already
  verified working.

## Done when

- Every property in the estate has been audited
- Findings are grouped by severity with clear remediation steps
- Non-destructive fixes are staged (or applied if approved)
- Destructive changes are listed for manual action
- A summary report has been posted to the alert channel

## Never

- Apply a destructive fix without explicit human approval
- Print or log secret values
- Guess at security posture without live evidence
- Disable SSH access without verifying key-based auth works first
- Run a kernel, glibc, grub, systemd, or snapd update automatically
