"use strict";

function buildSettingsAnimOverridesMergeExports() {
  const DEFAULT_POSTER_CACHE_MAX = 192;

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function getAnimationDataThemeId(data) {
    return data && data.theme && typeof data.theme.id === "string" ? data.theme.id : null;
  }

  function isValidAnimationPreviewPosterPayload(payload) {
    return isPlainObject(payload)
      && typeof payload.themeId === "string"
      && payload.themeId.length > 0
      && typeof payload.filename === "string"
      && payload.filename.length > 0
      && typeof payload.previewImageUrl === "string"
      && payload.previewImageUrl.length > 0
      && typeof payload.previewPosterCacheKey === "string"
      && payload.previewPosterCacheKey.length > 0;
  }

  function rememberAnimationPreviewPoster(cache, payload, maxEntries = DEFAULT_POSTER_CACHE_MAX) {
    if (!(cache instanceof Map) || !isValidAnimationPreviewPosterPayload(payload)) return false;
    const key = payload.previewPosterCacheKey;
    if (cache.has(key)) cache.delete(key);
    cache.set(key, {
      themeId: payload.themeId,
      filename: payload.filename,
      previewImageUrl: payload.previewImageUrl,
    });
    while (cache.size > maxEntries) {
      const oldestKey = cache.keys().next().value;
      if (!oldestKey) break;
      cache.delete(oldestKey);
    }
    return true;
  }

  function getCachedPosterFor(cache, themeId, filename, cacheKey) {
    if (!(cache instanceof Map) || !themeId || !filename || !cacheKey) return null;
    const cached = cache.get(cacheKey);
    if (!cached) return null;
    if (cached.themeId !== themeId) return null;
    if (cached.filename !== filename) return null;
    if (typeof cached.previewImageUrl !== "string" || !cached.previewImageUrl) return null;
    cache.delete(cacheKey);
    cache.set(cacheKey, cached);
    return cached.previewImageUrl;
  }

  function patchAssetWithPoster(asset, themeId, cache) {
    if (!asset || typeof asset.name !== "string") return false;
    const previewImageUrl = getCachedPosterFor(cache, themeId, asset.name, asset.previewPosterCacheKey);
    if (!previewImageUrl) return false;
    asset.previewImageUrl = previewImageUrl;
    asset.previewPosterPending = false;
    return true;
  }

  function patchCardWithPoster(card, themeId, cache) {
    if (!card || typeof card.currentFile !== "string") return false;
    const previewImageUrl = getCachedPosterFor(
      cache,
      themeId,
      card.currentFile,
      card.currentFilePreviewPosterCacheKey
    );
    if (!previewImageUrl) return false;
    card.currentFilePreviewUrl = previewImageUrl;
    card.previewPosterPending = false;
    return true;
  }

  function mergePosterCacheIntoAnimationData(data, cache) {
    const themeId = getAnimationDataThemeId(data);
    if (!themeId || !(cache instanceof Map)) return data;
    if (Array.isArray(data.assets)) {
      for (const asset of data.assets) patchAssetWithPoster(asset, themeId, cache);
    }
    if (Array.isArray(data.sections)) {
      for (const section of data.sections) {
        const cards = section && Array.isArray(section.cards) ? section.cards : [];
        for (const card of cards) patchCardWithPoster(card, themeId, cache);
      }
    }
    if (Array.isArray(data.cards)) {
      for (const card of data.cards) patchCardWithPoster(card, themeId, cache);
    }
    return data;
  }

  function applyAnimationPosterPayload(runtime, payload, options = {}) {
    const warn = typeof options.warn === "function" ? options.warn : null;
    const maxEntries = Number.isFinite(options.maxEntries) ? options.maxEntries : DEFAULT_POSTER_CACHE_MAX;
    if (!isValidAnimationPreviewPosterPayload(payload)) {
      if (warn) warn("settings: invalid animation preview poster payload", payload);
      return { valid: false, stored: false, applied: false };
    }
    if (!runtime.animationPreviewPosterCache) runtime.animationPreviewPosterCache = new Map();
    rememberAnimationPreviewPoster(runtime.animationPreviewPosterCache, payload, maxEntries);

    const data = runtime.animationOverridesData;
    if (!data) return { valid: true, stored: true, applied: false };
    if (getAnimationDataThemeId(data) !== payload.themeId) {
      return { valid: true, stored: true, applied: false };
    }

    let applied = false;
    if (Array.isArray(data.assets)) {
      const asset = data.assets.find((candidate) => candidate && candidate.name === payload.filename);
      if (asset && asset.previewPosterCacheKey === payload.previewPosterCacheKey) {
        asset.previewImageUrl = payload.previewImageUrl;
        asset.previewPosterPending = false;
        applied = true;
      }
    }

    const patchCard = (card) => {
      if (!card || card.currentFile !== payload.filename) return;
      if (card.currentFilePreviewPosterCacheKey !== payload.previewPosterCacheKey) return;
      card.currentFilePreviewUrl = payload.previewImageUrl;
      card.previewPosterPending = false;
      applied = true;
    };
    if (Array.isArray(data.sections)) {
      for (const section of data.sections) {
        const cards = section && Array.isArray(section.cards) ? section.cards : [];
        for (const card of cards) patchCard(card);
      }
    }
    if (Array.isArray(data.cards)) {
      for (const card of data.cards) patchCard(card);
    }

    return { valid: true, stored: true, applied };
  }

  function getAssetPreviewUrl(asset) {
    if (!asset) return null;
    if (asset.previewImageUrl) return asset.previewImageUrl;
    return asset.needsScriptedPreviewPoster ? null : asset.fileUrl || null;
  }

  function getCardPreviewUrl(card) {
    if (!card) return null;
    if (card.currentFilePreviewUrl) return card.currentFilePreviewUrl;
    return (card.previewPosterPending || card.needsScriptedPreviewPoster) ? null : card.currentFileUrl || null;
  }

  return {
    DEFAULT_POSTER_CACHE_MAX,
    isValidAnimationPreviewPosterPayload,
    rememberAnimationPreviewPoster,
    mergePosterCacheIntoAnimationData,
    applyAnimationPosterPayload,
    getAssetPreviewUrl,
    getCardPreviewUrl,
  };
}

const settingsAnimOverridesMergeExports = buildSettingsAnimOverridesMergeExports();

if (typeof module !== "undefined" && module.exports) {
  module.exports = settingsAnimOverridesMergeExports;
}
if (typeof globalThis !== "undefined") {
  globalThis.ClawdSettingsAnimOverridesMerge = settingsAnimOverridesMergeExports;
}
