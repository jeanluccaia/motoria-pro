"use strict";

const handler = require("../admin");

module.exports = function accessCode(req, res) {
  req.query = { ...(req.query || {}), action: "access-code" };
  return handler(req, res);
};
