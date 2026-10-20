---
name: research-audience-account-sourcing
description: >-
  Step of the research-audience playbook: finds candidate accounts matching the fit definition,
  confirms gates, applies exclusions and dedupes. Run research-audience instead; not for direct use.
version: 0.1.0
---

# account-sourcing

**Reads:** the draft definition (or the corrected one on a re-run); exclusions; the source(s) picked from `../research-audience/references/list-sources.md`; `../research-audience/references/data-sources.md`; `../research-audience/references/list-by-company-type.md`; lists the human supplied (exhibitor lists, directories, target-account lists, customer lists for lookalikes).

**Does:**
0. **Search, don't remember.** Every candidate comes from a search or page this run read, recorded in `source` with the query and date (e.g. "Meta Ad Library, keyword '<category term>', 20 Oct"). Never seed the list with brands the model knows as well known: they are the least likely to buy a small tool and the most contacted. Selling to marketers: an ad-library keyword or category search — in the browser page by page as a person would, never paged by script; at volume through the paid ad-library reads inside the approved top-up.
1. Start from the picked source (switch-intent posts, hiring posts, rivals' customers, event speakers and sponsors, developer clusters, ad libraries, directories — `../research-audience/references/list-sources.md`), which gives accounts that already carry a signal. Then the other free sources before any paid read: human-supplied lists if any; the host's web search with queries built from the definition (industry terms, geography, situation words, `site:` filters for directories, association member lists, "top <category> <city>" roundups, conference exhibitor and sponsor pages, job boards); company sites and LinkedIn public company pages read in the host browser for firmographics; rivals' public customer and case-study pages; ad libraries in the browser when "spends on ads" is part of fit. Paid bulk reads only in the top-up the human approves.
2. Retail lists: comparable brands' stockist and store-locator pages are the best source of shops that carry similar products; wholesale marketplaces' public brand pages too.
3. Evidence-first when a technology or situation is a hard gate: search for the evidence (job posts or integration pages naming the tool, press about the situation) and take the companies from it, instead of screening an industry and failing most of it.
4. Lookalikes: when the brain holds known customers, describe what they share and search for that shape — never list a customer.
5. For each candidate, confirm the hard gates with a dated source (size, industry, geography, required tech or situation). Unconfirmable gate = dropped with reason "could not confirm <gate>".
6. Apply exclusions and dedupe on root domain, parent company and brand variants ("Acme Inc" vs "Acme Labs"; regional ccTLDs; acquired brands on old domains). Subsidiary of an excluded parent = excluded.
7. Database route (when the connector has it, inside the approved ceiling): one broad company or people search for the definition, count and sample first (`../research-audience/references/data-sources.md` § When the contact routes exist). In a paid top-up only: keep a running sum of credits charged and stop before the next lookup could pass the ceiling.
8. Note the rough universe size seen ("~140 accounts match in US/CA") — it tells the human whether the definition is too narrow or too broad.

**Writes:** account table — `account_id, company, domain, parent, employees (+source, date), industry, hq, gate evidence, source` — and the dropped accounts with reasons.

**Rules:** accounts before people, always: no spend on people at an account that has not passed the gates. Never treat a search snippet as a confirmed fact without its page or date.
