// Stub de test-only para o pacote `server-only`. Em produção o Next.js
// impede que módulos com `import "server-only"` sejam usados em Client
// Components; em Node puro (Playwright) o pacote real sempre lança erro.
// Aqui deixamos silencioso — a garantia real de "server-only" é o próprio
// acesso a `process.env.X`, que já não existe em bundle de browser.
module.exports = {};
