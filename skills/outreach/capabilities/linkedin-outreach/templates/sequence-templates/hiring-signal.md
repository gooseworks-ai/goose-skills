# Hiring Signal Sequence

For leads sourced from `job-posting-intent`. These leads are hiring for roles that indicate a need your product solves — the job posting itself is the signal. High intent: they're actively investing in solving the problem with headcount.

**Strategy:** The hiring signal is gold. They've already decided to invest in solving this problem — the question is whether adding a tool is better/faster/cheaper than adding a person. Lead with that angle.

**Available personalization variables:**
- `{first_name}`, `{last_name}`, `{company}`, `{title}`, `{industry}`
- `{role_hiring_for}` — the job title they're hiring for (e.g., "Dispatcher", "SDR Manager")
- `{job_posting_detail}` — a specific detail from the job posting (e.g., a responsibility or requirement)
- `{job_posting_url}` — link to the job posting (if available)

---

## Step 1: Connection Request (300 chars max)

### Variant A — Direct hiring reference
```
{first_name} — noticed {company} is hiring a {role_hiring_for}. We help {industry} teams solve that same problem without the headcount. Might be complementary. Let's connect.
```

### Variant B — Softer approach
```
Hey {first_name}, saw {company} is growing the team. Hiring for {role_hiring_for} is a sign of an interesting challenge. We're in the same space. Let's connect.
```

### Variant C — Curiosity-driven
```
{first_name} — saw the {role_hiring_for} listing at {company}. Curious if you've also looked at the tool-based approach. Let's connect either way.
```

---

## Step 2: Follow-up 1 — The Headcount vs. Tool Angle (Day 3)

### Variant A — Cost comparison
```
Thanks for connecting, {first_name}. About that {role_hiring_for} hire — I'm not saying don't hire them. But one thing worth considering:

A {role_hiring_for} costs ~$[X]K/yr fully loaded. The specific tasks in that job description — like {job_posting_detail} — can often be handled by a tool at a fraction of that cost, freeing the hire to focus on higher-value work.

Is that something you've explored, or is headcount the preferred approach?
```

### Variant B — Augmentation framing
```
Appreciate the connection. Saw the {role_hiring_for} posting — the bit about {job_posting_detail} stood out.

We work with {industry} companies that use our tool to handle that exact workload. Not instead of hiring, but to make each hire 3-4x more effective.

Curious if {company}'s open to that model, or if you're set on headcount?
```

### Variant C — Timeline angle
```
Thanks for connecting, {first_name}. Here's what I've seen: hiring for a {role_hiring_for} takes 60-90 days on average. Then 30-60 days to ramp.

A tool that handles {job_posting_detail} can be live in a week. Some teams use it to bridge the gap while they hire. Others realize they don't need the hire at all.

Worth exploring for {company}?
```

---

## Step 3: Follow-up 2 — Social Proof (Day 7)

### Variant A — Same-situation case study
```
{first_name}, quick story: a {industry} company was about to hire two {role_hiring_for}s. They tried our tool instead for 30 days. Ended up hiring one instead of two and handling 40% more volume.

If {company}'s in a similar spot, the math might work. Happy to walk through it — takes 15 minutes.
```

### Variant B — ROI framing
```
Quick math for you: if {company} hires a {role_hiring_for} at market rate, that's ~$[X]K/yr. Our tool handles the {job_posting_detail} portion of that role for ~$[Y]K/yr.

Not a replacement — an accelerant. The hire focuses on judgment calls, the tool handles the repetitive work.

Want to see how it maps to {company}'s setup?
```

---

## Step 4: Follow-up 3 — Breakup (Day 14)

### Variant A
```
{first_name} — hope the {role_hiring_for} search is going well. If you ever want to explore the tool-augmented approach, I'm here. Good luck either way.
```

### Variant B
```
Last thought: even if you fill the {role_hiring_for} role, the tool angle might still make sense for scaling. But that's a future conversation. Enjoy the connection.
```

---

## Step 5: InMail — Standalone (Day 7, if connection not accepted)

### Subject (200 chars max)
**Variant A:** `About the {role_hiring_for} role at {company}`
**Variant B:** `{company} is hiring a {role_hiring_for} — here's an alternative angle`
**Variant C:** `What if {company} didn't need to hire a {role_hiring_for}?`

### Body (1,900 chars max)

**Variant A:**
```
Hi {first_name},

I noticed {company} is hiring for a {role_hiring_for}. The job description — especially the part about {job_posting_detail} — caught my eye because that's exactly what our tool handles.

I'm not suggesting you cancel the hire. But I've seen this pattern with {industry} companies:

1. They hire for a role that's 60% repetitive work, 40% judgment calls
2. The hire spends most of their time on the repetitive stuff
3. They get bored or overwhelmed, and turnover follows

The alternative: automate the repetitive 60% and hire someone who spends 100% of their time on the high-value 40%. You get more done with one great hire + a tool than with two average hires.

Results from companies in your space:
- [Company type] handles [X]% more volume with same headcount
- [Company type] reduced time-to-fill by [Y] days by automating the interim workload

Worth a 15-minute conversation to see if the math works for {company}?

Best,
[Sender name]
```

**Variant B — Shorter:**
```
Hi {first_name},

Quick note about the {role_hiring_for} position at {company}.

We help {industry} teams automate the work that role is designed to handle — specifically tasks like {job_posting_detail}. A few of our customers started as companies hiring for that exact role, explored the tool-first approach, and ended up saving $[X]K/yr while getting more done.

Not the right fit for every company, but if {company} is open to exploring it, I can share exactly how it works in 15 minutes.

Interested?

Best,
[Sender name]
```
