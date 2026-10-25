# Skill template

Copy this folder to start a new skill. It is a sketch to fill in, not a skill: it is not under `skills/`, so nothing publishes it.

1. Copy `SKILL.md` and `skill.meta.json` into `skills/<family>/<slug>/` (see the table in [CONTRIBUTING.md](../../CONTRIBUTING.md#adding-a-skill) for the family).
2. Replace every `<…>`. The folder name, `name` and `slug` are the same slug, and it never changes once published.
3. Set `category` (`capabilities` for one step, `composites` for several, `playbooks` for a marketing playbook). A marketing skill also sets `tier` (`playbook`, `atom` or `foundation`); a shared skill sets `domain`.
4. Name GooseWorks tools only from `scripts/lib/action-names.json` `actions`. `npm run check:tools` fails on any other.
5. Put the skill's own tests in `tests/` (`test_*.py` or `*.test.js` run in CI on their own).
6. Run `npm run ci`, and commit the rebuilt `skills-index.json`.
