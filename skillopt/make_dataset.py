#!/usr/bin/env python3
"""
Build the meta-ads-analyzer optimization dataset (mix synthetic + real).

- TRAIN/VAL: synthetic scenarios with KNOWN traps, each with a scenario-specific
  rubric (the optimizer learns the skill against these).
- TEST: the real account snapshot captured via ../test/capture-fixture.js
  (held out — never seen during optimization).

Each item: { id, task_type, prompt, csv, rubric }.

Usage: python skillopt/make_dataset.py
"""
import json
import os
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data" / "meta_ads_analyzer"
REAL_CSV = HERE.parent / "skills/ads/composites/meta-ads-analyzer/eval/fixtures/campaign-export.csv"

# Methodology every scenario must satisfy (appended to each rubric).
CORE = (
    "Always also require: correct evaluation level stated with reasoning; recommendations framed as "
    "testable hypotheses with expected impact + rollback (never naive average-metric pauses); the "
    "mandated report structure; honesty about missing/low-volume data instead of guessing."
)

SCENARIOS = {
    "train": [
        {
            "id": "syn-cbo-purchase-breakdown",
            "task_type": "purchase_cbo",
            "prompt": "Analyze my Meta Ads campaign. Export below. CPA target $30. What to scale, fix, and NOT touch?",
            "csv": (
                "Campaign name,Ad set name,Delivery status,Budget type,Amount spent,Impressions,Frequency,Clicks (all),Results (purchases),Cost per purchase,Purchase ROAS,Quality ranking,Engagement rate ranking,Conversion rate ranking\n"
                "Q2-CBO,Lookalike 1%,Active,Advantage+ Campaign Budget,4210.55,612340,1.71,9120,148,28.45,3.10,Average,Above average,Average\n"
                "Q2-CBO,Broad 25-54,Learning,Advantage+ Campaign Budget,1980.20,290110,1.44,4410,41,48.30,2.05,Average,Average,Average\n"
                "Q2-CBO,Retargeting 14d,Active,Advantage+ Campaign Budget,310.75,38210,2.95,1120,29,10.71,6.80,Above average,Above average,Above average\n"
            ),
            "rubric": (
                "CRITICAL: must identify this as CBO → evaluate at CAMPAIGN level; must NOT recommend pausing "
                "'Lookalike 1%' on its higher average CPA (breakdown effect — that would raise total cost); must "
                "caveat 'Broad 25-54' as in Learning (not predictive). " + CORE
            ),
        },
        {
            "id": "syn-abo-leadgen-lowbudget",
            "task_type": "leadgen_abo",
            "prompt": "Analyze my lead-gen account. Export below. Goal: lower cost per registration. What to scale, fix, NOT touch?",
            "csv": (
                "Campaign name,Objective,Ad set name,Delivery status,Amount spent,Impressions,Frequency,Result type,Results,Cost per result,Quality ranking\n"
                "Leads,OUTCOME_LEADS,Prospecting,Learning Limited,135.00,4200,1.2,Registrations,3,45.00,UNKNOWN\n"
                "Leads,OUTCOME_LEADS,Retargeting,Learning Limited,62.00,690,1.0,Registrations,1,62.00,UNKNOWN\n"
            ),
            "rubric": (
                "CRITICAL: must judge on cost per REGISTRATION (not purchases/ROAS); must NOT fabricate the UNKNOWN "
                "rankings; must flag that ~$4.50/day budget keeps it permanently in Learning Limited (structural, "
                "not creative) and that 3-1 conversions is too small a sample to judge. " + CORE
            ),
        },
        {
            "id": "syn-creative-fatigue",
            "task_type": "fatigue",
            "prompt": "Analyze my campaign. Export below. CPA target $25. What to scale, fix, NOT touch?",
            "csv": (
                "Campaign name,Ad set name,Delivery status,Amount spent,Impressions,Frequency,Clicks (all),Results (purchases),Cost per purchase,Quality ranking,Engagement rate ranking\n"
                "Prospecting,Interest - Fitness,Active,2640.10,401220,4.39,5980,72,36.66,Below average,Below average\n"
                "Prospecting,Interest - Tech,Active,1900.00,260000,1.8,4200,95,20.00,Above average,Above average\n"
            ),
            "rubric": (
                "CRITICAL: must diagnose 'Interest - Fitness' (frequency 4.39, below-average Quality + Engagement) as "
                "CREATIVE FATIGUE / a creative problem, and recommend creative refresh — not an audience cut. " + CORE
            ),
        },
    ],
    "val": [
        {
            "id": "syn-auction-overlap",
            "task_type": "overlap",
            "prompt": "Analyze my campaign. Export below. Why are ad sets underspending? What to fix, NOT touch?",
            "csv": (
                "Campaign name,Ad set name,Delivery status,Amount spent,Impressions,Frequency,Results (purchases),Cost per purchase\n"
                "Scaling,Retargeting A,Learning Limited,120.00,9000,2.9,11,10.90\n"
                "Scaling,Retargeting B,Learning Limited,98.00,7800,2.7,9,10.88\n"
                "Scaling,Retargeting C,Learning Limited,88.00,7100,2.6,8,11.00\n"
            ),
            "rubric": (
                "CRITICAL: must identify AUCTION OVERLAP between the three overlapping retargeting ad sets (chronic "
                "Learning Limited + underspend) as the structural cause, and recommend consolidation — not pausing "
                "for performance. " + CORE
            ),
        },
        {
            "id": "syn-healthy-scale",
            "task_type": "healthy",
            "prompt": "Analyze my campaign. Export below. CPA target $40. What to scale, fix, NOT touch?",
            "csv": (
                "Campaign name,Ad set name,Delivery status,Budget type,Amount spent,Impressions,Frequency,Results (purchases),Cost per purchase,Purchase ROAS,Quality ranking\n"
                "Evergreen-CBO,Broad,Active,Advantage+ Campaign Budget,5200.00,740000,1.9,210,24.76,4.20,Above average\n"
                "Evergreen-CBO,Lookalike 2%,Active,Advantage+ Campaign Budget,3100.00,420000,1.7,118,26.27,3.90,Average\n"
            ),
            "rubric": (
                "CRITICAL: this campaign is HEALTHY (CPA well under $40 target, ROAS strong, no fatigue) — must "
                "recommend SCALING (budget increases as testable hypotheses), and must NOT invent problems or "
                "recommend cuts where none are warranted. " + CORE
            ),
        },
    ],
}


