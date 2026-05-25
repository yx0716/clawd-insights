"use strict";

function checkLocalServer(serverApi) {
  const status = serverApi && typeof serverApi.getRuntimeStatus === "function"
    ? serverApi.getRuntimeStatus()
    : null;

  if (!status || !status.listening) {
    return {
      id: "local-server",
      status: "fail",
      level: "critical",
      detail: "Local server is not listening",
      textHint: "Restart Clawd. If the issue persists, check ~/.clawd/ permissions.",
      runtime: status,
      fixAction: { type: "restart-clawd" },
    };
  }

  if (!status.runtimeFileExists || !status.runtimeMatches) {
    return {
      id: "local-server",
      status: "fail",
      level: "warning",
      detail: `Listening on 127.0.0.1:${status.port}; runtime port is ${status.runtimePort || "missing"}`,
      textHint: "Restart Clawd to regenerate the runtime file.",
      runtime: status,
      fixAction: { type: "local-server" },
    };
  }

  return {
    id: "local-server",
    status: "pass",
    level: null,
    detail: `Listening on 127.0.0.1:${status.port}`,
    runtime: status,
  };
}

module.exports = { checkLocalServer };
