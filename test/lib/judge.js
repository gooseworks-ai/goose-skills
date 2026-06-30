'use strict';

/**
 * LLM-as-judge. Scores a skill run against the case's natural-language rubric.
 *
 * Deterministic assertions gate first (in the harness); the judge handles the
 * quality dimension the assertions can't — did the analysis actually reason
 * correctly. Its verdict is advisory and gets calibrated by the human label
 * captured in the HTML report.
 */

function buildArtifactSummary(manifest) {
  return manifest.artifacts.map((a) => {
    if (a.type === 'text') return `- text artifact "${a.label}" (${a.bytes} bytes)`;
    if (a.type === 'table') return `- table "${a.label}" (${a.table?.totalRows ?? '?'} rows, cols: ${(a.table?.columns || []).join(', ')})`;
    return `- ${a.type} artifact "${a.label}"`;
  }).join('\n') || '(none)';
}

function reportText(manifest) {
  // Prefer the largest text/markdown artifact (the report), fall back to final message.
  const texts = manifest.artifacts.filter((a) => a.type === 'text' && a.content);
  if (!texts.length) return '(no text output produced)';
  texts.sort((a, b) => (b.bytes || 0) - (a.bytes || 0));
  return texts[0].content.slice(0, 16000);
}

function buildJudgePrompt({ skill, prompt, rubric, manifest }) {
  return `You are a strict, fair evaluator grading the output of an AI "skill" run.

SKILL: ${skill}

THE TASK THE SKILL WAS GIVEN:
${prompt}

THE RUBRIC (grade against this exactly):
${rubric}

RUN SUMMARY:
- artifacts produced:
${buildArtifactSummary(manifest)}
- external side-effects (mutations): ${manifest.side_effects.length}
- tool calls: ${manifest.tool_calls.map((t) => t.name).join(', ') || '(none)'}

THE SKILL'S PRIMARY OUTPUT:
"""
${reportText(manifest)}
"""

Grade it. Be skeptical — reward correct reasoning, penalize plausible-but-wrong analysis and any rubric "automatic fail" condition.

Respond with ONLY a JSON object, no prose, no markdown fences:
{
  "verdict": "pass" | "fail",
  "score": <number 1-5>,
  "criteria": [ { "name": "<short>", "met": true|false, "note": "<one line>" } ],
  "reasoning": "<2-4 sentences>",
  "failTriggers": [ "<any automatic-fail conditions that fired>" ]
}`;
}

function extractJson(stdout) {
  // Tolerate fences / leading prose.
  let s = stdout.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object in judge output');
  return JSON.parse(s.slice(start, end + 1));
}

/**
 * @param {object} opts
 * @param {function} opts.spawnClaude ({prompt, extraArgs, timeoutMs}) => {stdout}
 */
function judgeCase({ skill, prompt, rubric, manifest, spawnClaude, log = () => {} }) {
  if (!rubric) return { verdict: 'skipped', score: null, reasoning: 'no rubric defined', criteria: [] };

  const judgePrompt = buildJudgePrompt({ skill, prompt, rubric, manifest });
  log('    ↳ judging with LLM…');
  const { stdout } = spawnClaude({
    prompt: judgePrompt,
    extraArgs: ['--output-format', 'text'],
    timeoutMs: 3 * 60 * 1000,
  });

  try {
    const parsed = extractJson(stdout);
    return {
      verdict: parsed.verdict || 'fail',
      score: typeof parsed.score === 'number' ? parsed.score : null,
      maxScore: 5,
      criteria: parsed.criteria || [],
      reasoning: parsed.reasoning || '',
      failTriggers: parsed.failTriggers || [],
    };
  } catch (e) {
    return { verdict: 'error', score: null, reasoning: `judge parse error: ${e.message}`, raw: stdout.slice(0, 2000), criteria: [] };
  }
}

module.exports = { judgeCase, buildJudgePrompt };
