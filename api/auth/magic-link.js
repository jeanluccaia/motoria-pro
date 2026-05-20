"use strict";

/**
 * Magic link is disabled for the MVP.
 * Official flow: email + access code at /login.
 */

const { applyCors } = require("../_cors");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (applyCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  return res.status(410).json({
    ok: false,
    error: "Magic link desativado. Use email + codigo de acesso.",
    code: "code_login_required",
    loginPath: "/login",
  });
};
