'use strict';

// Shared tools copied into an installed skill when its skill.meta.json declares
// the corresponding name in `requires_tools`.
const TOOL_FILE_MAP = Object.freeze({
  apify_guard: ['tools/apify_guard.py'],
  supabase: ['tools/supabase/__init__.py', 'tools/supabase/supabase_client.py'],
  meta_marketing_api: ['tools/meta_marketing_api.js'],
});

function getToolFiles(name) {
  return TOOL_FILE_MAP[name] || null;
}

module.exports = { TOOL_FILE_MAP, getToolFiles };
