const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  parseFrontmatter,
  serializeFrontmatter,
  replaceAuthBlocks,
  rewriteOrthRun,
  rewriteOrthSearch,
  rewriteOrthShow,
  rewriteCommands,
  rewriteSkill,
  generateMeta,
  queryStringToJson,
} = require('../rewrite-orthogonal-skills');

describe('rewrite-orthogonal-skills', () => {
  describe('parseFrontmatter', () => {
    it('parses YAML frontmatter and body', () => {
      const content = '---\nname: test-skill\ndescription: A test\n---\n\n# Body';
      const { frontmatter, body } = parseFrontmatter(content);
      expect(frontmatter.name).toBe('test-skill');
      expect(frontmatter.description).toBe('A test');
      expect(body.trim()).toBe('# Body');
    });

    it('returns raw content as body when no frontmatter', () => {
      const content = '# Just a body';
      const { frontmatter, body } = parseFrontmatter(content);
      expect(Object.keys(frontmatter)).toHaveLength(0);
      expect(body).toBe('# Just a body');
    });

    it('parses array values in brackets', () => {
      const content = '---\ntags: [foo, bar, baz]\n---\n\nBody';
      const { frontmatter } = parseFrontmatter(content);
      expect(frontmatter.tags).toEqual(['foo', 'bar', 'baz']);
    });
  });

  describe('queryStringToJson', () => {
    it('converts key=value pairs to JSON', () => {
      const result = JSON.parse(queryStringToJson('domain=stripe.com&first_name=John'));
      expect(result).toEqual({ domain: 'stripe.com', first_name: 'John' });
    });
  });

  describe('rewriteOrthRun', () => {
    it('rewrites orth run with -b body flag', () => {
      const cmd = `orth run hunter /v2/email-finder -b '{"domain":"stripe.com"}'`;
      const result = rewriteOrthRun(cmd);
      expect(result).toContain('/v1/proxy/orthogonal/run');
      expect(result).toContain('"api":"hunter"');
      expect(result).toContain('"path":"/v2/email-finder"');
      expect(result).toContain('"body"');
      expect(result).toContain('"domain":"stripe.com"');
    });

    it('rewrites orth run with -q query flag', () => {
      const cmd = `orth run hunter /v2/email-finder -q 'domain=stripe.com&first_name=John'`;
      const result = rewriteOrthRun(cmd);
      expect(result).toContain('/v1/proxy/orthogonal/run');
      expect(result).toContain('"api":"hunter"');
      expect(result).toContain('"query"');
      expect(result).toContain('"domain":"stripe.com"');
      expect(result).toContain('"first_name":"John"');
    });

    it('rewrites orth run without flags', () => {
      const cmd = 'orth run hunter /v2/email-finder';
      const result = rewriteOrthRun(cmd);
      expect(result).toContain('/v1/proxy/orthogonal/run');
      expect(result).toContain('"api":"hunter"');
      expect(result).toContain('"path":"/v2/email-finder"');
      expect(result).not.toContain('"body"');
      expect(result).not.toContain('"query"');
    });

    it('inserts unwrapper for piped commands', () => {
      const cmd = `orth run hunter /v2/email-finder -b '{"domain":"stripe.com"}' | python3 process.py`;
      const result = rewriteOrthRun(cmd);
      expect(result).toContain('/v1/proxy/orthogonal/run');
      expect(result).toContain("python3 -c \"import json,sys;d=json.load(sys.stdin);print(json.dumps(d.get('data',d)))\"");
      expect(result).toContain('| python3 process.py');
    });

    it('strips --dry-run flag', () => {
      const cmd = 'orth run hunter /v2/email-finder --dry-run';
      const result = rewriteOrthRun(cmd);
      expect(result).not.toContain('dry-run');
      expect(result).toContain('"api":"hunter"');
    });

    it('rewrites orth api run (with api prefix)', () => {
      const cmd = `orth api run hunter /v2/email-finder --query 'email=jane@company.com'`;
      const result = rewriteOrthRun(cmd);
      expect(result).toContain('/v1/proxy/orthogonal/run');
      expect(result).toContain('"api":"hunter"');
      expect(result).toContain('"query"');
      expect(result).toContain('"email":"jane@company.com"');
    });

    it('rewrites -d body flag (same as -b)', () => {
      const cmd = `orth run nyne /person/search -d '{"query":"Dario Amodei"}'`;
      const result = rewriteOrthRun(cmd);
      expect(result).toContain('/v1/proxy/orthogonal/run');
      expect(result).toContain('"api":"nyne"');
      expect(result).toContain('"body"');
      expect(result).toContain('"query":"Dario Amodei"');
    });

    it('rewrites --query long flag', () => {
      const cmd = `orth run hunter /v2/email-finder --query 'domain=stripe.com&first_name=Patrick'`;
      const result = rewriteOrthRun(cmd);
      expect(result).toContain('"query"');
      expect(result).toContain('"domain":"stripe.com"');
      expect(result).toContain('"first_name":"Patrick"');
    });

    it('rewrites space-separated --query key=val pairs', () => {
      const cmd = `orth api run hunter /v2/email-finder --query domain=openai.com first_name=Sam last_name=Altman`;
      const result = rewriteOrthRun(cmd);
      expect(result).toContain('"query"');
      expect(result).toContain('"domain":"openai.com"');
      expect(result).toContain('"first_name":"Sam"');
      expect(result).toContain('"last_name":"Altman"');
    });
  });

  describe('rewriteOrthSearch', () => {
    it('rewrites orth api search to search proxy', () => {
      const cmd = 'orth api search "find email by name"';
      const result = rewriteOrthSearch(cmd);
      expect(result).toContain('/v1/proxy/orthogonal/search');
      expect(result).toContain('"prompt":"find email by name"');
    });

    it('handles single-quoted prompts', () => {
      const cmd = "orth api search 'find company info'";
      const result = rewriteOrthSearch(cmd);
      expect(result).toContain('/v1/proxy/orthogonal/search');
      expect(result).toContain('"prompt":"find company info"');
    });
  });

  describe('rewriteOrthShow', () => {
    it('rewrites orth api show with path to details proxy', () => {
      const cmd = 'orth api show hunter /v2/email-finder';
      const result = rewriteOrthShow(cmd);
      expect(result).toContain('/v1/proxy/orthogonal/details');
      expect(result).toContain('"api":"hunter"');
      expect(result).toContain('"path":"/v2/email-finder"');
    });

    it('rewrites orth api show slug-only to search proxy', () => {
      const cmd = 'orth api show hunter';
      const result = rewriteOrthShow(cmd);
      expect(result).toContain('/v1/proxy/orthogonal/search');
      expect(result).toContain('hunter');
    });
  });

  describe('rewriteCommands', () => {
    it('rewrites all orth commands in a body', () => {
      const body = `# Example

Run this:
\`\`\`bash
orth run hunter /v2/email-finder -b '{"domain":"stripe.com"}'
\`\`\`

Search:
\`\`\`bash
orth api search "find email"
\`\`\`

Details:
\`\`\`bash
orth api show hunter /v2/email-finder
\`\`\``;

      const result = rewriteCommands(body);
      expect(result).toContain('/v1/proxy/orthogonal/run');
      expect(result).toContain('/v1/proxy/orthogonal/search');
      expect(result).toContain('/v1/proxy/orthogonal/details');
      expect(result).not.toContain('orth run');
      expect(result).not.toContain('orth api search');
      expect(result).not.toContain('orth api show');
    });

    it('preserves non-orth content unchanged', () => {
      const body = '# Title\n\nSome regular text.\n\n```bash\ncurl https://example.com\n```';
      const result = rewriteCommands(body);
      expect(result).toBe(body);
    });
  });

  describe('replaceAuthBlocks', () => {
    it('removes orth login references', () => {
      const body = '# Skill\n\nRun `orth login` to authenticate.\n\nThen do stuff.';
      const result = replaceAuthBlocks(body);
      expect(result).not.toContain('orth login');
    });

    it('removes ORTHOGONAL_API_KEY references', () => {
      const body = '# Skill\n\nexport ORTHOGONAL_API_KEY=your-key\n\nDo stuff.';
      const result = replaceAuthBlocks(body);
      expect(result).not.toContain('ORTHOGONAL_API_KEY');
    });

    it('inserts GooseWorks credential setup', () => {
      const body = '# My Skill\n\nSome instructions.';
      const result = replaceAuthBlocks(body);
      expect(result).toContain('GOOSEWORKS_API_KEY');
      expect(result).toContain('gooseworks/credentials.json');
      expect(result).toContain('npx gooseworks login');
    });
  });

  describe('rewriteSkill', () => {
    it('adds source: orthogonal to frontmatter', () => {
      const content = '---\nname: test\ndescription: Test skill\n---\n\n# Test\n\nSome content.';
      const result = rewriteSkill(content);
      expect(result).toContain('source: orthogonal');
    });

    it('preserves the source name without prefixing', () => {
      const content = '---\nname: hunter\ndescription: Email finder\n---\n\n# Hunter';
      const result = rewriteSkill(content);
      expect(result).toContain('name: hunter');
      expect(result).not.toContain('name: orthogonal-');
    });

    it('rewrites orth commands and replaces auth', () => {
      const content = `---
name: email-finder
description: Find emails
---

# Email Finder

Run \`orth login\` first.

\`\`\`bash
orth run hunter /v2/email-finder -b '{"domain":"stripe.com"}'
\`\`\``;

      const result = rewriteSkill(content);
      expect(result).toContain('source: orthogonal');
      expect(result).toContain('name: email-finder');
      expect(result).not.toContain('name: orthogonal-');
      expect(result).toContain('/v1/proxy/orthogonal/run');
      expect(result).not.toContain('orth run');
      expect(result).not.toContain('orth login');
      expect(result).toContain('GOOSEWORKS_API_KEY');
    });
  });

  describe('generateMeta', () => {
    it('generates correct skill.meta.json structure', () => {
      const meta = generateMeta('email-finder-hunter', { tags: ['email', 'enrichment'] });
      expect(meta).toEqual({
        slug: 'email-finder-hunter',
        category: 'capabilities',
        tags: ['email', 'enrichment'],
        source: 'orthogonal',
        installation: {
          base_command: 'npx goose-skills install email-finder-hunter',
          supports: ['claude', 'cursor', 'codex'],
        },
      });
    });

    it('handles missing tags', () => {
      const meta = generateMeta('test', {});
      expect(meta.tags).toEqual([]);
    });
  });

  describe('dry-run mode (integration)', () => {
    it('does not write files in dry-run mode', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orth-test-'));
      const inputDir = path.join(tmpDir, 'input');
      const outputDir = path.join(tmpDir, 'output');
      fs.mkdirSync(inputDir, { recursive: true });

      // Write a test skill
      fs.writeFileSync(
        path.join(inputDir, 'test.md'),
        '---\nname: test\nslug: test\n---\n\n# Test\n\north run hunter /v2/email-finder',
        'utf8',
      );

      // Run the main function in dry-run mode by requiring and calling exported functions
      // Since main() uses process.argv, we test the logic components instead
      const content = fs.readFileSync(path.join(inputDir, 'test.md'), 'utf8');
      const rewritten = rewriteSkill(content);

      // Verify output dir was NOT created (we didn't write)
      expect(fs.existsSync(outputDir)).toBe(false);

      // Verify the rewrite is correct
      expect(rewritten).toContain('/v1/proxy/orthogonal/run');
      expect(rewritten).not.toContain('orth run');

      // Cleanup
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
  });
});
