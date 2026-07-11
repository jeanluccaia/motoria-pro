# 09 — Conteúdo e materiais

**Última atualização:** 2026-07-11
**Responsável:** Marca + operação das unidades + André (vídeo institucional)
**Status:** Parcial — materiais oficiais pendentes

---

## Resumo

Este documento lista os materiais (foto, vídeo, texto) necessários por unidade e institucionalmente. Separa o que **já existe no repositório** do que **ainda precisa ser produzido**.

Fontes:

- `public/assets/images/` — pasta de imagens do site.
- `public/hero.mp4` — vídeo hero provisório.
- `PENDENCIAS.md`, `AUDIT.md`, `CHANGELOG.md`.
- `src/lib/supabase.ts` (`foto_capa`, `galeria`).

---

## Materiais por unidade (checklist)

Para cada unidade, o pacote mínimo esperado é:

1. **Foto da fachada.**
2. **Uma foto da área de musculação.**
3. **Uma foto da área de cardio.**
4. **Uma foto de aula coletiva.**
5. **Três ou quatro fotos adicionais** para a página individual.
6. **Endereço** completo (já cadastrado — ver `03-unidades.md`).
7. **Telefone** (já cadastrado como WhatsApp).
8. **WhatsApp** (cadastrado).
9. **Horários** (cadastrados).
10. **Redes sociais** — Instagram próprio (apenas Vila Industrial cadastrado).
11. **Diferenciais locais** — o que essa unidade oferece que as outras não têm.
12. **Depoimentos** — de alunos e gestores (quando existirem).
13. **Estacionamento** — presença, formato (rotativo, pago, quantidade).
14. **Acessibilidade** — presença de rampa, elevador, banheiro adaptado.

---

## Materiais atualmente disponíveis no repositório

Pasta `public/assets/images/`:

| Arquivo | Uso atual |
| ------- | --------- |
| `hero-gym-desktop.png` | Hero da Home (desktop). |
| `hero-gym-mobile.png` | Hero da Home (mobile). |
| `real-facade.jpg` | Foto de fachada usada em páginas (Hero das franquias, Home das unidades, cover de várias). |
| `real-machines.jpg` | Ambiente de musculação (usada em fallback e cards). |
| `real-weights.jpg` | Ambiente de pesos livres. |
| `real-opening.jpg` | Foto de abertura/inauguração. |
| `studio-community.jpg` | Foto de comunidade / aulas coletivas. |
| `training-modalities.png` | Ilustração da página `/modalidades`. |
| `campaign-gym-16x9.png` | Card social 16:9 usado no OG das páginas de unidade e matrícula. |
| `loudfit-logo-official-lockup-yellow.png` | Logotipo oficial (lockup). |
| `loudfit-logo-official-symbol-yellow.png` | Símbolo oficial. |

Pasta `public/`:

| Arquivo | Uso |
| ------- | --- |
| `hero.mp4` | Vídeo institucional provisório. **Deve ser substituído**. |
| `og-loudfit-logo-v3.jpg` | OG Image da Home. |
| `favicon.ico` | Favicon. |

**Nenhuma foto por unidade específica** foi localizada no repositório (todas as unidades reutilizam os mesmos assets `real-*` como `foto_capa` e `galeria`). Ver `PENDENCIAS.md`.

---

## Fotos por unidade (status)

| Unidade | Fotos oficiais recebidas | Foto de capa (fallback atual) |
| ------- | ------------------------ | ---------------------------- |
| Carrefour Valinhos | Não | `/assets/images/studio-community.jpg` |
| Amoreiras | Não | `/assets/images/real-facade.jpg` |
| Anchieta SP | Não | `/assets/images/real-weights.jpg` |
| Vila Industrial | Não | `/assets/images/real-machines.jpg` |
| Mogi Mirim | Não | `/assets/images/real-opening.jpg` |
| Ipiranga | Não | `/assets/images/real-machines.jpg` |

**Prioridade:** Vila Industrial (unidade âncora) → Carrefour Valinhos → Amoreiras → Anchieta SP → Mogi Mirim → Ipiranga (após inauguração).

---

## Vídeo institucional

- Arquivo atual: `public/hero.mp4` — **provisório**.
- Componente que usa: `src/components/sections/BrandVideo.tsx`.
- **Responsável informado:** André.
- **Utilização prevista:**
  - Hero institucional.
  - Página `/sobre`.
- **Versões esperadas:**
  - **Desktop** — proporção 16:9 ou similar, foco em ambiente amplo.
  - **Mobile** — 9:16 ou 1:1 com corte apropriado.
  - **Poster de fallback** — imagem para o `poster=` do vídeo.
  - **Legenda** — pt-BR, para acessibilidade e uso em mudo.
