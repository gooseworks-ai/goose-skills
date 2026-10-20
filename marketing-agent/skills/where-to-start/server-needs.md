# Server needs: where-to-start

Checked against the staging tool list on 2026-10-16. where-to-start needs very little from the server: free reads of what is known, and somewhere to keep the founder's answers.

## 1. A per-brand home for the business situation (goal, deadline, budget, stage, hours, next big date)
- **Need.** Typed per-brand fields for the founder's situation: the one number marketing owns, its target and deadline, the monthly budget (committed vs movable), stage, the founder's weekly hours and who does the work, the next big date, what was tried and how it went. Page 01's section 1 ("The business and its goal") has only a partial home today (onboarding's role, ad-spend band, goals and platforms enums).
- **Step.** 1 (read) and 6 (save).
- **Meanwhile.** Enum-shaped answers go to the brand's onboarding profile (`brand_update patch.onboarding`). Everything else goes to `brand/situation.md` in the brand coworker scope, imported as the brand document `Situation — <Brand> — <date>` (the `save-to-brain` skill (`../save-to-brain/SKILL.md`), `versioned: supersede`), so any playbook finds it with `knowledge_search`. `user_context` is no longer used: it belongs to an agent, not a brand, and writes to it need an agent.

## 2. A record of recommendations made
- **Need.** A per-brand log of first-move recommendations (date, constraint, picks, not-yets, come-back trigger), so a return visit and analyze-performance can see what was advised and whether it happened.
- **Step.** 1 (return visits) and 6.
- **Meanwhile.** Kept in `brand/situation.md` (the latest plus three earlier entries).

## 3. Onboarding profile values that fit non-ads businesses
- **Need.** The onboarding `goals` and `platforms` enums are ads-shaped (make_creatives, analyze_ads, meta, tiktok…). A B2B, services or local business's goals (pipeline, referrals, local footfall) and channels (email, LinkedIn organic, Google Business Profile, marketplaces) have no matching value.
- **Meanwhile.** Only clear matches are saved; the rest lives in the situation note.

## 4. Read pending proposals and the Operating Plan
- **Need.** Read-only access to the Operating Plan (approvers, spend caps) so the recommendation can respect a standing budget or approval rule without asking.
- **Meanwhile.** Asked in question 4 when it matters.

## 5. The opening card conflicts with the confused ask
- **Need.** A way to open a conversation without the Get started card, or a "guide me" tile that leads into this playbook. The server's instructions say to call `get_started` first; on card hosts it shows product tiles (video, image ads, analysis, campaign) or, for a new account, website setup, and tells the agent to end its turn — both skip the diagnosis.
- **Step.** Before you start.
- **Meanwhile (AGENTS §8).** The first call is `get_started` with the founder's words and `wants: "more"`; its answer settles setup and the brand only, any card is kept to one line, and the playbook continues with its diagnosis. A `wants` value for "guide me" would remove the conflict.

## 6. A lean read of what the brand runs
- **Need.** The brand's own ads, offers and the platforms they run on in the lean `brand_read` (today `existingAds` only comes with `detail: "full"`, about 70–140 KB).
- **Step.** 1.
- **Meanwhile.** `ad_library_ad_count` from the brand list, one `knowledge_search` across evidence, learnings, documents and creatives, and a short look at up to three of the brand's own public pages with the host's fetch or browser.
