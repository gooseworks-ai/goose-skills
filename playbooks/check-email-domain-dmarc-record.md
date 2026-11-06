---
slug: check-email-domain-dmarc-record
id: dmarc
kind: leak
outcome: stop
start: true
title: Your email domain isn't authenticated
seo_title: No DMARC record? Check your email domain with Claude
meta_description: >-
  Check whether your sending domain has SPF, DKIM and DMARC, learn what Gmail and Yahoo require from
  bulk senders, and fix what is missing.
hook: No DMARC record means Gmail may be sending your emails to spam. It takes 10 seconds to check.
answer: >-
  Marketing emails can land in spam when the sending domain lacks SPF, DKIM or DMARC, which Gmail
  and Yahoo now expect from bulk senders. Ask Claude to look up your sending domain's public DNS
  records and explain what is missing. No login is needed. Add the missing records with whoever runs
  your domain, starting DMARC at p=none.
tools:
  - dns
ask: >-
  Look up the public DNS records for [your sending domain]. Do I have SPF, DKIM and DMARC set up? Is
  DMARC set to none, quarantine or reject? Explain in plain words what's missing and what Gmail and
  Yahoo now require from bulk senders.
then: Add the missing records with whoever runs your domain. Start DMARC at p=none, then tighten.
steps:
  - >-
    Find the domain your emails actually send from; it may be a subdomain. A public DNS lookup needs
    no login.
  - >-
    Ask Claude to run the prompt with web search or a DNS lookup tool, or paste in DNS records you
    looked up.
  - Confirm you checked the sending subdomain, not just your main domain.
  - Add missing SPF, DKIM or DMARC records with whoever runs your domain, starting DMARC at p=none.
  - Re-check after the change, then quarterly.
example: The sending domain had no DMARC record at all.
check: Check the domain your emails actually send from. It may be a subdomain, not your main one.
cadence: Once, then quarterly
faq:
  - q: What is DMARC and do I need it?
    a: >-
      DMARC is a DNS record that tells inbox providers how to treat mail that fails SPF or DKIM
      checks. Gmail and Yahoo expect bulk senders to have one.
  - q: What DMARC policy should I start with?
    a: >-
      Start with p=none to watch reports without blocking mail. Move to quarantine, then reject,
      once you know all your real senders pass. Moving too fast can block your own mail.
  - q: Can ChatGPT check my DMARC record?
    a: >-
      Yes, if it can look up DNS or browse the web. Any assistant that can read public DNS records,
      or that you paste the records into, can follow this prompt.
  - q: Which domain should I check?
    a: >-
      The one in your emails' from address and sending setup. Email tools often send from a
      subdomain, which needs its own records. Check that subdomain too.
related:
  - klaviyo-flow-stopped-sending
  - email-signup-popup-stopped-working
  - klaviyo-missing-email-flows
updated: "2026-11-06"
---
