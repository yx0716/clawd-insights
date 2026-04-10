// src/analytics-config.js — helpers for merging dashboard AI settings

function mergeAIConfig(existing, incoming) {
  const prev = existing || {};
  const next = incoming || {};
  const merged = { ...prev, ...next };
  const providerChanged = typeof next.provider === "string" && next.provider !== (prev.provider || undefined);

  // Keep the saved key when the provider stays the same and the form leaves
  // the field blank. But if the provider changed, blank means "disable API
  // fallback until a matching key is provided" — never reuse the old key.
  if (next.apiKey === null) {
    delete merged.apiKey;
  } else if (next.apiKey === undefined || next.apiKey === "") {
    if (providerChanged) delete merged.apiKey;
    else if (prev.apiKey) merged.apiKey = prev.apiKey;
    else delete merged.apiKey;
  }

  // baseUrl/model are provider-specific. An explicit null or empty string
  // clears the override so the new provider falls back to its own defaults.
  for (const field of ["baseUrl", "model"]) {
    if (next[field] === null || next[field] === "") {
      delete merged[field];
    } else if (providerChanged && next[field] === undefined) {
      delete merged[field];
    }
  }

  return merged;
}

module.exports = {
  mergeAIConfig,
};
