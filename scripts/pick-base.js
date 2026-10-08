#!/usr/bin/env node
'use strict';

/**
 * Print the commit the atom and part checks compare with, from the GitHub
 * event that started the run:
 *
 *   node scripts/pick-base.js        (reads GITHUB_EVENT_NAME, GITHUB_EVENT_PATH)
 *
 * - pull_request: the base sha the checked-out merge commit was made on
 *   (pull_request.base.sha), never the base branch's name, which can move
 *   after the merge snapshot was made. When HEAD is that merge commit its
 *   first parent must be the same sha, so the comparison is exactly the
 *   pull request's own change.
 * - push: the tip the push replaced (before), so a force push is compared
 *   with what it overwrote.
 *
 * A sha missing from the clone is fetched by sha. A run with no usable base
 * (an all-zero sha, a missing sha, one that cannot be fetched, a merge
 * commit on another base) exits 1, so the checks never run unchecked.
 */

const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = process.env.GOOSE_SKILLS_ROOT || process.cwd();
const SHA = /^[0-9a-f]{40}$/;

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function hasCommit(sha) {
  try {
    git(['cat-file', '-e', `${sha}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

function ensureCommit(sha, what) {
  if (!SHA.test(sha || '') || /^0+$/.test(sha)) throw new Error(`${what} is not a commit sha (${sha || 'empty'})`);
  if (hasCommit(sha)) return sha;
  try {
    git(['fetch', '--no-tags', '--quiet', 'origin', sha]);
  } catch {
    throw new Error(`${what} ${sha} is not in the clone and could not be fetched`);
  }
  if (!hasCommit(sha)) throw new Error(`${what} ${sha} could not be fetched`);
  return sha;
}

function pickBase(eventName, event) {
  if (eventName === 'pull_request' || eventName === 'pull_request_target') {
    const base = ensureCommit(event.pull_request && event.pull_request.base && event.pull_request.base.sha, 'the pull request base');
    const parents = git(['rev-list', '--parents', '-n', '1', 'HEAD']).split(' ').slice(1);
    if (parents.length === 2 && parents[0] !== base) {
      throw new Error(
        `the checked-out merge commit was made on ${parents[0]}, not the event's base ${base}; re-run the checks`,
      );
    }
    return base;
  }
  if (eventName === 'push') return ensureCommit(event.before, 'the replaced tip');
  throw new Error(`no base for a ${eventName || 'missing'} event`);
}

if (require.main === module) {
  try {
    const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    process.stdout.write(`${pickBase(process.env.GITHUB_EVENT_NAME, event)}\n`);
  } catch (err) {
    console.error(`pick-base: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { pickBase };
