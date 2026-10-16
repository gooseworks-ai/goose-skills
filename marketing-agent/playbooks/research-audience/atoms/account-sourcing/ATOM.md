---
name: account-sourcing
description: Hidden atom of research-audience. Finds candidate accounts that match the fit definition from public sources, applies gates and exclusions before any spend on people, dedupes, and writes the account table with dated evidence.
---

# account-sourcing

**Reads:** the approved definition; exclusions; `references/data-sources.md`; `references/list-by-company-type.md`; lists the human supplied (exhibitor lists, directories, target-account lists, customer lists for lookalikes).

**Does:**
1. Choose sources that fit the list unit: web search queries built from the definition (industry terms, geography, situation words, `site:` filters for directories and job boards); ad libraries when "spends on ads" is part of fit; company pages for firmographics; human-supplied lists first when they exist (cheapest and best).
2. Retail lists: comparable brands' stockist and store-locator pages are the best source of shops that carry similar products; wholesale marketplaces' public brand pages too.
3. Evidence-first when a technology or situation is a hard gate: search for the evidence (job posts or integration pages naming the tool, press about the situation) and take the companies from it, instead of screening an industry and failing most of it.
4. Lookalikes: when the brain holds known customers, describe what they share and search for that shape — never list a customer.
5. For each candidate, confirm the hard gates with a dated source (size, industry, geography, required tech or situation). Unconfirmable gate = dropped with reason "could not confirm <gate>".
6. Apply exclusions and dedupe on root domain, parent company and brand variants ("Acme Inc" vs "Acme Labs"; regional ccTLDs; acquired brands on old domains). Subsidiary of an excluded parent = excluded.
7. Keep a running sum of credits charged; stop and ask before the next lookup could pass the ceiling.
8. Note the rough universe size seen ("~140 accounts match in US/CA") — it tells the human whether the definition is too narrow or too broad.

**Writes:** account table — `account_id, company, domain, parent, employees (+source, date), industry, hq, gate evidence, source` — and the dropped accounts with reasons.

**Rules:** accounts before people, always: no spend on people at an account that has not passed the gates. Never treat a search snippet as a confirmed fact without its page or date.