- **Otimização:**
  - Compressão para web (`H.264` ou `AV1`).
  - Bitrate razoável para carregamento rápido em 4G.
  - `preload="metadata"` no elemento `<video>` para não penalizar LCP.

Sobre o hero atual (`public/hero.mp4`, 3 MB) — está funcional, mas o `AUDIT.md` já sinaliza a necessidade de substituição por material melhor da unidade.

---

## Material institucional adicional

| Material | Estado |
| -------- | ------ |
| Logotipo oficial (lockup e símbolo) | Presente em `public/assets/images/`. |
| OG Image geral | Presente (`og-loudfit-logo-v3.jpg`). |
| OG Image por página | Home usa OG próprio; páginas internas usam `/opengraph-image` gerado dinamicamente. |
| Fotos dos fundadores | `NÃO LOCALIZADO NO REPOSITÓRIO`. Placeholder LF em `/sobre`. |
| Depoimentos em vídeo | `NÃO LOCALIZADO NO REPOSITÓRIO`. |
| Depoimentos em texto | Estrutura existe (`getTestimonials` em `src/lib/supabase.ts`) mas sem depoimentos no banco. |
| PDF do Guia de Aulas | `NÃO LOCALIZADO NO REPOSITÓRIO`. |
| Kit de imprensa | `NÃO LOCALIZADO NO REPOSITÓRIO`. |
| Manual de marca completo | `NÃO LOCALIZADO NO REPOSITÓRIO` (existe `docs/PRD_LOUDFIT.md` como orientação de marca no site). |

---

## Materiais pendentes por unidade (resumo)

- **Fotos oficiais** por unidade (fachada, musculação, cardio, aulas coletivas + adicionais).
- **Grade oficial de aulas coletivas** para Ipiranga e Anchieta SP (hoje `modalidades: []`).
- **Instagram próprio** por unidade (apenas Vila Industrial cadastrado).
- **Google Maps URL** e **Place ID** por unidade — dependem da conclusão do processo GBP.
- **Foto do gestor / recepção** para reforço humano na página da unidade.
- **Depoimentos** locais de alunos.
- **Vídeo curto (15–30s)** por unidade — a decidir com marketing.

---

## Materiais que já podem ser reutilizados

- Fotos genéricas `real-facade`, `real-machines`, `real-weights`, `real-opening`, `studio-community` seguem servindo como **fallback aceitável** até chegarem materiais oficiais.
- Ilustração `training-modalities.png` cobre a página `/modalidades`.
- OG genérico da Home cobre metadados sociais globais.

---

## Classificação clara

**Materiais recebidos:** logotipo oficial, imagens genéricas de ambiente, favicon.

**Materiais pendentes:** fotos por unidade, vídeo institucional oficial, fotos dos fundadores, depoimentos, grades específicas de aulas.

**Materiais encontrados no repositório:** os arquivos listados na seção "Materiais atualmente disponíveis".

**Materiais que precisam ser produzidos:** sessão de fotos por unidade (fachada + interior), vídeo institucional (desktop e mobile), fotos dos fundadores para `/sobre`, materiais de campanha Day Use (ver `06-campanha-day-use.md`).

---

## Diretrizes de qualidade

Para fotos:

- Resolução mínima **1920×1280** para uso desktop.
- Formato **JPG** (fotos) ou **WebP/AVIF** (otimização web).
- Iluminação natural preferível; fugir de flashes duros e fotos amareladas.
- Enquadramento honesto — mostrar o ambiente real, não apenas cantos vazios.
- Uploads na pasta `public/assets/images/[slug-da-unidade]/` ou no bucket Supabase (`supabase.co/storage/v1/object/public/...`).

Para vídeos:

- Compressão para menor tamanho possível sem perder identidade.
- Sempre gerar poster.
- Sempre ter legenda oculta (`<track>` VTT).
- Manter versão mobile 9:16 curta (15–30s) para uso em Stories/Reels.

Para textos:

- Copy alinhada a `01-marca-e-posicionamento.md`.
- Diferenciais em frases curtas.
- Sem exageros ou termos jurídicos duvidosos.

---

## Próximas ações

- Definir cronograma de sessão de fotos por unidade.
- Receber vídeo institucional final com o André e substituir `public/hero.mp4`.
- Coletar depoimentos autorizados (aluno + gestor) por unidade.
- Trocar fotos placeholder na `/sobre` (fundadores).
- Padronizar diretório de assets por unidade (ex.: `public/assets/images/[slug]/`).
- Criar checklist rápido para novas unidades (materiais mínimos antes do go-live).
