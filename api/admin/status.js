"use strict";

const handler = require("../admin");

module.exports = function status(req, res) {
  req.query = { ...(req.query || {}), action: "status" };
  return handler(req, res);
};
