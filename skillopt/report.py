#!/usr/bin/env python3
"""
Render a self-contained HTML "system view" for a SkillOpt run.

Lays the whole pipeline out in order, with plain-English roles:
  1) the TRAIN questions the student practiced on (+ answers the TUTOR read)
  2) the TUTOR's change to the skill (the diff)
  3) the EXAMINER's check: the same VAL questions answered with the OLD skill
     vs the NEW skill, with the JUDGE's score on each, and accept/reject
  4) the FINAL TEST (the sealed exam — scored, but nobody acts on it)

Usage:
  ./skillopt-venv/bin/python skillopt/report.py [outputs/meta_ads_poc] [--open]
"""
from __future__ import annotations

import sys, os, re, json, html, difflib
from pathlib import Path

HERE = Path(__file__).resolve().parent
argv = [a for a in sys.argv[1:] if not a.startswith("--")]
OPEN = "--open" in sys.argv
RUN = Path(argv[0]).resolve() if argv else (HERE / "outputs" / "meta_ads_poc")
if not RUN.exists():
    print(f"Run dir not found: {RUN}"); sys.exit(1)

esc = lambda s: html.escape(str(s if s is not None else ""))

# Plain-English titles for the scenario ids.
TITLES = {
    "syn-cbo-purchase-breakdown": "CBO purchase campaign — breakdown-effect trap",
    "syn-abo-leadgen-lowbudget": "Lead-gen on a tiny budget — stuck in Learning",
    "syn-creative-fatigue": "Creative fatigue — high frequency, weak rankings",
    "syn-auction-overlap": "Auction overlap — 3 retargeting ad sets fighting",
    "syn-healthy-scale": "Healthy campaign — should scale, not fix",
    "real-gooseworks-account": "REAL Gooseworks account — last 90 days",
}
title = lambda tid: TITLES.get(tid, tid)


def read(p): p = Path(p); return p.read_text(encoding="utf-8") if p.is_file() else ""
def load_json(p): p = Path(p); return json.loads(p.read_text()) if p.is_file() else None


def split_input(prompt_text: str):
    """Return (question, csv) from a target_user_prompt.txt."""
    parts = re.split(r"## (?:Campaign data|Data).*?\n", prompt_text, maxsplit=1)
    q = parts[0].strip()
    csv = parts[1].strip() if len(parts) > 1 else ""
    return q, csv


def csv_table(csv: str) -> str:
    rows = [r for r in csv.splitlines() if r.strip()]
    if not rows:
        return ""
    head = "".join(f"<th>{esc(c)}</th>" for c in rows[0].split(","))
    body = "".join("<tr>" + "".join(f"<td>{esc(c)}</td>" for c in r.split(",")) + "</tr>" for r in rows[1:])
    return f'<div class="tbl"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>'


def parse_conv(pred_dir: Path) -> dict:
    conv = load_json(pred_dir / "conversation.json") or []
    report, verdict, score, reasoning, artifacts = "", "?", None, "", ""
    for e in conv:
        if e.get("type") == "message" and not report:
            report = e.get("content", "")
        if e.get("role") == "system":
            c = e.get("content", "")
            m = re.search(r"\[JUDGE VERDICT\]\s*(\w+)\s*\(score=([\d.]+)\)", c)
            if m: verdict, score = m.group(1), float(m.group(2))
            r = re.search(r"Reasoning:\s*(.*)", c, re.S)
            if r: reasoning = r.group(1).strip()
            a = re.search(r"Artifacts:\s*(.*)", c)
            if a: artifacts = a.group(1).strip()
    q, csv = split_input(read(pred_dir / "target_user_prompt.txt"))
    return {"question": q, "csv": csv, "report": report, "verdict": verdict, "score": score,
            "reasoning": reasoning, "artifacts": artifacts}


def preds(base: Path) -> dict:
    d = base / "predictions"
    return {p.name: parse_conv(p) for p in sorted(d.iterdir()) if p.is_dir()} if d.is_dir() else {}


def badge(v, s):
    cls = "ok" if str(v).lower() == "pass" else "bad" if v not in ("?", None) else "muted"
    return f'<span class="pill {cls}">{esc(v)}{f" · {s:.2f}" if s is not None else ""}</span>'


def input_block(d):
    return (f'<details><summary>📋 see the question + data</summary>'
            f'<div class="q">{esc(d["question"])}</div>{csv_table(d["csv"])}</details>')


def answer_block(label, d):
    arts = d.get("artifacts", "")
    art_html = (f'<div class="reason">📎 files produced: {esc(arts)}</div>'
                if arts and arts != "(none)" else "")
    return (f'<div class="col"><div class="lbl">{esc(label)} {badge(d["verdict"], d["score"])}</div>'
            f'<details><summary>see answer</summary><div class="ans">{esc(d["report"])[:7000]}</div>'
            f'{art_html}'
            f'{f"<div class=reason>judge said: {esc(d["reasoning"])[:400]}</div>" if d["reasoning"] else ""}'
            f'</details></div>')


