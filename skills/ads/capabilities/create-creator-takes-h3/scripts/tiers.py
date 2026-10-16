"""Standard or Best: the price the customer picks at script approval (custom videos, 16 Oct 2026).

The tier sets each paid setting's default. A setting above the tier's default is an upgrade
for one shot, and it needs a recorded reason:

    failed_attempt  the shot failed its check at the cheaper setting: --failed-attempt <id>
                    and --upgrade-why "<one line: why the cheaper setting can't do it>"
    customer_asked  the customer asked for it: --customer-quote "<their words>"
    shot_needs      Best only, H3 1080P for legible labels, logos or on-screen text, or a skin
                    close-up: --upgrade-why "<which>"

After one failed check, judge the shot: retry once at the same setting when a prompt fix should
work (a wrong pose, a missing prop), or upgrade straight away when the cheaper setting probably
can't do it (small label text, a complex product shape, many parts that must stay exact).
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
# Settings a tier may use above its default without a failed attempt or a customer's ask.
SHOT_NEEDS = {"best": {"h3_resolution": {"1080P"}}}
REASONS = ("failed_attempt", "customer_asked", "shot_needs")


def add_args(ap):
    ap.add_argument("--tier", default="standard", choices=TIERS,
                    help="the customer's price: standard (default) or best; sets the default quality or resolution")
    ap.add_argument("--upgrade-reason", choices=REASONS,
                    help="why this shot goes above the tier's default (see tiers.py)")
    ap.add_argument("--failed-attempt", help="failed_attempt: the id of the attempt that failed its check")
    ap.add_argument("--upgrade-why", help="one line: why the cheaper setting can't do this shot")
    ap.add_argument("--customer-quote", help="customer_asked: the customer's own words")


def default(tier, setting):
    return DEFAULTS[tier][setting]


def upgrade(a, setting, chosen):
    """None when `chosen` is at or below the tier's default; else the upgrade record. Exits when
    an upgrade has no valid reason, so nothing is quoted or sent without one."""
    rank = RANK[setting]
    if rank.index(chosen) <= rank.index(default(a.tier, setting)):
        if a.upgrade_reason:
            sys.exit("%s %s is not above the %s default (%s): drop --upgrade-reason"
                     % (setting, chosen, a.tier, default(a.tier, setting)))
        return None
    why = (a.upgrade_why or "").strip()
    reason = a.upgrade_reason
    if reason == "failed_attempt":
        if not (a.failed_attempt or "").strip() or not why:
            sys.exit("an upgrade after a failed check needs --failed-attempt <id> and --upgrade-why \"<one line>\"")
    elif reason == "customer_asked":
        if not (a.customer_quote or "").strip():
            sys.exit("an upgrade the customer asked for needs --customer-quote \"<their words>\"")
    elif reason == "shot_needs":
        if chosen not in SHOT_NEEDS.get(a.tier, {}).get(setting, set()):
            sys.exit("%s %s is not part of %s: it needs a failed attempt or the customer's ask" % (setting, chosen, a.tier))
        if not why:
            sys.exit("--upgrade-reason shot_needs needs --upgrade-why (legible labels, logos or text, or a skin close-up)")
    else:
        sys.exit("%s %s is above the %s default (%s): an upgrade needs --upgrade-reason %s"
                 % (setting, chosen, a.tier, default(a.tier, setting), " | ".join(REASONS)))
    record = {"setting": setting, "from": default(a.tier, setting), "to": chosen, "reason": reason}
    if reason == "failed_attempt":
        record["failed_attempt_id"] = a.failed_attempt.strip()
    if why:
        record["why"] = why
    if reason == "customer_asked":
        record["customer_quote"] = a.customer_quote.strip()
    return record
