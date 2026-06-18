# Database Search Sequence (Lean Signal)

For leads sourced from database searches (e.g., Apollo, CSV imports, CRM exports). These leads match the ICP by firmographic and demographic criteria but have no engagement signal. You know their title, company, and industry — that's it.

**Strategy:** Since there's no behavioral signal, lead with relevance to their role and industry. Do the research to make it feel personal even with lean data.

**Available personalization variables:**
- `{first_name}`, `{last_name}`, `{company}`, `{title}`, `{industry}`
- `{location}` — their location
- `{company_size}` — company headcount range
- `{qualification_score}` — their ICP score (if qualified)

---

## Step 1: Connection Request (300 chars max)

### Variant A — Role-based relevance
```
{first_name} — connecting with {title}s in {industry} who are thinking about [problem area]. We work with similar companies. Would enjoy connecting.
```

### Variant B — Company-specific
```
Hey {first_name}, been following what {company} is doing in {industry}. We help similar teams with [specific challenge]. Let's connect.
```

### Variant C — Peer network
```
{first_name} — I work with a lot of {title}s in {industry}. One topic that keeps coming up: [problem area]. Would be great to get your perspective. Let's connect.
```

**Guidance:** With lean signal, the connection request needs to work harder. Research the company briefly before generating — check their LinkedIn page, recent news, or job postings for something specific to reference.

---

## Step 2: Follow-up 1 — Value-First (Day 3)

### Variant A — Industry insight
```
Thanks for connecting, {first_name}. One thing I keep hearing from {title}s at {company_size}-person {industry} companies: [common pain point for this segment].

Is that on your radar at {company}, or is something else eating up more of your time?
```

### Variant B — Question-led
```
Appreciate the connection. Quick question for you — as a {title} at {company}, what's your biggest operational bottleneck right now?

I ask because we work with a lot of {industry} teams and the answers usually cluster around 2-3 themes. Curious where {company} falls.
```

### Variant C — Trend reference
```
Thanks for connecting, {first_name}. I've been digging into how {industry} companies are handling [relevant trend] this year.

The split is interesting: about 60% are still doing it the old way, 40% have found a shortcut. Curious which camp {company} is in?
```

---

## Step 3: Follow-up 2 — Social Proof (Day 7)

### Variant A — Case study
```
{first_name}, quick one: a {industry} company about {company}'s size just solved their [problem area] challenge. Went from [before state] to [after state] in [timeframe].

The approach was surprisingly simple. Happy to share — 15 minutes, no strings.
```

### Variant B — Peer benchmarking
```
I just compiled data from {N} {industry} companies on how they handle [problem area]. The results were eye-opening — especially for teams at {company}'s stage.

Want me to send you the highlights?
```

---

## Step 4: Follow-up 3 — Breakup (Day 14)

### Variant A
```
{first_name} — I'll stop here. If [problem area] ever becomes a priority, I'm a good person to have in your network. No pressure either way.
```

### Variant B
```
Last note from me. If the timing isn't right, totally get it. When [problem area] comes back around for {company}, let's talk then.
```

---

## Step 5: InMail — Standalone (Day 7, if connection not accepted)

### Subject (200 chars max)
**Variant A:** `{title}s in {industry} keep asking about this`
**Variant B:** `Quick question for the {company} team`
**Variant C:** `{first_name} — relevant to what {company} is building`

### Body (1,900 chars max)

**Variant A — Role relevance:**
```
Hi {first_name},

I'm reaching out because we work with a lot of {title}s in {industry}, and there's a pattern I thought you'd find interesting.

Most {company_size}-person companies in your space hit a specific bottleneck around [problem area] as they scale. The teams that solve it early tend to grow faster and with less pain. The ones that don't end up throwing bodies at the problem.

We've helped {N}+ {industry} companies navigate this, including:
- [Company type] that reduced [metric] by [X]%
- [Company type] that scaled from [Y] to [Z] without adding headcount in [department]

I don't know if this is on {company}'s radar right now, but if it is, a 15-minute conversation could be valuable. If it's not, happy to just stay connected for when it does come up.

Worth a quick chat?

Best,
[Sender name]
```

**Variant B — Shorter, curiosity-driven:**
```
Hi {first_name},

Two quick questions:
1. Is [problem area] a current priority at {company}?
2. If so, have you started evaluating solutions, or still figuring out the approach?

I ask because we've helped {N} {industry} companies with exactly this, and I can usually tell within 5 minutes whether our approach would be relevant.

If it's not a priority, no worries — I appreciate you reading this far.

Best,
[Sender name]
```
