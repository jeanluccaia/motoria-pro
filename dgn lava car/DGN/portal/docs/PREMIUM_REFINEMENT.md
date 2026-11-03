# Portal DGN — refinamento comercial

Trabalho no portal original `DGN/portal`, em worktree isolado na branch `feat/portal-premium-refinement`, a partir de `7a3973b` da branch `feat/agent-core-foundation`. Nenhuma alteração foi aplicada à cópia servida nas portas 3000/3100.

## Apresentação e navegação

- Visão Geral: indicadores agrupados, fila de ações com situação e acesso direto, atalhos comerciais e alertas operacionais secundários. Ausência de leitura é tratada como indisponibilidade.
- Oportunidades: recomendações, motivos e próximos passos legíveis; etapas separadas de revisão, aprovação, execução registrada e rejeição, consultando os estados já existentes.
- Clientes e curadoria: títulos e filtros claros, busca identificada, textos de interface reduzidos e ficha acessível.
- Assinantes: busca por cliente/veículo preserva os filtros existentes; tabela se adapta ao espaço disponível, com leitura vertical em celular e notebook.
- Ficha 360°: atalhos para dados, contratos, veículos, agenda e acesso; linguagem profissional e oferta de planos com rolagem interna no celular.
- Frotas e portal corporativo: contagens e situações operacionais consistentes, dados de veículos e solicitações preservados, mensagens de acesso sem termos de implementação.
- Reconciliação e Diagnósticos foram movidos da navegação Principal para Sistema, preservando rotas, ícones, links operacionais e comportamento do menu.
- Reconciliação: seleção real de CSV/TSV pelo navegador, alternativa de colagem, análise, divergências, revisão e confirmação explícita. O conteúdo continua sendo enviado ao analisador existente. Trocar os dados invalida a análise e a seleção anteriores.

## Preservação funcional

Sem mudanças em APIs, schemas, migrations, RPCs, autenticação, cookies, HMAC, políticas de agentes, catálogo/preços, processamento financeiro ou regras de agendamento. Sem novas dependências. Sem deploy, push, merge ou gravações comerciais durante a validação.

## Validação e reprodução

Executar os comandos no diretório `DGN/portal` deste worktree, com o ambiente local configurado. Os arquivos de ambiente e as capturas operacionais não são versionados.

```powershell
node node_modules/typescript/bin/tsc --noEmit
npm.cmd test
node scripts/premium-ui-render-check.mjs
npm.cmd run build -- --webpack
node node_modules/next/dist/bin/next start --port 3200 --hostname 127.0.0.1
node scripts/premium-visual-qa.mjs after
node scripts/premium-interaction-qa.mjs
node scripts/premium-comparison.mjs
```

- Suíte existente: 891 testes aprovados.
- Renderização isolada: cinco estados das ações comerciais, com controles de decisão restritos aos estados apropriados e histórico sem ações indevidas.
- Playwright: 1440, 1024 e 390 px; navegação, seleção de arquivo e análise real sem alterações; revisão cancelável e invalidação de seleção em fixture isolada; busca, filtros e ficha; modal da oferta e etapas comerciais.
- As rotas de escrita comercial ficam bloqueadas no navegador do teste de interação. As fixtures de revisão existem apenas nesse contexto de teste, sem contato com o banco. Não são utilizadas nas capturas do comparativo principal.
- Evidências e relatórios: `artifacts/premium/before`, `after`, `interactions`, `unit-tests.log` e `comparison.html`.

## Limites observados

A fonte consultada retornou indisponibilidade das tabelas de ações e frotas. O refinamento mostra esse estado real. As decisões reais de aprovação/execução e confirmação/contraproposta corporativa não foram exercitadas contra o banco. A área `/empresa` foi validada sem sessão corporativa; o conteúdo autenticado do gestor permanece dependente de um vínculo real disponível. As regras desses módulos são cobertas pela suíte existente.

A captura inicial de oportunidades registrou uma falha transitória de manifesto no servidor de desenvolvimento. A captura final é feita com o build local e não usa esse servidor para validar o resultado.

Preview local: `http://localhost:3200/admin/growth`. A senha configurada é exclusiva do ambiente isolado e fica no arquivo local de ambiente; não altera o acesso do Diego.
