#!/usr/bin/env node

import fs from 'node:fs/promises';
import https from 'node:https';
import process from 'node:process';
import assert from 'node:assert/strict';

function parseArgs(argv) {
  const args = {
    input: null,
    output: null,
    offline: false,
    token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input') args.input = argv[++i];
    else if (arg === '--output') args.output = argv[++i];
    else if (arg === '--token') args.token = argv[++i];
    else if (arg === '--offline') args.offline = true;
    else if (arg === '--self-test') {
      runSelfTest();
      process.exit(0);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.input) throw new Error('Missing required --input path');
  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/audit_bounty_board.mjs --input examples/sample-listings.md --output audit.md
  node scripts/audit_bounty_board.mjs --input examples/sample-listings.md --offline

Options:
  --input <path>   Markdown or CSV file containing GitHub issue URLs.
  --output <path>  Optional report path. Defaults to stdout.
  --token <token>  Optional GitHub token. Defaults to GITHUB_TOKEN or GH_TOKEN.
  --offline        Do not call GitHub; emit needs-reconfirmation findings.
  --self-test      Run deterministic classification checks.`);
}

function extractIssueRefs(text) {
  const pattern = /https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/issues\/(\d+)/g;
  const refs = [];
  const seen = new Set();
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const [url, owner, repo, issueNumber] = match;
    const key = `${owner}/${repo}#${issueNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({
      owner,
      repo,
      issueNumber: Number(issueNumber),
      key,
      url,
    });
  }

  return refs;
}

function classifyCommentSignals(commentTexts) {
  if (commentTexts.some((body) => /\b(withdrawn|not honor|no longer active|will not pay|bounty.*closed)\b/.test(body))) {
    return {
      classification: 'withdrawn',
      priority: 'High',
      evidence: 'GitHub comments contain withdrawal or no-payment language.',
      wording: 'Bounty withdrawn by payer in GitHub comments. Do not start for payment unless the payer reconfirms.',
    };
  }

  if (commentTexts.some((body) => /\b(reserved|assigned to|assigned for|assigned exclusively)\b/.test(body))) {
    return {
      classification: 'reserved',
      priority: 'High',
      evidence: 'GitHub comments contain explicit reservation or assignment language.',
      wording: 'Bounty reserved for a specific maintainer/contributor. Do not start for payout.',
    };
  }

  const crowdSignals = commentTexts.filter((body) => (
    /(^|\s)(\/attempt|\/boss\s+champion)\b|\b(claiming it|claimed|already working|opened pr|submitted.*pr|pull\/\d+|pr\s*#\d+)\b/.test(body)
  ));

  if (crowdSignals.length) {
    return {
      classification: 'crowded',
      priority: crowdSignals.length > 1 ? 'High' : 'Medium',
      evidence: 'GitHub comments contain claim, attempt, or PR-submission language.',
      wording: 'High competition: multiple solution or claim signals already exist. Check maintainer comments before starting.',
    };
  }

  return null;
}

function runSelfTest() {
  assert.equal(classifyCommentSignals(['bounty withdrawn by payer']).classification, 'withdrawn');
  assert.equal(classifyCommentSignals(['this bounty is reserved for alice']).classification, 'reserved');
  assert.equal(classifyCommentSignals(['/attempt #12']).classification, 'crowded');
  assert.equal(classifyCommentSignals(['opened pr #14 for this']).classification, 'crowded');
  assert.equal(classifyCommentSignals(['thanks for the report']), null);
  console.log('bounty-board-auditor classification self-test passed');
}

function githubRequest(path, token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'bounty-board-auditor',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          let parsed = {};
          try {
            parsed = body ? JSON.parse(body) : {};
          } catch {
            parsed = { message: body };
          }
          resolve({ status: res.statusCode || 0, body: parsed });
        });
      },
    );
    req.on('error', (error) => resolve({ status: 0, body: { message: error.message } }));
    req.end();
  });
}

