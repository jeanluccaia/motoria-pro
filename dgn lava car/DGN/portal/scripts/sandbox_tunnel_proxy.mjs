// Reverse proxy local com Basic Auth para expor o sandbox via túnel.
// Ouve em 0.0.0.0:3100 e forwarda para http://127.0.0.1:3000 após validar
// Authorization: Basic <base64(user:pass)> contra DGN_SANDBOX_TUNNEL_BASIC_AUTH.
//
// Uso:
//   DGN_SANDBOX_TUNNEL_BASIC_AUTH='diogo:SENHA' node scripts/sandbox_tunnel_proxy.mjs
import http from "node:http";

const PORT = Number(process.env.DGN_SANDBOX_TUNNEL_PORT ?? 3100);
const TARGET_HOST = process.env.DGN_SANDBOX_TARGET_HOST ?? "127.0.0.1";
const TARGET_PORT = Number(process.env.DGN_SANDBOX_TARGET_PORT ?? 3000);
const BASIC_AUTH = process.env.DGN_SANDBOX_TUNNEL_BASIC_AUTH;
const REALM = 'Basic realm="DGN Sandbox"';

if (!BASIC_AUTH || !BASIC_AUTH.includes(":")) {
  console.error("Falta DGN_SANDBOX_TUNNEL_BASIC_AUTH no formato 'user:pass'. Abortando.");
  process.exit(1);
}

function timingSafeEqualStr(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  // Node crypto import avoided — simple char-by-char constant time.
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

function authorized(req) {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  return timingSafeEqualStr(decoded, BASIC_AUTH);
}

function sendUnauthorized(res) {
  res.writeHead(401, {
    "WWW-Authenticate": REALM,
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end("DGN Sandbox — credenciais necessárias.\n");
}

const server = http.createServer((req, res) => {
  if (!authorized(req)) return sendUnauthorized(res);

  const headers = { ...req.headers };
  // O Next 16 usa request.url derivado do Host header para montar os redirects
  // (ex.: Location: /admin/growth). Precisamos preservar o Host que o cliente
  // viu (host do túnel) — senão o redirect devolve "localhost:3000" e o browser
  // não consegue seguir.
  const incomingHost = req.headers["host"];
  if (incomingHost) {
    headers["host"] = incomingHost;
    headers["x-forwarded-host"] = incomingHost;
  }
  headers["x-forwarded-proto"] = "https";
  // Garanta que o Next não re-processe a auth do túnel.
  delete headers["authorization"];

  const upstream = http.request(
    {
      host: TARGET_HOST,
      port: TARGET_PORT,
      method: req.method,
      path: req.url,
      headers,
    },
    (upRes) => {
      // Rewrite de Location: o Next em `next start` monta redirects com
      // base no hostname+port do próprio listen (localhost:3000), ignorando
      // o Host header. Trocamos pelo host externo para o browser do Diogo
      // conseguir seguir.
      const rewritten = { ...upRes.headers };
      const location = upRes.headers["location"];
      if (location && incomingHost) {
        const needle = `://${TARGET_HOST}:${TARGET_PORT}`;
        const replacement = `://${incomingHost}`;
        if (typeof location === "string" && location.includes(needle)) {
          rewritten["location"] = location.replace(needle, replacement);
        }
        // Também cobre o caso http://localhost (sem port) OU variação http vs https.
        if (typeof rewritten["location"] === "string") {
          rewritten["location"] = rewritten["location"]
            .replace(`https://localhost:${TARGET_PORT}`, `https://${incomingHost}`)
            .replace(`http://localhost:${TARGET_PORT}`, `https://${incomingHost}`);
        }
      }
      res.writeHead(upRes.statusCode ?? 502, rewritten);
      upRes.pipe(res);
    },
  );

  upstream.on("error", (err) => {
    console.error("[tunnel-proxy] upstream error:", err.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
    }
    res.end("DGN Sandbox — portal upstream indisponível.\n");
  });

  req.pipe(upstream);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[tunnel-proxy] ouvindo 0.0.0.0:${PORT} → ${TARGET_HOST}:${TARGET_PORT}`);
  console.log(`[tunnel-proxy] basic auth user=${BASIC_AUTH.split(":")[0]}`);
});

process.on("SIGINT", () => { server.close(() => process.exit(0)); });
process.on("SIGTERM", () => { server.close(() => process.exit(0)); });
