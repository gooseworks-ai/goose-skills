---
name: company-contact-finder
description: >
  Find decision-makers at a specific company using Fiber, Crustdata and PDL
  people search inside the GooseWorks coworker. Given a company name and target
  titles, returns a list of contacts with name, title, LinkedIn URL, and location.
---

# company-contact-finder

Find decision-makers at a specific company by name and target titles. Uses the GooseWorks coworker's people-search tools (Fiber, Crustdata, PDL) with a layered fallback, so you only pay for the next source when the last one came up short.

## Where this runs

**This skill runs only inside the GooseWorks coworker** (the coworker in the GooseWorks app). The people-search tools it uses exist only there. They are not on the GooseWorks server that Claude, ChatGPT and other outside agents connect to.

If `fiber_person_search`, `crustdata_person_search` and `pdl_person_search` are not in your tool list, you are outside the coworker. Tell the user that this contact search runs only inside the GooseWorks coworker, and stop. Do not try other tools in their place.

## Spend rule

Every search in this skill is paid. **Before each paid search or page, tell the customer what it costs and wait for their yes.**

- Take the price from the tool's own description, for the page size you are about to ask for. Do not quote a price from memory or from this file.
- Ask again before every next page or next source. A yes covers one search, not the whole fallback chain.
- If they say no, stop and show what you have so far.

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| company_name | Yes | -- | The company to search (e.g., "EisnerAmper") |
| company_linkedin_url | No | -- | Company LinkedIn URL for disambiguation |
| target_titles | Yes | -- | List of titles to find (e.g., ["Partner", "Controller", "VP Finance"]) |
| num_results | No | 10 | How many contacts to return |

## Procedure

### Step 1: Understand the Request

Parse the user's request to extract:
- **company_name** (required) -- the company to search at
- **company_linkedin_url** (optional) -- helps disambiguate common names
- **target_titles** (required) -- list of job titles or roles to find (e.g., ["Partner", "Controller", "VP Finance", "CFO"])
- **num_results** (optional, default 10) -- how many contacts to return

If the user does not provide target titles, ask for them. Suggest common senior titles based on context:
- For accounting/CPA firms: Partner, Managing Director, Controller, CFO, VP Finance
- For tech companies: VP Engineering, CTO, Head of Product, Director of Engineering
- For general B2B: VP, Director, C-Level, Head of

### Step 2: Fiber Search (Primary)

Fiber takes a natural-language query and charges per record returned, so ask only for as many records as you need.

Quote the price for this page size and get the customer's yes. Then use `fiber_person_search`:
```
fiber_person_search(
  query: "[title1] OR [title2] OR [title3] at [company_name]",
  page_size: 10
)
```

Set `page_size` to `num_results` (at most 100). For a next page, pass the `cursor` from the previous response, after a new yes.

You can pass structured filters in `search_params` instead of `query` (for example `{"job_titles": ["CFO"], "locations": ["New York"]}`). If you pass both, `query` wins.

**Parse the response:**
Extract name, title, company, LinkedIn URL and location from each result into a working list.

### Step 3: Evaluate Results

Check how many results so far match the target titles at the target company.

**Quality checks:**
1. Filter out results where the company name does not match (fuzzy match is fine -- "EisnerAmper LLP" matches "EisnerAmper")
2. Filter out results where the title does not reasonably match any target title
3. Count remaining high-quality matches

**Decision:**
- If 3+ quality matches found: skip to Step 6 (Output)
- If fewer than 3 quality matches: proceed to Step 4

### Step 4: Crustdata Structured Search (Fallback 1)

Crustdata's filter search matches company and title more precisely. It charges per page, whatever the page size, so set `limit` to the most results you would use (at most 100).

Quote the price for one page and get the customer's yes. Then use `crustdata_person_search`:
```
crustdata_person_search(
  conditions: [
    {"column": "current_employers.name", "type": "=", "value": "[company_name]"},
    {"column": "current_employers.title", "type": "(.)", "value": "[title1]|[title2]|[title3]"}
  ],
  filter_op: "and",
  limit: 25
)
```

`(.)` is a contains / pattern match, so one search can cover several titles joined with `|`. If that finds nothing, run one search per title instead; each is its own paid page, so quote and ask for each. Use `(.)` on the company name too if the exact name finds nothing (e.g. "EisnerAmper LLP").

**Example for Partners and Controllers at EisnerAmper:**
```
crustdata_person_search(
  conditions: [
    {"column": "current_employers.name", "type": "=", "value": "EisnerAmper"},
    {"column": "current_employers.title", "type": "(.)", "value": "Partner|Controller"}
  ],
  filter_op: "and",
  limit: 25
)
```

**Senior leaders broadly:** if the user wants senior decision-makers rather than specific titles, match on the title instead of a seniority field:
```
{"column": "current_employers.title", "type": "(.)", "value": "Chief|VP|Vice President|Director|Head of|Partner"}
```

For a next page, pass the `cursor` from the previous response, after a new yes.

**After results return:**
1. Merge with all previous results
2. Deduplicate by LinkedIn URL (keep the first occurrence)

**Decision:**
- If 3+ total unique quality matches: skip to Step 6 (Output)
- If still fewer than 3: proceed to Step 5

### Step 5: PDL Search (Fallback 2, last resort)

PeopleDataLabs costs the most per record of the three. Use it only when the other sources came up short, and ask for only the records still missing.

