# VISUAL DIRECTION — LoudFit Digital

> Data: 2026-07-03
> Objetivo: traduzir a identidade das artes do Instagram para o site — esportivo, tecnológico, comercial.

---

## Auditoria: o que ainda parece IA

| Área | Problema |
|---|---|
| **Hero R$9,90** | `border-l-2` sidebar visual — fraco, não tem presença de campanha |
| **Aulas coletivas** | Chips brancos com borda cinza — genérico, parece lista de tags de blog |
| **Seção Aulas** | `bg="lighter"` light — sem contraste, parece formulário de dashboard |
| **Cards Planos não-destacados** | Hover sem personalidade LoudFit |
| **Video container** | Container sem identidade — parece embed cru |
| **Horários na unidade** | Tabela branca sem marcação — anônima |
| **Amarelo `#F2E205`** | Levemente amarronzado — não tem o punch das artes Instagram |
| **Footer labels** | `tracking-widest` exagerado — parece template |
| **Section labels** | `tracking-[0.18em]` — excessivo |
| **Falta** | Qualquer elemento diagonal ou linha técnica LoudFit |

---

## Tokens visuais atualizados

| Token | Antes | Depois | Motivo |
|---|---|---|---|
| `--lf-volt` | `#F2E205` | `#FFE500` | Mais punch, mais próximo das artes |
| `--lf-volt-deep` | `#D4C804` | `#D4B800` | Ajustado ao novo volt |
| `--lf-black` | `#090909` | `#080808` | Mais profundo |

---

## Elementos criados

### Diagonal LoudFit
- Hero: barra amarela 3px com `-skew-x-12` no rodapé → linha técnica de identidade
- Video container: triângulo CSS border-trick no canto superior direito (`border-t-lf-volt`)
- UnitCard: triângulo CSS no canto superior esquerdo

### Bloco R$9,90 (Hero)
- Substituído `border-l-2` por bloco amarelo com texto preto + leve `-skew-x-3`
- Mais próximo das artes do Instagram (faixa amarela, fonte preta, corte diagonal)

### Pills de Aulas
- Seção mudada para `bg="graphite"` (escuro)
- Pills: fundo escuro, borda `lf-line`, sem `rounded-full` (angular = esportivo)
- Hover: fundo `lf-volt`, texto `lf-black`

### Horários na página de unidade
- Card redesenhado: `bg-lf-black` com barra vertical volt e rows separadas por `border-lf-line`
- Leitura clara: dia em `lf-muted`, hora em `lf-text bold`

### Plan card destaque hover
- `shadow-[0_4px_0_0_#FFE500]` — sombra amarela bottom no hover

### Video container
- `border-l-2 border-lf-volt` lateral esquerda
- Triângulo diagonal volt no canto superior direito

---

## Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| `src/app/globals.css` | Tokens de cor volt e black |
| `src/components/sections/Hero.tsx` | Bloco R$9,90 + diagonal bottom |
| `src/components/sections/BrandVideo.tsx` | Título, container premium, diagonal corner |
| `src/components/sections/CollectiveClassesSection.tsx` | Dark bg, pills angulares |
| `src/components/ui/PlanCard.tsx` | Hover volt shadow no não-destacado |
| `src/components/ui/UnitCard.tsx` | Diagonal corner mark |
| `src/components/ui/Section.tsx` | Label tracking reduzido |
| `src/app/unidades/[slug]/page.tsx` | Horários card redesenhado |
| `src/components/layout/Footer.tsx` | Tracking de labels |

---

## Regras comerciais — TODAS PRESERVADAS

- Preços intactos
- Planos intactos
- R$9,90 apenas no Power Anual Recorrente
- Checkouts EVO intactos
- Rotas intactas
- Status das unidades intactos
- Horários intactos
- "O melhor ainda está por vir." preservado
