"""Standard or Best: the price the customer picks at script approval (custom videos, 16 Oct 2026).

The tier sets each paid setting's default; the GooseWorks server checks every call against it.
A setting above the tier's default is an upgrade for one shot, and it needs a reason:

    failed_attempt  the shot failed its check at the cheaper setting: --upgrade-attempt <the
                    failed call's operation id> and --upgrade-why "<one line: why the cheaper
                    setting can't do it>"
    customer_asked  the customer asked for it: --upgrade-quote "<their words>"

H3 1080P is Best's default for a shot marked `detail` in the shot list (legible labels, logos or
on-screen text, or a skin close-up): pass --detail. After a failed check, 1080P is only for a
detail shot; the customer may ask for it on any shot.

After one failed check, judge the shot: retry once at the same setting when a prompt fix should
work (a wrong pose, a missing prop), or upgrade straight away when the cheaper setting probably
can't do it (small label text, a complex product shape, many parts that must stay exact).

The upgrade record uses the server's names, and `query` is what the paid call adds (with the
shot's `shot_scene`).
"""
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


def add_args(ap, detail=False):
    ap.add_argument("--tier", default="standard", choices=TIERS,
                    help="the customer's price: standard (default) or best; sets the default quality or resolution")
    if detail:
        ap.add_argument("--detail", action="store_true",
                        help="the shot list marks this shot detail (labels, logos, text or a skin close-up): "
                             "H3 1080P is Best's default for it, and the only shot a failed check may upgrade to 1080P")
    ap.add_argument("--upgrade-reason", choices=REASONS,
                    help="why this shot goes above the tier's default (see tiers.py)")
    ap.add_argument("--upgrade-attempt", help="failed_attempt: the failed call's operation id")
    ap.add_argument("--upgrade-why", help="failed_attempt: one line on why the cheaper setting can't do this shot")
    ap.add_argument("--upgrade-quote", help="customer_asked: the customer's own words")


def default(a, setting):
    if setting == "h3_resolution" and a.tier == "best" and getattr(a, "detail", False):
        return "1080P"
    return DEFAULTS[a.tier][setting]


def upgrade(a, setting, chosen):
    """None when `chosen` is at or below the tier's default; else the upgrade record. Exits when an
    upgrade has no valid reason, so nothing is quoted or sent without one."""
    rank, base = RANK[setting], default(a, setting)
    if rank.index(chosen) <= rank.index(base):
        if a.upgrade_reason:
            sys.exit("%s %s is not above the %s default (%s): drop --upgrade-reason" % (setting, chosen, a.tier, base))
        return None
    if (setting == "h3_resolution" and chosen == "1080P" and not getattr(a, "detail", False)
            and a.upgrade_reason != "customer_asked"):
        sys.exit("after a failed check, H3 1080P is only for a shot the shot list marks detail (labels, logos, "
                 "on-screen text or a skin close-up): pass --detail, make it at %s, or record the customer's ask" % base)
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