Quote the price for this number of records and get the customer's yes. Then use `pdl_person_search`:
```
pdl_person_search(
  job_titles: ["Partner", "Controller", "VP Finance"],
  company_names: ["EisnerAmper"],
  num_results: 5
)
```

`num_results` defaults to 1 and is at most 25. Use structured fields; `query` is only a fallback when they cannot express the search.

**After results return:**
1. Parse results (extract name, title, company, LinkedIn URL, location)
2. Merge with all previous results
3. Deduplicate by LinkedIn URL

### Step 6: Output

Present the final deduplicated contact list.

**Table format (for the user):**

| # | Name | Title | Company | LinkedIn URL | Location |
|---|------|-------|---------|--------------|----------|
| 1 | Jane Smith | Partner | EisnerAmper | https://linkedin.com/in/janesmith | New York, NY |
| 2 | John Doe | Controller | EisnerAmper | https://linkedin.com/in/johndoe | Chicago, IL |
| ... | | | | | |

**JSON format (for downstream skills):**

```json
{
  "company": "EisnerAmper",
  "search_titles": ["Partner", "Controller", "VP Finance"],
  "contacts": [
    {
      "name": "Jane Smith",
      "title": "Partner",
      "company": "EisnerAmper",
      "linkedin_url": "https://linkedin.com/in/janesmith",
      "location": "New York, NY"
    }
  ],
  "total_found": 10,
  "sources": ["fiber", "crustdata", "pdl"]
}
```

**Summary line:**
> Found X contacts matching [titles] at [company]. Sources used: [list of sources that returned results].

If fewer than 3 contacts were found after all fallbacks, tell the user:
> Only found X contacts. The company may be small, the titles may be uncommon, or the databases may have limited coverage for this company. Consider broadening the target titles or trying alternate company name spellings.

---

## People-search tools reference

All three are on the GooseWorks coworker only, and all are paid. Each tool's description states its price; quote it before every search.

| Tool | Purpose | How it charges | Arguments |
|------|---------|----------------|-----------|
| `fiber_person_search` | Natural-language or structured people search | Per record returned | `query` (natural language), `search_params` (structured), `page_size` (1-100, default 25), `cursor` |
| `crustdata_person_search` | Structured filter search | Per page, whatever the `limit` | `conditions` (list of `column` / `type` / `value`), `filter_op` (`and` or `or`), `limit` (1-100, default 25), `cursor` |
| `pdl_person_search` | Premium people search, last resort | Per record returned | `job_titles`, `company_names`, `job_title_levels`, `job_title_role`, `location_country`, `location_region`, `location_locality`, `num_results` (1-25, default 1), `query` (fallback) |

Apollo people search is deprecated in GooseWorks: it hides surnames, so it cannot be used for outreach. Do not use it.

### Crustdata Filter Columns

| Column | Types | Example Values |
|--------|-------|----------------|
| `current_employers.name` | `=` (exact), `(.)` (contains) | `"EisnerAmper"` |
| `current_employers.title` | `(.)` (contains / pattern), `=` (exact) | `"Partner"`, `"CFO\|Controller"` |
| `region` | `=` | `"San Francisco"` |
| `country` | `=` | `"United States"` |
| `skills` | `(.)` | `"python"` |
| `years_of_experience` | `>`, `<`, `between` (`"min,max"`) | `"8"` |
| `headline` | `(.)` | `"fractional CFO"` |

---

## Examples

### Basic: Find Partners and Controllers at EisnerAmper
```
Find Partners and Controllers at EisnerAmper
```
Agent quotes the Fiber price for 10 records, gets a yes, then runs the Fiber search (Step 2) with `query: "Partner OR Controller at EisnerAmper", page_size: 10`.

### With more titles: Find VP Finance and CFO at Sage Intacct users
```
Find VP Finance and CFO at companies using Sage Intacct
```
Agent builds the Fiber query `"VP Finance OR CFO at companies using Sage Intacct"`.

### Senior leaders at a specific kind of firm
```
Find Managing Directors at CPA firms in San Francisco
```
Agent builds the Fiber query `"Managing Director at CPA firm San Francisco"`.

### With a LinkedIn URL for disambiguation
```
Find Partners at EisnerAmper (https://linkedin.com/company/eisneramper)
```
Agent searches by the company name "EisnerAmper" and uses the LinkedIn URL to tell it apart from similar names when checking results.

---

## Troubleshooting

### People-search tools not available

You are outside the GooseWorks coworker. Tell the user this contact search runs only inside the GooseWorks coworker, and stop (see "Where this runs").

### No results returned

- Try alternate spellings of the company name (e.g., "EisnerAmper" vs "Eisner Amper" vs "EisnerAmper LLP"), or `(.)` instead of `=` on the Crustdata company column
- Broaden target titles (e.g., add "Managing Director" alongside "Partner")
- Move to the next source (Steps 4-5), after the customer's yes to its price

### Too many irrelevant results

- Add more specific title terms rather than broad ones
- In Crustdata, use `=` for an exact title match instead of `(.)`
- Add a `region` or `country` condition

### Duplicate contacts across sources

The skill deduplicates by LinkedIn URL. If you see near-duplicates with slightly different URLs (e.g., trailing slashes), normalize URLs before deduplication by stripping trailing slashes and query parameters.

---

## Metadata

```yaml
metadata:
  requires:
    mcp_servers: ["gooseworks"]
    runs_in: "GooseWorks coworker only"
  cost: "Paid per search; quote the price the tool states and get the customer's yes first"
```