def diff_html(old, new):
    out = []
    for line in difflib.unified_diff(old.splitlines(), new.splitlines(), lineterm="", n=1):
        if line.startswith(("+++", "---")): continue
        cls = "add" if line[:1] == "+" else "del" if line[:1] == "-" else "ctx" if line[:2] == "@@" else ""
        out.append(f'<div class="dl {cls}">{esc(line)}</div>')
    return "".join(out) or '<div class="muted">no changes</div>'


summary = load_json(RUN / "summary.json") or {}
seed = read(RUN / "seed_skill.md") or read(RUN / "skills" / "skill_v0000.md")
base_val = preds(RUN / "selection_eval_baseline")
base_test = preds(RUN / "test_eval_baseline")
best_test = preds(RUN / "test_eval")

steps = []
for sd in (sorted((RUN / "steps").glob("step_*")) if (RUN / "steps").is_dir() else []):
    cand_skill = read(sd / "candidate_skill.md")
    train = preds(sd / "rollout")
    cand_val = preds(sd / "selection_eval")
    rec = load_json(sd / "step_record.json") or {}
    # The trainer records the gate decision in `action` (e.g. "accept_new_best",
    # "accept", "reject", "skip") — there is no boolean "accepted" key. Derive it.
    action = str(rec.get("action", ""))
    accepted = rec.get("accepted")
    if accepted is None:
        accepted = action.startswith("accept")
    decided = "ACCEPTED ✅" if accepted else ("SKIPPED" if action == "skip" else "REJECTED ✗")

    # 1) train questions + the answers the tutor read
    train_html = "".join(
        f'<div class="card"><div class="card-h">📚 Practice Q{i+1}: {esc(title(tid))} &nbsp; {badge(t["verdict"], t["score"])}</div>'
        f'{input_block(t)}{answer_block("Student answer (old skill)", t)}</div>'
        for i, (tid, t) in enumerate(train.items()))

    # 2) tutor diff
    added = sum(1 for l in cand_skill.splitlines() if l) - sum(1 for l in seed.splitlines() if l)
    diff = diff_html(seed, cand_skill)

    # 3) examiner: old vs new on val questions
    exam_html = ""
    for i, tid in enumerate(sorted(set(list(base_val) + list(cand_val)))):
        old = base_val.get(tid, {"question": "", "csv": "", "report": "(none)", "verdict": "?", "score": None, "reasoning": ""})
        new = cand_val.get(tid, {"question": "", "csv": "", "report": "(none)", "verdict": "?", "score": None, "reasoning": ""})
        verdict = ("no change" if (old["score"] == new["score"])
                   else "better ▲" if (new["score"] or 0) > (old["score"] or 0) else "worse ▼")
        exam_html += (f'<div class="card"><div class="card-h">🧑‍⚖️ Exam Q{i+1}: {esc(title(tid))}'
                      f' &nbsp; <span class="muted">old {old["score"]} vs new {new["score"]} → {verdict}</span></div>'
                      f'{input_block(old)}<div class="grid2">{answer_block("With OLD skill", old)}{answer_block("With NEW skill", new)}</div></div>')

    rnum = int(sd.name.split('_')[-1])
    total_rounds = summary.get("total_steps", "?")
    steps.append(f"""
    <section class="stage"><div class="stage-h">Round {rnum} of {esc(total_rounds)} — one improvement attempt &nbsp;
      <span class="pill {'ok' if accepted else 'bad'}">examiner: {esc(decided)}</span></div>
      <p class="muted" style="font-size:12.5px;margin:2px 0 6px">The tutor reads the practice results, edits the skill, and the examiner decides whether to keep the edit.</p>

      <h3>① What the student practiced (TRAIN — the tutor reads these to decide edits)</h3>
      {train_html or '<div class=muted>none</div>'}

      <h3>② What the TUTOR changed in the skill ({added:+d} lines)</h3>
      <div class="diff">{diff}</div>

      <h3>③ The EXAMINER's check (VAL — same question, OLD skill vs NEW skill, judge scores each)</h3>
      {exam_html or '<div class=muted>none</div>'}
    </section>""")

# final test
test_html = ""
for tid in sorted(set(list(base_test) + list(best_test))):
    b = base_test.get(tid, {}); f = best_test.get(tid, {})
    test_html += (f'<div class="card"><div class="card-h">🏁 {esc(title(tid))} &nbsp; '
                  f'baseline {badge(b.get("verdict","?"), b.get("score"))} → best {badge(f.get("verdict","?"), f.get("score"))}</div>'
                  f'{input_block(f or b)}{answer_block("Best-skill answer", f or b)}</div>')

