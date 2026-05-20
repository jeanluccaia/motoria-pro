"use strict";

const crypto = require("crypto");

const SESSION_DAYS = 30;

function getSecret() {
  return (
    process.env.CODE_SESSION_SECRET ||
    process.env.ADMIN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  );
}

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function createCodeSession({ email, userId, code, expiresAt }) {
  const secret = getSecret();
  if (!secret) return null;

  const exp = expiresAt || Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = b64url(JSON.stringify({
    v: 1,
    email,
    userId,
    code,
    source: "code",
    expiresAt: exp,
  }));
  return `${payload}.${sign(payload, secret)}`;
}

function verifyCodeSessionToken(token) {
  const secret = getSecret();
  if (!secret || !token || typeof token !== "string") return null;

  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;

  const expected = sign(payload, secret);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data?.email || !data?.userId || !data?.expiresAt) return null;
    if (Date.now() >= Number(data.expiresAt)) return null;
    return data;
  } catch {
    return null;
  }
}

function getCodeSessionFromReq(req) {
  const token = String(req.headers["x-motoria-code-session"] || "").trim();
  return verifyCodeSessionToken(token);
}

module.exports = {
  SESSION_DAYS,
  createCodeSession,
  verifyCodeSessionToken,
  getCodeSessionFromReq,
};