async function auditRef(ref, args) {
  if (args.offline) {
    return {
      ...ref,
      githubState: 'not checked',
      classification: 'needs-reconfirmation',
      priority: 'Medium',
      evidence: ['Offline mode did not call GitHub.'],
      wording: 'Payer confirmation required before new work starts.',
    };
  }

  const repoResult = await githubRequest(`/repos/${ref.owner}/${ref.repo}`, args.token);
  if (repoResult.status === 404) {
    return unavailable(ref, 'Repository returned 404 from GitHub.');
  }
  if (repoResult.status < 200 || repoResult.status >= 300) {
    return unavailable(ref, `GitHub repository request failed: ${repoResult.status} ${repoResult.body.message || ''}`.trim());
  }
  if (repoResult.body.archived) {
    return {
      ...ref,
      githubState: 'repo archived',
      classification: 'repo-archived',
      priority: 'High',
      evidence: ['GitHub repository is archived.'],
      wording: 'Repository archived. Reward is hidden until the repository is active again.',
    };
  }

  const issueResult = await githubRequest(`/repos/${ref.owner}/${ref.repo}/issues/${ref.issueNumber}`, args.token);
  if (issueResult.status === 404) {
    return unavailable(ref, 'Issue returned 404 from GitHub.');
  }
  if (issueResult.status < 200 || issueResult.status >= 300) {
    return unavailable(ref, `GitHub issue request failed: ${issueResult.status} ${issueResult.body.message || ''}`.trim());
  }

  const issue = issueResult.body;
  const evidence = [
    `GitHub issue state: ${issue.state}${issue.state_reason ? ` (${issue.state_reason})` : ''}.`,
  ];

  if (issue.assignees?.length) {
    evidence.push(`Assigned to: ${issue.assignees.map((a) => a.login).join(', ')}.`);
  }

  const labelNames = (issue.labels || []).map((label) => String(label.name || '').toLowerCase());
  if (labelNames.length) evidence.push(`Labels: ${labelNames.join(', ')}.`);

  if (issue.state === 'closed') {
    return {
      ...ref,
      githubState: `closed${issue.state_reason ? `/${issue.state_reason}` : ''}`,
      classification: 'closed-on-github',
      priority: 'High',
      evidence,
      wording: 'Closed on GitHub. Reward is not currently actionable.',
    };
  }

  const scopeLabels = ['to refine', 'needs spec', 'blocked', 'needs design', 'needs triage'];
  if (labelNames.some((name) => scopeLabels.some((needle) => name.includes(needle)))) {
    return {
      ...ref,
      githubState: 'open',
      classification: 'needs-scope',
      priority: 'Medium',
      evidence,
      wording: 'Spec not final. Ask maintainer for scope confirmation before implementation.',
    };
  }

  const commentsResult = await githubRequest(
    `/repos/${ref.owner}/${ref.repo}/issues/${ref.issueNumber}/comments?per_page=100`,
    args.token,
  );
  if (commentsResult.status >= 200 && commentsResult.status < 300 && Array.isArray(commentsResult.body)) {
    const commentTexts = commentsResult.body.map((comment) => String(comment.body || '').toLowerCase());
    const commentSignal = classifyCommentSignals(commentTexts);
    if (commentSignal) {
      return {
        ...ref,
        githubState: 'open',
        classification: commentSignal.classification,
        priority: commentSignal.priority,
        evidence: [...evidence, commentSignal.evidence],
        wording: commentSignal.wording,
      };
    }
  }

  return {
    ...ref,
    githubState: 'open',
    classification: 'active',
    priority: 'Low',
    evidence,
    wording: 'Issue appears open. Confirm payout rules before starting implementation.',
  };
}

function unavailable(ref, reason) {
  return {
    ...ref,
    githubState: 'unavailable',
    classification: 'repo-unavailable',
    priority: 'High',
    evidence: [reason],
    wording: 'GitHub repository is unavailable. Reward is hidden until the issue URL resolves.',
  };
}

function renderReport(findings) {
  const date = new Date().toISOString().slice(0, 10);
  const highRisk = findings.filter((finding) => finding.priority === 'High').length;
  const reconfirm = findings.filter((finding) => finding.classification === 'needs-reconfirmation').length;

  const lines = [
    '# Bounty Board Audit',
    '',
    `Date: ${date}`,
    '',
    '## Executive Summary',
    '',
    `Audited ${findings.length} GitHub issue listing${findings.length === 1 ? '' : 's'}. ${highRisk} high-priority listing${highRisk === 1 ? '' : 's'} should be hidden, corrected, or reconfirmed before contributors start work.`,
  ];

  if (reconfirm) {
    lines.push(`${reconfirm} listing${reconfirm === 1 ? '' : 's'} used offline mode and need primary-source confirmation.`);
  }

  lines.push(
    '',
    '## Findings Table',
    '',
    '| Listing | GitHub State | Classification | Priority |',
    '|---------|--------------|----------------|----------|',
  );

  for (const finding of findings) {
    lines.push(`| [${finding.key}](${finding.url}) | ${finding.githubState} | ${finding.classification} | ${finding.priority} |`);
  }

  lines.push('', '## Findings', '');
  findings.forEach((finding, index) => {
    lines.push(
      `### Finding ${index + 1}: ${finding.key} Is ${finding.classification}`,
      '',
      'Surface:',
      '',
      `- GitHub: \`${finding.url}\``,
      '',
      'Evidence:',
      '',
      ...finding.evidence.map((item) => `- ${item}`),
      '',
      'Recommended action:',
      '',
      finding.wording,
      '',
    );
  });

  lines.push('## Next Action', '', 'Send the board operator exact stale listings, GitHub evidence, and recommended public wording.');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = await fs.readFile(args.input, 'utf8');
  const refs = extractIssueRefs(input);

  if (!refs.length) {
    throw new Error('No GitHub issue URLs found in input.');
  }

  const findings = [];
  for (const ref of refs) {
    findings.push(await auditRef(ref, args));
  }

  const report = renderReport(findings);
  if (args.output) {
    await fs.writeFile(args.output, report, 'utf8');
  } else {
    process.stdout.write(report);
  }
}

main().catch((error) => {
  console.error(`bounty-board-auditor: ${error.message}`);
  process.exit(1);
});