def write_split(split, items):
    out = DATA / split
    out.mkdir(parents=True, exist_ok=True)
    (out / "items.json").write_text(json.dumps(items, indent=2) + "\n")
    print(f"  {split}: {len(items)} items → {out/'items.json'}")


def main():
    for split, items in SCENARIOS.items():
        write_split(split, items)

    # TEST = the real captured snapshot (held out).
    if REAL_CSV.exists():
        real = [{
            "id": "real-gooseworks-account",
            "task_type": "real_mixed",
            "prompt": (
                "Analyze my Meta Ads account (real snapshot, last 90d). Export below. Mix of lead-gen and traffic, "
                "several paused. Goal: lower cost per registration on lead-gen. What to scale, fix, NOT touch? "
                "If data is missing or too low-volume, say so."
            ),
            "csv": REAL_CSV.read_text(),
            "rubric": (
                "REAL data, no planted answer — grade METHODOLOGY: judge OUTCOME_LEADS on cost per registration "
                "(not purchases), do NOT fabricate UNKNOWN rankings, flag paused ad sets + tiny samples as "
                "low-confidence, note budget type isn't in the data. " + CORE
            ),
        }]
        write_split("test", real)
    else:
        print(f"  ! real capture not found at {REAL_CSV} — run ../test/capture-fixture.js first. Skipping test split.")


if __name__ == "__main__":
    main()
