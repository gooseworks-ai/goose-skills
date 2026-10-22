function validateRetirements(manifest, skills) {
  const active = new Map(skills.map((skill) => [skill.slug, skill]));
  const retired = new Set();
  for (const entry of manifest.retired || []) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.slug) || retired.has(entry.slug)) throw new Error('Invalid or duplicate retired skill');
    if (active.has(entry.slug)) throw new Error(`Retired skill is still active: ${entry.slug}`);
    if (!active.has(entry.replacement) || entry.replacement === entry.slug) throw new Error(`Missing active replacement for ${entry.slug}`);
    if (!entry.reason) throw new Error(`Missing retirement reason: ${entry.slug}`);
    retired.add(entry.slug);
  }
  for (const skill of skills) {
    for (const dependency of skill.metadata?.requires_skills || []) {
      if (retired.has(dependency)) throw new Error(`${skill.slug} requires retired skill ${dependency}`);
    }
  }
  for (const entry of manifest.retained || []) {
    if (!active.has(entry.slug) || retired.has(entry.slug)) throw new Error(`Retained skill missing: ${entry.slug}`);
  }
  return manifest.retired || [];
}

module.exports = { validateRetirements };
