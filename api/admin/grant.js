"use strict";

const handler = require("../admin");

module.exports = function grant(req, res) {
  req.query = { ...(req.query || {}), action: "grant" };
  return handler(req, res);
};
