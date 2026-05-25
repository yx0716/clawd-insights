const http = require("http");
const { EventEmitter } = require("events");

function blockedRequest(autoFail = false) {
  const req = new EventEmitter();
  const fail = () => process.nextTick(() => req.emit("error", new Error("blocked by hook test")));
  req.end = () => {
    fail();
    return req;
  };
  req.destroy = () => req;
  req.setTimeout = () => req;
  if (autoFail) fail();
  return req;
}

http.get = () => blockedRequest(true);
http.request = () => blockedRequest();