bv, bestv = summary.get("baseline_selection_hard", "?"), summary.get("best_selection_hard", "?")
bt, tt = summary.get("baseline_test_hard", "?"), summary.get("test_hard", "?")
flow = f"""
 <div class="flow">
   <div class="fbox">📚 <b>TRAIN</b><br>{summary.get('samples_per_epoch','?') or summary.get('config',{}).get('train_size','?')} questions<br><span class=muted>student practices</span></div>
   <div class="arr">→</div>
   <div class="fbox">🧑‍🏫 <b>TUTOR</b><br>rewrites skill<br><span class=muted>reads train fails</span></div>
   <div class="arr">→</div>
   <div class="fbox">🧑‍⚖️ <b>EXAMINER (gate)</b><br>val {bv} → {bestv}<br><span class=muted>keeps if better</span></div>
   <div class="arr">→</div>
   <div class="fbox">🏁 <b>FINAL TEST</b><br>{bt} → {tt}<br><span class=muted>sealed, nobody acts</span></div>
 </div>
 <div class="legend"><b>JUDGE</b> = grades every answer 0–1 against an answer-key (rubric). It decides nothing; it just scores.</div>"""

doc = f"""<!doctype html><html><head><meta charset=utf-8><title>SkillOpt — {esc(RUN.name)}</title><style>
 body{{margin:0;font:14px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1c1917;background:#fafaf9}}
 header{{padding:16px 26px;border-bottom:1px solid #e7e5e4;background:#fff}} header h1{{margin:0;font-size:16px}}
 main{{padding:22px 26px;max-width:1280px;margin:0 auto}}
 .flow{{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:6px 0 4px}}
 .fbox{{flex:1;min-width:140px;background:#fff;border:1px solid #e7e5e4;border-radius:10px;padding:12px;text-align:center;font-size:12.5px}}
 .arr{{color:#a8a29e;font-size:20px}}
 .legend{{font-size:12px;color:#44403c;background:#fff;border:1px dashed #d6d3d1;border-radius:8px;padding:8px 12px;margin-bottom:18px}}
 .stage{{background:#fff;border:1px solid #e7e5e4;border-radius:12px;padding:18px 20px;margin-bottom:20px}}
 .stage-h{{font-size:15px;font-weight:600;margin-bottom:6px}}
 h3{{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#78716c;margin:18px 0 8px;border-top:1px solid #f0efee;padding-top:12px}}
 .card{{border:1px solid #e7e5e4;border-radius:8px;padding:10px 12px;margin-bottom:10px}}
 .card-h{{font-size:13px;font-weight:600;margin-bottom:6px}}
 .grid2{{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:8px}} @media(max-width:880px){{.grid2{{grid-template-columns:1fr}}}}
 .col .lbl{{font-size:11px;text-transform:uppercase;color:#78716c;margin-bottom:4px}}
 .q{{font-size:12.5px;background:#fafaf9;border-radius:6px;padding:8px;margin:6px 0;white-space:pre-wrap}}
 .ans{{white-space:pre-wrap;font-size:12px;background:#fafaf9;border:1px solid #e7e5e4;border-radius:6px;padding:10px;max-height:380px;overflow:auto;margin-top:5px}}
 .reason{{font-size:11.5px;color:#78716c;margin-top:5px}}
 details summary{{cursor:pointer;font-size:12px;color:#0369a1;margin:3px 0}}
 .tbl{{overflow:auto;margin:6px 0}} table{{border-collapse:collapse;font-size:11px}} td,th{{border:1px solid #e7e5e4;padding:4px 7px;white-space:nowrap;text-align:left}} th{{background:#fafaf9}}
 .diff{{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;border:1px solid #e7e5e4;border-radius:6px;overflow:auto;max-height:480px}}
 .dl{{padding:1px 8px;white-space:pre-wrap}} .dl.add{{background:#f0fdf4;color:#166534}} .dl.del{{background:#fef2f2;color:#b91c1c}} .dl.ctx{{background:#f5f5f4;color:#78716c}}
 .pill{{display:inline-block;font-size:11px;font-weight:600;padding:1px 7px;border-radius:999px;border:1px solid #e7e5e4}}
 .pill.ok{{background:#f0fdf4;border-color:#bbf7d0;color:#15803d}} .pill.bad{{background:#fef2f2;border-color:#fecaca;color:#b91c1c}} .pill.muted{{color:#78716c}}
 .muted{{color:#78716c}}
</style></head><body>
<header><h1>SkillOpt — {esc(RUN.name)} <span class=muted style="font-weight:400">· the whole pipeline, in order</span></h1></header>
<main>
 {flow}
 {''.join(steps)}
 <section class="stage"><div class="stage-h">④ FINAL TEST — the sealed exam (scored by the judge, acted on by nobody)</div>
   <p class=muted style="font-size:12.5px">If this score matches the examiner's val score, the skill really learned. A big drop here would mean it overfit to the val questions.</p>
   {test_html or '<div class=muted>none</div>'}
 </section>
</main></body></html>"""

out = RUN / "report.html"
out.write_text(doc)
print(f"Report: {out}")
if OPEN:
    os.system(f'open "{out}"' if sys.platform == "darwin" else f'xdg-open "{out}"')
