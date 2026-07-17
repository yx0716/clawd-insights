// test/server-integration-owner.test.js — integration ownership (fork).
//
// A secondary instance (source checkout via `npm start` next to an installed
// build) must not steal shared machine state: it must not write
// ~/.clawd/runtime.json (hook event routing) and must not (re)install agent
// hooks in user configs. ctx.isIntegrationOwner === false demotes an instance;
// an absent flag keeps full ownership so upstream ctx shapes and existing
// tests are unaffected.

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");
const { EventEmitter } = require("node:events");

const initServer = require("../src/server");

function makeServer(ctxOverrides = {}) {
  const runtimeWrites = [];

  function createHttpServer() {
    const server = new EventEmitter();
    server.listening = true;
    server.listen = function () { this.emit("listening"); };
    server.close = function () {};
    server.address = function () { return { address: "127.0.0.1", port: 23333 }; };
    return server;
  }

  const api = initServer({
    createHttpServer,
    setImmediate: () => {},
    getPortCandidates: () => [23333],
    clearRuntimeConfig: () => true,
    writeRuntimeConfig: (port) => { runtimeWrites.push(port); return true; },
    readRuntimePort: () => 23333,
    readRuntimeIdentity: () => ({ ok: true, reason: null, port: 23333, ownerPid: process.pid }),
    isProcessAlive: () => true,
    ...ctxOverrides,
  });
  return { api, runtimeWrites };
}

describe("integration ownership", () => {
  it("owner (flag absent): writes runtime config and manages hooks", async () => {
    const h = makeServer();
    assert.strictEqual(await h.api.startHttpServer(), 23333);
    assert.deepStrictEqual(h.runtimeWrites, [23333]);
    assert.strictEqual(h.api.shouldManageClaudeHooks(), true);
    assert.strictEqual(h.api.shouldSyncAgentIntegration("codex"), true);
  });

  it("non-owner: binds its port but never writes runtime config", async () => {
    const h = makeServer({ isIntegrationOwner: false });
    assert.strictEqual(await h.api.startHttpServer(), 23333,
      "a non-owner instance still serves; it just must not claim hook routing");
    assert.deepStrictEqual(h.runtimeWrites, []);
  });

  it("non-owner: hook management and agent integration sync are gated off", () => {
    const h = makeServer({ isIntegrationOwner: false });
    assert.strictEqual(h.api.shouldManageClaudeHooks(), false);
    assert.strictEqual(h.api.shouldSyncAgentIntegration("claude-code"), false);
    assert.strictEqual(h.api.shouldSyncAgentIntegration("codex"), false);
  });

  it("non-owner: manageClaudeHooksAutomatically=true cannot override the gate", () => {
    const h = makeServer({ isIntegrationOwner: false, manageClaudeHooksAutomatically: true });
    assert.strictEqual(h.api.shouldManageClaudeHooks(), false);
  });

  it("explicit owner: isIntegrationOwner=true behaves like the default", async () => {
    const h = makeServer({ isIntegrationOwner: true });
    assert.strictEqual(await h.api.startHttpServer(), 23333);
    assert.deepStrictEqual(h.runtimeWrites, [23333]);
    assert.strictEqual(h.api.shouldManageClaudeHooks(), true);
  });
});
