# Pendências LoudFit

- Confirmar WhatsApp oficial da unidade Ipiranga antes de exibir atendimento por WhatsApp nessa unidade.
- Confirmar endereços completos das unidades Carrefour Valinhos, Amoreiras, Vila Industrial e Mogi Mirim caso devam aparecer além das informações já cadastradas.
- Confirmar modalidades/aulas coletivas oficiais das unidades Ipiranga e Anchieta SP; os dados atuais estão vazios e a interface oculta chips inexistentes.
- Substituir fotos provisórias por fotos oficiais específicas de cada unidade quando o material final estiver disponível.
- Substituir o vídeo provisório da home pelo vídeo oficial final, mantendo arquivo otimizado para web.
- Confirmar apontamento do domínio oficial `loudfit.com.br`; enquanto isso a canonical/OG usa a produção atual `loudfit.vercel.app`.
- Confirmar com W12/EVO se haverá deep-link oficial para pré-seleção de plano no checkout.
- Configurar `FRANCHISE_LEAD_WEBHOOK_URL` ou outro provedor recuperável para envio automático dos leads de franquia; enquanto isso a API tenta Supabase e o formulário mostra contato direto se o envio não for confirmado.

## Tracking (Fase 4)

- Configurar `NEXT_PUBLIC_GA4_ID` na Vercel (Production). Enquanto ausente, o snippet do GA4 não é injetado — nenhum evento GA4 sai.
- Configurar `NEXT_PUBLIC_META_PIXEL_ID` na Vercel (Production). Enquanto ausente, o Pixel não é injetado — nenhum evento Meta sai.
- Google Ads: quando as campanhas forem publicadas, decidir entre importar conversões via GA4 (recomendado) ou instalar o gtag do Ads (`AW-XXXXXX`) com labels próprios. Se optar pelo gtag direto, prever `NEXT_PUBLIC_GOOGLE_ADS_ID` e adicionar `send_to` nos eventos-alvo (`begin_checkout`, `lead_campaign`, `lead_franchise`).
- **Evento `purchase`: não implementado.** A EVO controla o checkout dentro de iframe; não temos callback, webhook ou página de sucesso confiável do lado da Loud Fit hoje. Confirmar com a W12/EVO se é possível: (a) postar mensagem via `postMessage` do iframe para a origem `loudfit.vercel.app` no sucesso; (b) redirecionar pra uma página `/matricula/sucesso` do site após confirmação; (c) instalar tag de conversão dentro do próprio checkout EVO. Enquanto nenhuma dessas opções existir, a mensuração encerra em `begin_checkout` — o Google Ads pode usar esse evento como conversão-secundária.
- Day Use: nenhum CTA de Day Use existe hoje no site — `day_use_click` só será implementado quando houver o fluxo real. Decisão operacional: definir se a Loud Fit vai comercializar Day Use e onde ficará o CTA.
- Consentimento LGPD: banner ativo no primeiro acesso; permite aceitar / rejeitar / configurar por categoria. Textos da `politica-de-privacidade` podem precisar de revisão jurídica antes de campanhas grandes, especialmente se houver alguma prática de retargeting mais agressiva a ser adicionada.
