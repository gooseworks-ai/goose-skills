"""Standard or Best: the price the customer picks at script approval (custom videos, 16 Oct 2026).

The tier sets each paid setting's default; the GooseWorks server checks every call against it.
A setting above the tier's default is an upgrade for one shot, and it needs a reason:

    failed_attempt  the shot failed its check at the cheaper setting: --upgrade-attempt <the
                    failed call's operation id> and --upgrade-why "<one line: why the cheaper
                    setting can't do it>"
    customer_asked  the customer asked for it: --upgrade-quote "<their words>"

Rules decided 16 Oct 2026: H3 is 768P in both tiers, and 1080P only when the customer asks
(customer_asked). Only a picture (GPT Image 2 medium -> high) may be upgraded after a failed
check on the agent's own judgment; any video upgrade needs the customer's new yes. Under Best a
picture already at high may retry at high with the failed_attempt params (a still_retry, paid from
the picture allowance).

After one failed check, judge the shot: retry once at the same setting when a prompt fix should
work (a wrong pose, a missing prop), or upgrade straight away when the cheaper setting probably
can't do it (small label text, a complex product shape, many parts that must stay exact).

The upgrade record uses the server's names, and `query` is what the paid call adds; call_query()
adds the shot's `shot_scene`.
"""
import argparse
import sys

TIERS = ("standard", "best")
DEFAULTS = {
    "standard": {"image_quality": "medium", "h3_resolution": "768P", "lipsync_resolution": "480p"},
    "best": {"image_quality": "high", "h3_resolution": "768P", "lipsync_resolution": "720p"},
}
RANK = {
    "image_quality": ["low", "medium", "high"],
    "h3_resolution": ["480P", "768P", "1080P"],
    "lipsync_resolution": ["480p", "720p"],
}
REASONS = ("failed_attempt", "customer_asked")


def _scene(text):
    if not text.isdigit() or int(text) < 1:
        raise argparse.ArgumentTypeError("a script scene number (1 or more); leave it out for a shared still")
    return int(text)


def add_args(ap, scene=True):
    ap.add_argument("--tier", default="standard", choices=TIERS,
                    help="the customer's price: standard (default) or best; sets the default quality or resolution")
    if scene:
        ap.add_argument("--shot-scene", type=_scene,
                        help="the script scene this call makes (the server's shot_scene); leave out for a shared still")
    ap.add_argument("--upgrade-reason", choices=REASONS,
                    help="why this shot goes above the tier's default (see tiers.py)")
    ap.add_argument("--upgrade-attempt", help="failed_attempt: the failed call's operation id")
    ap.add_argument("--upgrade-why", help="failed_attempt: one line on why the cheaper setting can't do this shot")
    ap.add_argument("--upgrade-quote", help="customer_asked: the customer's own words")


def default(a, setting):
    return DEFAULTS[a.tier][setting]


def upgrade(a, setting, chosen):
    """None when `chosen` is at or below the tier's default; else the upgrade record. Exits when an
    upgrade has no valid reason, so nothing is quoted or sent without one."""
    rank, base = RANK[setting], default(a, setting)
    if (setting == "image_quality" and chosen == base == "high" and a.upgrade_reason == "failed_attempt"):
        # Best's picture already at high failed its check: a retry at high with the failed attempt is a
        # still_retry the server pays from the picture allowance (#2085). Without the params it is an
        # ordinary call paid from the approved budget.
        attempt, why = ((v or "").strip() for v in (a.upgrade_attempt, a.upgrade_why))
        if not attempt or not why:
            sys.exit("a retry at high from the allowance needs --upgrade-attempt <operation id> and --upgrade-why \"<one line>\"")
        query = {"upgrade_reason": "failed_attempt", "upgrade_attempt": attempt[:200], "upgrade_why": why[:300]}
        return {"setting": setting, "from": base, "to": chosen, "reason": "failed_attempt", "kind": "still_retry",
                "failed_attempt_id": attempt[:200], "why": why[:300], "query": query}
    if rank.index(chosen) <= rank.index(base):
        if a.upgrade_reason:
            sys.exit("%s %s is not above the %s default (%s): drop --upgrade-reason" % (setting, chosen, a.tier, base))
        return None
    if setting != "image_quality" and a.upgrade_reason != "customer_asked":
        sys.exit("%s %s is a video upgrade: it needs the customer's new yes to its price (--upgrade-reason "
                 "customer_asked --upgrade-quote \"<their words>\"), never a failed check alone; or make it at %s"
                 % (setting, chosen, base))
    attempt, why, quote = ((v or "").strip() for v in (a.upgrade_attempt, a.upgrade_why, a.upgrade_quote))
    if a.upgrade_reason == "failed_attempt":
        if not attempt or not why:
            sys.exit("an upgrade after a failed check needs --upgrade-attempt <operation id> and --upgrade-why \"<one line>\"")
        record = {"reason": "failed_attempt", "failed_attempt_id": attempt[:200], "why": why[:300]}
        query = {"upgrade_reason": "failed_attempt", "upgrade_attempt": attempt[:200], "upgrade_why": why[:300]}
    elif a.upgrade_reason == "customer_asked":
        if not quote:
            sys.exit("an upgrade the customer asked for needs --upgrade-quote \"<their words>\"")
        record = {"reason": "customer_asked", "user_quote": quote[:500]}
        query = {"upgrade_reason": "customer_asked", "upgrade_quote": quote[:500]}
    else:
        sys.exit("%s %s is above the %s default (%s): an upgrade needs --upgrade-reason %s"
                 % (setting, chosen, a.tier, base, " | ".join(REASONS)))
    return {"setting": setting, "from": base, "to": chosen, **record, "query": query}


def call_query(a, upgrade_record=None):
    """The GooseWorks query parameters a paid call sends: the shot's shot_scene and the upgrade's."""
    query = dict((upgrade_record or {}).get("query") or {})
    if getattr(a, "shot_scene", None) is not None:
        query["shot_scene"] = int(a.shot_scene)  # a number, as data_price_provider takes it; the proxy sends it as text
    return query
