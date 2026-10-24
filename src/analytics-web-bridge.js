// src/analytics-web-bridge.js — the timeline page's bridge when it is served
// to a browser (clawd-insights fork) instead of opened in the dashboard window.
// It stands in for preload-analytics.js: same window.analyticsAPI, same
// method names, each call sent to Clawd's local web server (analytics-web.js).
// Keep the list below in step with preload-analytics.js; a test checks it.

(function () {
  var CALLS = {
    getData: "analytics-get-data",
    generateReport: "analytics-generate-report",
    pickSessionAnalysesExportPath: "analytics-pick-session-analyses-export-path",
    exportSessionAnalyses: "analytics-export-session-analyses",
    getAIConfig: "analytics-get-ai-config",
    saveAIConfig: "analytics-save-ai-config",
    clearAIConfig: "analytics-clear-ai-config",
    clearAnalysisCaches: "analytics-clear-analysis-caches",
    getCliDiagnostics: "analytics-cli-diagnostics",
    testCliPath: "analytics-test-cli-path",
    getProviders: "analytics-get-providers",
    listCustomProviders: "analytics-list-custom-providers",
    getCustomProvider: "analytics-get-custom-provider",
    addCustomProvider: "analytics-add-custom-provider",
    updateCustomProvider: "analytics-update-custom-provider",
    deleteCustomProvider: "analytics-delete-custom-provider",
    testCustomProvider: "analytics-test-custom-provider",
    getDefaultProvider: "analytics-get-default-provider",
    setDefaultProvider: "analytics-set-default-provider",
    getConversations: "analytics-get-conversations",
    getTimeline: "analytics-get-timeline",
    getAvailableMonths: "analytics-get-available-months",
    analyzeSession: "analytics-analyze-session",
    analyzeSelected: "analytics-analyze-selected",
    getDailyBuckets: "analytics-get-daily-buckets",
    getWeeklyBuckets: "analytics-get-weekly-buckets",
    analyzeRanges: "analytics-analyze-ranges",
    getAnalysisProvider: "analytics-get-analysis-provider",
    getAnalysisOptions: "analytics-get-analysis-options",
    getOneLiners: "analytics-get-oneliners",
    knowledgeCompound: "analytics-knowledge-compound",
    getLocalTitleMap: "analytics-get-local-title-map",
    setLocalTitle: "analytics-set-local-title",
    clearLocalTitle: "analytics-clear-local-title"
  };

  function call(channel, args) {
    // JSON has no undefined; say which arguments were left out.
    var undef = [];
    for (var i = 0; i < args.length; i++) if (args[i] === undefined) undef.push(i);
    return fetch("/api/" + channel, {
      method: "POST",
      headers: { "content-type": "application/json", "x-clawd": "1" },
      body: JSON.stringify({ args: args, undef: undef }),
    })
      .then(function (res) {
        if (res.status === 403) throw new Error("这个页面的授权失效了，从 Clawd 的右键菜单重新打开。");
        return res.json();
      })
      .then(function (data) {
        if (!data.ok) throw new Error(data.error || "failed");
        return data.value;
      });
  }

  var api = {};
  Object.keys(CALLS).forEach(function (name) {
    api[name] = function () {
      return call(CALLS[name], Array.prototype.slice.call(arguments));
    };
  });

  // New or grown sessions, pushed by the server as they are noticed.
  api.onSessionsUpdated = function (cb) {
    var source = new EventSource("/events");
    source.addEventListener("sessions-updated", function () {
      try {
        cb();
      } catch (e) {
        console.warn("onSessionsUpdated cb:", e);
      }
    });
    return function () {
      source.close();
    };
  };

  window.analyticsAPI = api;
})();
