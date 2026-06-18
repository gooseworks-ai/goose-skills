# Pain-Language Engager Sequence

For leads sourced from `pain-language-engagers`. These leads publicly commented on or reacted to posts about a specific pain point. They have the richest signal — use it.

**Available personalization variables:**
- `{first_name}`, `{last_name}`, `{company}`, `{title}`, `{industry}`
- `{comment_snippet}` — their actual comment text (commenters only)
- `{pain_topic}` — the pain theme of the post they engaged with
- `{source_post}` — the post they engaged with
- `{engagement_type}` — "commented" or "reacted"

---

## Step 1: Connection Request (300 chars max)

### Variant A — For Commenters (has comment text)
```
{first_name} — your take on {pain_topic} caught my eye: "{comment_snippet}" We're tackling the same problem. Would be great to connect and swap notes.
```

### Variant B — For Commenters (shorter)
```
Hey {first_name}, loved your comment about {pain_topic}. Working on something related — let's connect.
```

### Variant C — For Reactors (no comment text)
```
{first_name} — saw you following the {pain_topic} conversation on LinkedIn. We're deep in this space too. Would enjoy connecting.
```

**Selection logic:**
- If `{comment_snippet}` exists and is quotable (not just "Great post!") → Variant A or B
- If comment is generic or lead is a reactor → Variant C

---

## Step 2: Follow-up 1 — Value-First (Day 3)

### Variant A — Share an insight
```
Thanks for connecting, {first_name}. Since you're thinking about {pain_topic} — one pattern I keep seeing: companies that solve this by adding headcount hit the same wall at 2x scale. The ones that break through automate the repetitive layer and let their team focus on exceptions.

Curious how {company} is approaching it?
```

### Variant B — Share a resource
```
Appreciate the connection, {first_name}. Given your interest in {pain_topic}, thought you might find this useful — [brief description of resource/article/data point relevant to the pain].

Has {company} been dealing with this?
```

### Variant C — Ask about their situation
```
Thanks for connecting. Your comment about {pain_topic} resonated — we hear the same thing from a lot of {industry} teams.

Quick question: is that still a top priority for {company}, or has it moved down the list?
```

---

## Step 3: Follow-up 2 — Social Proof (Day 7)

### Variant A — Case study reference
```
{first_name}, quick update that might be relevant: we just helped a {industry} company cut their {pain_topic} workload by [X]%. Similar size to {company}, similar setup.

Happy to share what they did differently — no pitch, just the playbook. Worth 15 minutes?
```

### Variant B — Peer comparison
```
Talked to three {title}s this month who all flagged {pain_topic} as their top operational headache. Two of them found a way around it.

Want me to share what's working?
```

---

## Step 4: Follow-up 3 — Breakup (Day 14)

### Variant A — Direct
```
{first_name} — I'll keep it short. If {pain_topic} is still on your radar, I think we can help. If not, no worries at all.

Either way, enjoy the connection.
```

### Variant B — Open door
```
Last note from me on this. If {company} ever wants to revisit {pain_topic}, my door's open. Rooting for you either way.
```

---

## Step 5: InMail — Standalone (Day 7, if connection not accepted)

### Subject (200 chars max)
**Variant A:** `Quick question about {pain_topic} at {company}`
**Variant B:** `Saw your comment on {pain_topic} — relevant to what we do`
**Variant C:** `{pain_topic} — something that might help {company}`

### Body (1,900 chars max)

**Variant A — Comment-based:**
```
Hi {first_name},

I came across your comment about {pain_topic}: "{comment_snippet}"

That resonated because we work with {industry} companies dealing with exactly this. Most are stuck between hiring more people (expensive, slow) and accepting the status quo (leaves money on the table).

We've been helping teams like yours automate the repetitive parts of {pain_topic} so their people can focus on the work that actually needs a human.

A few recent results:
- [Company type] reduced {pain_topic} workload by [X]%
- [Company type] handled [Y]% more volume without adding headcount

Would a 15-minute conversation be worth your time? Happy to share specifics that are relevant to {company}.

Either way, appreciate you sharing your perspective on the topic.

Best,
[Sender name]
```

**Variant B — Reactor-based (no comment text):**
```
Hi {first_name},

Noticed you've been following conversations about {pain_topic} on LinkedIn — seems like it's top of mind for a lot of {industry} leaders right now.

We've been working with companies in your space on this exact challenge. The common thread: teams are spending too much time on the manual, repetitive parts of {pain_topic} and not enough on the strategic work.

A few things that have worked for similar companies:
- [Specific approach/result 1]
- [Specific approach/result 2]

If this is relevant to what {company} is working through, I'd welcome a quick conversation. If not, no worries — happy to just be a resource.

Best,
[Sender name]
```
