# Deploy — PattaMansa

## Estrutura do repositório

O repositório Git (`motoria-pro`) fica **um nível acima** do projeto PattaMansa:

```
C:\Users\DELL\Desktop\jean IA\          ← raiz do repositório Git
├── index.html                           ← LP do MotorIA Pro (React app — NÃO é PattaMansa)
├── api/                                 ← API do MotorIA Pro
├── src/                                 ← código-fonte do MotorIA Pro
├── pattamansa/                          ← projeto correto da PattaMansa
│   ├── index.html                       ← LP estática da PattaMansa
│   ├── imgs/                            ← imagens dos cards (ASCII, sem acento/espaço)
│   ├── api/                             ← funções serverless da PattaMansa
│   ├── vercel.json                      ← config Vercel da PattaMansa
│   ├── .vercelignore                    ← exclui outros projetos do deploy
│   └── scripts/check-images.js         ← validação de imagens antes do deploy
├── loudfit/
├── dgn lava car/
└── ...
```

---

## Configuração obrigatória no Vercel

**Root Directory: `pattamansa`**

Sem isso, o Vercel deploya o `index.html` do MotorIA Pro (React sem build = página branca).

| Campo Vercel | Valor correto |
|---|---|
| Root Directory | `pattamansa` |
| Output Directory | `.` |
| Build Command | *(vazio)* |
| Framework Preset | Other |
| Production Branch | `main` |

> **Nunca deixar rootDirectory como `null` para este projeto.**
> `null` = raiz do repo = MotorIA Pro = página branca.

Para verificar ou corrigir via API:

```bash
TOKEN="<token do ~/.vercel/auth.json>"
PROJECT_ID="prj_LJAeqhUOfrgce7E9IJagNheSlrAg"
TEAM_ID="team_Q3kDg5E88TEpGM0MiAuYNQzr"

# Verificar
curl "https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | node -e \
  "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log('rootDirectory:',JSON.parse(d).rootDirectory))"

# Corrigir
curl -X PATCH "https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"rootDirectory": "pattamansa"}'
```

---

## Deploy em produção

### Deploy manual (emergencial ou sem GitHub conectado)

```bash
cd "C:\Users\DELL\Desktop\jean IA\pattamansa"
node scripts/check-images.js        # valida paths antes de subir
vercel --prod --force
```

### Deploy via GitHub (fluxo normal)

Qualquer push para `main` dispara auto-deploy. O Vercel clona o repo,
aplica `.vercelignore` e serve os arquivos de `pattamansa/`.

```bash
cd "C:\Users\DELL\Desktop\jean IA\pattamansa"
node scripts/check-images.js        # valida paths
git add <arquivos>
git commit -m "mensagem"
git push origin main                # Vercel deploya automaticamente
```

---

## Checklist obrigatório pós-deploy

Abrir `https://pattamansa.com.br` em **aba anônima** e conferir:

- [ ] Título: `PattaMansa — A Camisa do Povo`
- [ ] HTTP 200 (não 404, não 302 infinito)
- [ ] Página **não está branca** — hero aparece
- [ ] Ausência de `<div id="root">` no HTML (indicaria React/MotorIA Pro)
- [ ] Cards de produto renderizando com imagens visíveis
- [ ] DevTools → Network → Img: **zero 404**
- [ ] Nenhuma imagem com path contendo acento, espaço ou `coleção`
- [ ] Testar no mobile (simular iPhone no DevTools)
- [ ] Botões "Escolher cor e tamanho" abrindo drawer

### Validação rápida via terminal

```bash
# Verifica paths locais (sem rede)
node scripts/check-images.js

# Verifica HTTP 200 em produção (requer acesso à internet)
node scripts/check-images.js --http
```

---

## Problemas conhecidos e como resolver

### Página branca / título "MotorIA Pro"

O rootDirectory do projeto Vercel está como `null` (raiz do repo).
Corrigir via API (ver seção acima) e fazer redeploy:

```bash
vercel --prod --force
```

### Imagens 404 com paths `coleção .../` na URL

Paths com acento ou espaço não são servidos pelo Vercel no Linux.
Todas as imagens de produto devem estar em `imgs/` com nomes ASCII.
Verificar com `node scripts/check-images.js`.

### Auto-deploy não disparou após push

1. Verificar se o projeto está conectado ao GitHub: `vercel project inspect`
2. Se desconectado: `vercel git connect https://github.com/jeanluccaia/motoria-pro.git`
3. Confirmar rootDirectory via API (ver acima)
4. Fazer deploy manual: `vercel --prod`

---

## IDs do projeto (referência)

| Campo | Valor |
|---|---|
| Project ID | `prj_LJAeqhUOfrgce7E9IJagNheSlrAg` |
| Org/Team ID | `team_Q3kDg5E88TEpGM0MiAuYNQzr` |
| GitHub repo | `jeanluccaia/motoria-pro` |
| Production branch | `main` |
| Domínio produção | `https://pattamansa.com.br` |
