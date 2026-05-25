const { describe, it } = require("node:test");
const assert = require("node:assert");
const { EventEmitter } = require("node:events");

const initServer = require("../src/server");
const { checkLocalServer } = require("../src/doctor-detectors/local-server");

function makeServer({ runtimePort = 23333, addressPort = 23333, listening = true } = {}) {
  function createHttpServer() {
    const server = new EventEmitter();
    server.listening = listening;
    server.listen = function (_port, _host) { this.emit("listening"); };
    server.close = function () {};
    server.address = function () {
      return this.listening ? { address: "127.0.0.1", port: addressPort } : null;
    };
    return server;
  }

  const api = initServer({
    createHttpServer,
    setImmediate: () => {},
    getPortCandidates: () => [addressPort],
    writeRuntimeConfig: () => true,
    clearRuntimeConfig: () => true,
    readRuntimePort: () => runtimePort,
  });
  return api;
}

describe("checkLocalServer", () => {
  it("passes when server and runtime file port match", () => {
    const api = makeServer();
    api.startHttpServer();

    const result = checkLocalServer(api);
    assert.strictEqual(result.status, "pass");
    assert.strictEqual(result.runtime.runtimeMatches, true);
  });

  it("warns when runtime port is missing or stale", () => {
    const api = makeServer({ runtimePort: 23334, addressPort: 23333 });
    api.startHttpServer();

    const result = checkLocalServer(api);
    assert.strictEqual(result.status, "fail");
    assert.strictEqual(result.level, "warning");
    assert.deepStrictEqual(result.fixAction, { type: "local-server" });
  });

  it("is critical before the server starts listening and surfaces a restart action", () => {
    const api = makeServer({ runtimePort: null });

    const result = checkLocalServer(api);
    assert.strictEqual(result.status, "fail");
    assert.strictEqual(result.level, "critical");
    // Critical fail can't be repaired by repairRuntimeStatus (httpServer is
    // already non-null but not listening), so surface a restart-clawd action
    // instead of a misleading Fix button.
    assert.deepStrictEqual(result.fixAction, { type: "restart-clawd" });
  });
});
