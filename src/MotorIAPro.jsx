import React from "react";
import { useState, useEffect, useRef } from "react";

// System prompts movidos para api/_prompts.js (servidor).
// O frontend envia apenas o identificador da ferramenta — nunca o prompt completo.


const TOOLS = [
  {
    id: "bio",
    icon: "◈",
    label: "Quero melhorar minha bio",
    tabLabel: "Bio",
    sub: "Relaxa — a IA reescreve pra você em segundos",
    free: true,
    buttonLabel: "Gerar resposta agora",
  },
  {
    id: "gancho",
    icon: "◉",
    label: "Quero criar um post",
    tabLabel: "Post",
    sub: "É só contar o que você quer — ela cria pra você",
    free: true,
    buttonLabel: "Gerar resposta agora",
  },
  {
    id: "cta",
    icon: "◎",
    label: "Quero responder um cliente",
    tabLabel: "Clientes",
    sub: "Não precisa pensar — só copiar e enviar",
    free: true,
    buttonLabel: "Gerar resposta agora",
  },
  {
    id: "funil",
    icon: "◆",
    label: "Quero vender um produto",
    tabLabel: "Vendas",
    sub: "Do começo ao fim — organizado e pronto",
    free: false,
    buttonLabel: "🔒 Gerar resposta agora",
  },
  {
    id: "stories",
    icon: "◇",
    label: "Quero ideias prontas",
    tabLabel: "Ideias",
    sub: "O que falar, como falar — só apertar REC",
    free: false,
    buttonLabel: "🔒 Gerar resposta agora",
  },
  {
    id: "emails",
    icon: "◻",
    label: "Quero uma legenda",
    tabLabel: "Legenda",
    sub: "Legendas completas com hashtags prontas",
    free: false,
    buttonLabel: "🔒 Gerar resposta agora",
  },
];

const PLACEHOLDERS = {
  bio: "Descreva seu negócio em poucas palavras",
  gancho: "Ex: Quero escrever sobre como economizei tempo usando IA no trabalho",
  cta: "Cole a mensagem do cliente aqui",
  funil: "Escreva o que você vende em uma frase",
  stories: "Ex: Quero gravar um vídeo mostrando como uso IA no meu dia a dia",
  emails: "Ex: Quero mandar mensagens pra reconquistar clientes antigos",
};

const EXAMPLES = {
  bio: "Sou professora e quero me apresentar melhor nas redes sociais",
  gancho: "Quero escrever sobre como economizei tempo usando IA no trabalho",
  cta: "Quero convencer alguém a agendar uma reunião comigo",
  funil: "Quero organizar um plano pra lançar um produto digital de R$27",
  stories: "Quero gravar um vídeo mostrando como uso IA no meu dia a dia",
  emails: "Quero mandar mensagens pra reconquistar clientes antigos",
};

const NEXT_STEPS = {
  bio: "Cola essa apresentação onde você precisar — perfil, site ou currículo.",
  gancho: "Usa a abertura no início do seu texto ou nos primeiros segundos do vídeo.",
  cta: "Copia e envia agora — no WhatsApp, e-mail ou onde for.",
  funil: "Começa pelo passo 1 hoje e veja a reação de quem vai receber.",
  stories: "Grava as partes em sequência — sem tentar ficar perfeito.",
  emails: "Envia a primeira mensagem hoje e acompanha o que acontece.",
};

const INTENTS = [
  {
    id: "reply",
    emoji: "💬",
    label: "Quero responder um cliente",
    desc: "Não sabe o que falar? Cola a mensagem e sai pronto",
    tool: "cta",
  },
  {
    id: "sell",
    emoji: "💰",
    label: "Quero vender um produto",
    desc: "Você descreve o que vende — a IA monta o plano",
    tool: "funil",
  },
  {
    id: "write",
    emoji: "✍️",
    label: "Quero criar um post",
    desc: "Sem travar, sem pensar muito — pronto em segundos",
    tool: "gancho",
  },
  {
    id: "improve",
    emoji: "⚡",
    label: "Quero melhorar minha bio",
    desc: "Bio, descrição, apresentação — reescrita na hora",
    tool: "bio",
  },
  {
    id: "ideas",
    emoji: "💡",
    label: "Quero ideias prontas",
    desc: "Você descreve o objetivo — a IA organiza tudo",
    tool: "stories",
  },
  {
    id: "caption",
    emoji: "📱",
    label: "Quero uma legenda",
    desc: "Ela cria a legenda pra você — frase por frase",
    tool: "gancho",
  },
];

const CATEGORIES = [
  {
    id: "preco",
    emoji: "😬",
    title: "Cliente falou que tá caro. O que responder?",
    sub: "Respostas prontas para contornar objeção de preço",
    libTool: "cta",
    libSearch: "caro",
  },
  {
    id: "sumiu",
    emoji: "👻",
    title: "Mandei o preço e o cliente sumiu. O que faço?",
    sub: "Como reativar sem parecer desesperado",
    libTool: "cta",
    libSearch: "sumiu",
  },
  {
    id: "post",
    emoji: "🔥",
    title: "Não sei o que postar. Preciso de algo pra hoje",
    sub: "Textos completos prontos para publicar agora",
    libTool: "gancho",
    libSearch: "",
  },
  {
    id: "venda",
    emoji: "💰",
    title: "Tenho um produto mas não sei como vender",
    sub: "5 dias de estratégia com copy pronta para executar",
    libTool: "funil",
    libSearch: "",
  },
  {
    id: "bio",
    emoji: "⚡",
    title: "Minha bio não convence ninguém. Preciso mudar",
    sub: "3 versões completas + psicologia de cada uma",
    libTool: "bio",
    libSearch: "",
  },
  {
    id: "video",
    emoji: "🎬",
    title: "Quero gravar um vídeo mas não sei o que falar",
    sub: "Roteiro frase por frase — só apertar REC",
    libTool: "stories",
    libSearch: "",
  },
  {
    id: "legenda",
    emoji: "📱",
    title: "Preciso de uma legenda que faça a pessoa comentar",
    sub: "4 versões com hashtags e horário ideal",
    libTool: "gancho",
    libSearch: "legenda",
  },
  {
    id: "reclamacao",
    emoji: "🤝",
    title: "Um cliente reclamou e não sei como responder",
    sub: "Mensagens completas que resolvem o conflito",
    libTool: "cta",
    libSearch: "reclamou",
  },
];

const GUIDED_FLOWS = [
  {
    id: "instagram",
    emoji: "📸",
    title: "Conteúdo para Instagram",
    sub: "Post completo: carrossel, legenda, CTA e hashtags",
    highlight: false,
    fields: [
      { key: "nicho", label: "Qual é o seu nicho ou área?", placeholder: "Ex: fitness, moda, culinária, marketing digital, beleza..." },
      { key: "produto", label: "O que você vende ou quer divulgar?", placeholder: "Ex: treinos online, roupas plus size, aulas de inglês, curso..." },
      { key: "tom", label: "Qual tom você quer?", type: "select", options: ["Simples e humano", "Viral e provocador", "Profissional", "Direto e vendedor"] },
    ],
    promptKey: "guided_instagram",
  },
  {
    id: "anuncio",
    emoji: "📣",
    title: "Criar um anúncio",
    sub: "Copy pronta para Facebook, Instagram ou WhatsApp",
    highlight: false,
    fields: [
      { key: "produto", label: "O que você está anunciando?", placeholder: "Ex: consultoria, curso online, produto de beleza, serviço..." },
      { key: "publico", label: "Para quem é esse anúncio?", placeholder: "Ex: mães de 25-40 anos que querem emagrecer" },
      { key: "objetivo", label: "O que você quer que a pessoa faça?", placeholder: "Ex: clicar no link, mandar mensagem no WhatsApp, comprar" },
    ],
    promptKey: "guided_anuncio",
  },
  {
    id: "paginavendas",
    emoji: "🛒",
    title: "Página de vendas",
    sub: "Texto completo: headline, copy, garantia e CTA",
    highlight: false,
    fields: [
      { key: "produto", label: "O que você está vendendo?", placeholder: "Ex: curso online, consultoria, produto físico, mentoria..." },
      { key: "preco", label: "Qual é o preço?", placeholder: "Ex: R$97, R$297, R$47..." },
      { key: "publico", label: "Quem compra isso?", placeholder: "Ex: empreendedores iniciantes, mulheres que querem emagrecer..." },
    ],
    promptKey: "guided_paginavendas",
  },
  {
    id: "bio",
    emoji: "✨",
    title: "Bio/Perfil profissional",
    sub: "3 versões completas com explicação de cada uma",
    highlight: false,
    fields: [
      { key: "profissao", label: "O que você faz?", placeholder: "Ex: sou cabeleireira, personal trainer, vendo roupas online..." },
      { key: "resultado", label: "Qual resultado você entrega?", placeholder: "Ex: cabelo saudável, emagrecer 5kg, estilo que combina comigo..." },
    ],
    promptKey: "bio",
  },
  {
    id: "negocio",
    emoji: "💡",
    title: "Ideia de negócio",
    sub: "Da ideia ao primeiro cliente — passo a passo prático",
    highlight: false,
    fields: [
      { key: "interesse", label: "O que você sabe fazer ou gosta muito?", placeholder: "Ex: cozinhar, ensinar, organizar, vender, cuidar de pessoas, artesanato..." },
      { key: "recursos", label: "O que você tem pra começar?", placeholder: "Ex: só tempo livre, até R$500, tenho celular e Instagram..." },
    ],
    promptKey: "guided_negocio",
  },
  {
    id: "copy",
    emoji: "💬",
    title: "Copy de vendas",
    sub: "Mensagem de venda pronta para WhatsApp ou DM",
    highlight: false,
    fields: [
      { key: "produto", label: "O que você está vendendo?", placeholder: "Ex: consultoria, produto de beleza, serviço de design..." },
      { key: "preco", label: "Qual o valor?", placeholder: "Ex: R$197" },
      { key: "objecao", label: "Qual a maior dúvida do cliente?", placeholder: "Ex: se vai funcionar pra mim, se vale o preço, se tenho tempo..." },
    ],
    promptKey: "guided_copy",
  },
  {
    id: "roteiro",
    emoji: "🎬",
    title: "Roteiro de vídeo",
    sub: "Fala completa para gravar hoje — frase por frase",
    highlight: false,
    fields: [
      { key: "tema", label: "Qual o assunto do vídeo?", placeholder: "Ex: como emagreci 10kg, como ganho dinheiro online, 3 erros que cometi..." },
      { key: "plataforma", label: "Onde vai publicar?", type: "select", options: ["Instagram Reels", "TikTok", "YouTube Shorts", "Stories"] },
      { key: "objetivo", label: "Qual o objetivo?", type: "select", options: ["Engajamento (curtidas/comentários)", "Ganhar seguidores", "Vender algo", "Mostrar autoridade"] },
    ],
    promptKey: "guided_roteiro",
  },
  {
    id: "iniciante",
    emoji: "🚀",
    title: "Modo iniciante extremo",
    sub: "Escreve 1 frase. A IA monta tudo do zero pra você",
    highlight: true,
    fields: [
      { key: "ideia", label: "Escreve o que você quer em uma frase:", placeholder: 'Ex: "Quero ganhar dinheiro com roupas", "Quero crescer no Instagram", "Quero vender cursos online"...', rows: 3 },
    ],
    promptKey: "guided_iniciante",
  },
];

const QUICK_MODELS = [
  { id: "post-viral", label: "Post viral", flowId: "instagram", inputs: { tom: "Viral e provocador" } },
  { id: "anuncio-vende", label: "Anúncio que vende", flowId: "anuncio", inputs: {} },
  { id: "bio-pro", label: "Bio profissional", flowId: "bio", inputs: {} },
  { id: "oferta", label: "Oferta irresistível", flowId: "copy", inputs: {} },
  { id: "roteiro-reels", label: "Roteiro de Reels", flowId: "roteiro", inputs: { plataforma: "Instagram Reels", objetivo: "Engajamento (curtidas/comentários)" } },
  { id: "ideia-negocio", label: "Ideia de negócio", flowId: "negocio", inputs: {} },
];

const NAV_CATEGORIES = [
  { id: "todos",     label: "✦ Todos" },
  { id: "instagram", label: "📸 Instagram", flows: ["instagram", "roteiro", "bio"] },
  { id: "conteudo",  label: "✏️ Conteúdo",  flows: ["instagram", "roteiro"] },
  { id: "vendas",    label: "💰 Vendas",     flows: ["copy", "anuncio", "paginavendas"] },
  { id: "anuncios",  label: "📣 Anúncios",   flows: ["anuncio"] },
  { id: "negocios",  label: "💡 Negócios",   flows: ["negocio", "paginavendas"] },
  { id: "iniciante", label: "🚀 Iniciante",  flows: ["iniciante"] },
];

const TRUST_COPIES = [
  "Pronto pra usar — só copia e aplica",
  "Gerado em segundos — sem esforço nenhum",
  "Funciona pra qualquer área, qualquer pessoa",
  "Isso pode te poupar horas de trabalho",
];

const SOCIAL_PROOF = [
  { emoji: "⭐", text: "Usei isso e já resolvi o que precisava hoje" },
  { emoji: "🙌", text: "Finalmente consigo escrever sem travar" },
  { emoji: "🔥", text: "Isso aqui facilita muito o meu dia a dia" },
];

const PROMPT_LIBRARY = [
  // ── BIO ──
  { tool:"bio", cat:"Saúde & Bem-estar", text:"Sou personal trainer e quero uma bio que atraia pessoas que querem emagrecer de verdade" },
  { tool:"bio", cat:"Saúde & Bem-estar", text:"Sou nutricionista e atendo online, quero parecer acessível e confiável ao mesmo tempo" },
  { tool:"bio", cat:"Saúde & Bem-estar", text:"Sou coach de emagrecimento e quero mostrar resultados reais sem exagerar" },
  { tool:"bio", cat:"Saúde & Bem-estar", text:"Sou médica e quero humanizar meu perfil no Instagram sem perder autoridade" },
  { tool:"bio", cat:"Saúde & Bem-estar", text:"Sou dentista e quero atrair pacientes para clareamento e estética dental" },
  { tool:"bio", cat:"Saúde & Bem-estar", text:"Sou psicóloga e quero uma bio que transmita acolhimento e profissionalismo" },
  { tool:"bio", cat:"Saúde & Bem-estar", text:"Sou enfermeira e quero mostrar autoridade na área sem ser fria" },
  { tool:"bio", cat:"Saúde & Bem-estar", text:"Sou massoterapeuta e quero atrair clientes pelo WhatsApp e Instagram" },
  { tool:"bio", cat:"Saúde & Bem-estar", text:"Sou professora de yoga e quero alcançar pessoas iniciantes que nunca tentaram" },
  { tool:"bio", cat:"Saúde & Bem-estar", text:"Sou farmacêutica e quero explicar o que faço de forma simples e atrativa" },
  { tool:"bio", cat:"Saúde & Bem-estar", text:"Sou terapeuta holística e quero explicar meu trabalho sem afastar céticos" },
  { tool:"bio", cat:"Saúde & Bem-estar", text:"Sou doula e quero alcançar gestantes no Instagram com uma bio acolhedora" },
  { tool:"bio", cat:"Negócios & Vendas", text:"Vendo roupas femininas pelo Instagram e quero uma bio que converta visita em venda" },
  { tool:"bio", cat:"Negócios & Vendas", text:"Sou corretor de imóveis e quero me apresentar melhor para compradores de primeiro imóvel" },
  { tool:"bio", cat:"Negócios & Vendas", text:"Tenho uma loja de cosméticos e quero atrair revendedoras pelo Instagram" },
  { tool:"bio", cat:"Negócios & Vendas", text:"Sou representante comercial e quero uma bio profissional para o LinkedIn" },
  { tool:"bio", cat:"Negócios & Vendas", text:"Trabalho com marketing digital e quero mostrar resultado sem parecer vendedor chato" },
  { tool:"bio", cat:"Negócios & Vendas", text:"Sou gestora de tráfego pago e quero atrair pequenos negócios locais como clientes" },
  { tool:"bio", cat:"Negócios & Vendas", text:"Vendo brigadeiros artesanais e quero parecer premium para encomendas maiores" },
  { tool:"bio", cat:"Negócios & Vendas", text:"Tenho uma loja de roupas infantis e quero uma bio que fale direto com as mães" },
  { tool:"bio", cat:"Negócios & Vendas", text:"Sou afiliado digital e quero parecer confiável sem parecer spam" },
  { tool:"bio", cat:"Negócios & Vendas", text:"Faço bolos personalizados e quero atrair festas de casamento e aniversários" },
  { tool:"bio", cat:"Negócios & Vendas", text:"Sou vendedora de colchões e quero uma bio mais interessante e menos genérica" },
  { tool:"bio", cat:"Educação", text:"Sou professor de inglês e quero atrair adultos iniciantes que nunca estudaram" },
  { tool:"bio", cat:"Educação", text:"Sou professora de matemática e quero ajudar vestibulandos a não ter medo da matéria" },
  { tool:"bio", cat:"Educação", text:"Dou aulas de violão online e quero atrair adultos que acham que é tarde demais" },
  { tool:"bio", cat:"Educação", text:"Ensino culinária online e quero crescer no Instagram com uma bio irresistível" },
  { tool:"bio", cat:"Educação", text:"Sou professora de espanhol e atendo pelo Zoom, quero uma bio que passe credibilidade" },
  { tool:"bio", cat:"Educação", text:"Ensino Excel do zero e quero atrair profissionais que querem se destacar no trabalho" },
  { tool:"bio", cat:"Educação", text:"Sou coach de carreira e atendo executivos que querem mudar de área" },
  { tool:"bio", cat:"Educação", text:"Sou tutora de concursos públicos e quero passar credibilidade e motivação" },
  { tool:"bio", cat:"Educação", text:"Ensino como usar IA no dia a dia para pessoas que nunca usaram tecnologia" },
  { tool:"bio", cat:"Criativo & Serviços", text:"Sou fotógrafo e quero uma bio que mostre meu estilo e atraia clientes para ensaio" },
  { tool:"bio", cat:"Criativo & Serviços", text:"Sou designer gráfico freelancer e quero atrair clientes pelo portfólio no Instagram" },
  { tool:"bio", cat:"Criativo & Serviços", text:"Sou videomaker e quero mostrar o que faço de forma simples e impactante" },
  { tool:"bio", cat:"Criativo & Serviços", text:"Sou arquiteto e quero atrair clientes residenciais pelo Instagram" },
  { tool:"bio", cat:"Criativo & Serviços", text:"Faço artesanato e quero vender mais pelas redes com uma bio autêntica" },
  { tool:"bio", cat:"Criativo & Serviços", text:"Sou tatuador e quero mostrar meu trabalho e estilo de forma atraente" },
  { tool:"bio", cat:"Criativo & Serviços", text:"Sou cabeleireira e quero atrair mais clientes para coloração e corte" },
  { tool:"bio", cat:"Criativo & Serviços", text:"Sou maquiadora e quero parecer mais profissional para noivas e festas" },
  { tool:"bio", cat:"Criativo & Serviços", text:"Sou DJ e quero conseguir mais eventos e festas pela bio do Instagram" },
  { tool:"bio", cat:"Criativo & Serviços", text:"Faço bolos personalizados e quero aparecer no Google e nas redes" },
  { tool:"bio", cat:"Criativo & Serviços", text:"Sou gerente de RH e quero um LinkedIn que impressione recrutadores" },
  { tool:"bio", cat:"Conteúdo & Redes", text:"Tenho uma conta de dicas de produtividade e quero crescer no Instagram" },
  { tool:"bio", cat:"Conteúdo & Redes", text:"Crio conteúdo sobre IA para iniciantes e quero uma bio que deixe isso claro" },
  { tool:"bio", cat:"Conteúdo & Redes", text:"Tenho um perfil de dicas financeiras e quero mais seguidores engajados" },
  { tool:"bio", cat:"Conteúdo & Redes", text:"Crio conteúdo motivacional e quero me profissionalizar" },
  { tool:"bio", cat:"Conteúdo & Redes", text:"Tenho uma conta de dicas de decoração e quero parecer referência" },
  { tool:"bio", cat:"Conteúdo & Redes", text:"Crio conteúdo para mães de primeira viagem com humor e leveza" },
  { tool:"bio", cat:"Conteúdo & Redes", text:"Tenho um perfil de culinária fit e quero crescer e atrair marcas" },
  { tool:"bio", cat:"Conteúdo & Redes", text:"Crio conteúdo sobre games e quero parcerias com marcas do nicho" },
  { tool:"bio", cat:"Situação Específica", text:"Acabei de mudar de carreira e quero me reapresentar sem explicar tudo" },
  { tool:"bio", cat:"Situação Específica", text:"Voltei a trabalhar depois da licença maternidade e quero uma bio atual" },
  { tool:"bio", cat:"Situação Específica", text:"Sou recém-formado e quero meu primeiro emprego com uma bio que impressione" },
  { tool:"bio", cat:"Situação Específica", text:"Mudei de cidade e quero reconstruir minha clientela do zero" },
  { tool:"bio", cat:"Situação Específica", text:"Minha área é muito técnica e quero explicar o que faço de forma simples" },
  { tool:"bio", cat:"Situação Específica", text:"Quero uma bio curta e direta que funcione bem no WhatsApp Business" },
  { tool:"bio", cat:"Situação Específica", text:"Tenho dois negócios diferentes e quero uma bio que una os dois" },
  { tool:"bio", cat:"Situação Específica", text:"Sou introvertido e quero uma bio que pareça natural sem forçar" },
  { tool:"bio", cat:"Situação Específica", text:"Quero uma bio que mostre personalidade sem parecer arrogante" },
  { tool:"bio", cat:"Situação Específica", text:"Sou profissional sênior e quero parecer atualizado sem forçar" },
  // ── GANCHO ──
  { tool:"gancho", cat:"Redes Sociais", text:"Quero escrever sobre como a IA me ajudou a economizar 3 horas por dia no trabalho" },
  { tool:"gancho", cat:"Redes Sociais", text:"Quero uma legenda para um post sobre meu antes e depois de emagrecer 10kg" },
  { tool:"gancho", cat:"Redes Sociais", text:"Quero escrever sobre como comecei do zero e hoje tenho minha própria empresa" },
  { tool:"gancho", cat:"Redes Sociais", text:"Quero uma legenda para anunciar que abri minha agenda de consultas" },
  { tool:"gancho", cat:"Redes Sociais", text:"Quero escrever sobre um erro que cometi nos negócios e o que aprendi com ele" },
  { tool:"gancho", cat:"Redes Sociais", text:"Quero uma legenda para post de sábado que motive meus seguidores a agir" },
  { tool:"gancho", cat:"Redes Sociais", text:"Quero escrever sobre como organizo minha semana com mais produtividade" },
  { tool:"gancho", cat:"Redes Sociais", text:"Quero uma legenda para um carrossel sobre 5 dicas de finanças pessoais" },
  { tool:"gancho", cat:"Redes Sociais", text:"Quero escrever sobre minha rotina matinal que mudou minha vida em 30 dias" },
  { tool:"gancho", cat:"Redes Sociais", text:"Quero uma legenda engajadora para post sobre saúde mental no trabalho" },
  { tool:"gancho", cat:"Redes Sociais", text:"Quero uma legenda para foto mostrando meu espaço de trabalho em casa" },
  { tool:"gancho", cat:"Redes Sociais", text:"Quero escrever sobre os bastidores do meu negócio de forma autêntica" },
  { tool:"gancho", cat:"Redes Sociais", text:"Quero uma legenda para post de encerramento do ano com reflexão" },
  { tool:"gancho", cat:"Redes Sociais", text:"Quero escrever sobre gratidão sem parecer artificial ou clichê" },
  { tool:"gancho", cat:"Redes Sociais", text:"Quero uma legenda para meu primeiro reels que apresenta meu perfil" },
  { tool:"gancho", cat:"Mensagens Profissionais", text:"Preciso escrever uma mensagem pedindo aumento para meu chefe de forma estratégica" },
  { tool:"gancho", cat:"Mensagens Profissionais", text:"Preciso de uma mensagem para apresentar meu serviço a um cliente que nunca me viu" },
  { tool:"gancho", cat:"Mensagens Profissionais", text:"Quero escrever um follow-up para cliente que recebeu proposta e não respondeu" },
  { tool:"gancho", cat:"Mensagens Profissionais", text:"Preciso de um texto para apresentar minha empresa em uma reunião de 2 minutos" },
  { tool:"gancho", cat:"Mensagens Profissionais", text:"Quero uma mensagem para pedir indicação a clientes que ficaram satisfeitos" },
  { tool:"gancho", cat:"Mensagens Profissionais", text:"Preciso escrever para um cliente insatisfeito sem perder a compostura" },
  { tool:"gancho", cat:"Mensagens Profissionais", text:"Quero um texto para cobrar uma fatura em atraso de forma educada e firme" },
  { tool:"gancho", cat:"Mensagens Profissionais", text:"Preciso de uma mensagem para declinar uma proposta mantendo a relação" },
  { tool:"gancho", cat:"Mensagens Profissionais", text:"Quero escrever um comunicado de reajuste de preços para clientes antigos" },
  { tool:"gancho", cat:"Mensagens Profissionais", text:"Preciso de um texto curto para meu status do WhatsApp Business" },
  { tool:"gancho", cat:"Conteúdo Educativo", text:"Quero escrever sobre os 3 erros que todo iniciante comete em vendas online" },
  { tool:"gancho", cat:"Conteúdo Educativo", text:"Quero uma legenda explicando o que é tráfego pago de forma simples" },
  { tool:"gancho", cat:"Conteúdo Educativo", text:"Quero escrever sobre como a inteligência artificial funciona no dia a dia real" },
  { tool:"gancho", cat:"Conteúdo Educativo", text:"Quero um texto explicando a diferença entre MEI e ME para quem está começando" },
  { tool:"gancho", cat:"Conteúdo Educativo", text:"Quero escrever sobre como organizar as finanças com até R$2000 por mês" },
  { tool:"gancho", cat:"Conteúdo Educativo", text:"Quero um texto sobre como criar hábitos que realmente funcionam a longo prazo" },
  { tool:"gancho", cat:"Conteúdo Educativo", text:"Quero escrever sobre como estudar com mais foco sem precisar de muito tempo" },
  { tool:"gancho", cat:"Conteúdo Educativo", text:"Quero um texto sobre como lidar com ansiedade no ambiente de trabalho" },
  { tool:"gancho", cat:"Vendas & Ofertas", text:"Quero escrever para anunciar uma promoção de fim de semana urgente" },
  { tool:"gancho", cat:"Vendas & Ofertas", text:"Preciso de um texto impactante para lançar um produto digital novo" },
  { tool:"gancho", cat:"Vendas & Ofertas", text:"Quero uma legenda para anunciar minha consultoria e gerar interesse" },
  { tool:"gancho", cat:"Vendas & Ofertas", text:"Preciso de uma mensagem para fazer uma oferta especial de aniversário da empresa" },
  { tool:"gancho", cat:"Vendas & Ofertas", text:"Quero escrever para anunciar que restam poucas vagas na minha turma" },
  { tool:"gancho", cat:"Vendas & Ofertas", text:"Preciso de um texto para reativar clientes que sumiram há mais de 3 meses" },
  { tool:"gancho", cat:"Vendas & Ofertas", text:"Quero uma legenda para post mostrando depoimento real de cliente satisfeito" },
  { tool:"gancho", cat:"Vendas & Ofertas", text:"Quero escrever sobre por que meu produto vale o preço sem parecer arrogante" },
  { tool:"gancho", cat:"WhatsApp & Grupos", text:"Quero uma mensagem de boas-vindas para grupo de clientes no WhatsApp" },
  { tool:"gancho", cat:"WhatsApp & Grupos", text:"Preciso de um texto para avisar mudança de horário de atendimento" },
  { tool:"gancho", cat:"WhatsApp & Grupos", text:"Quero uma mensagem motivadora para enviar na segunda-feira pro grupo" },
  { tool:"gancho", cat:"WhatsApp & Grupos", text:"Preciso de um comunicado sobre feriado para meus clientes" },
  { tool:"gancho", cat:"WhatsApp & Grupos", text:"Quero mensagem para reativar grupo de WhatsApp que ficou parado" },
  { tool:"gancho", cat:"WhatsApp & Grupos", text:"Preciso de texto para encerrar projeto e agradecer a equipe" },
  { tool:"gancho", cat:"Comentários & Respostas", text:"Quero responder um elogio público de um cliente de forma elegante e autêntica" },
  { tool:"gancho", cat:"Comentários & Respostas", text:"Preciso responder uma crítica negativa no Instagram sem parecer na defensiva" },
  { tool:"gancho", cat:"Comentários & Respostas", text:"Quero uma resposta padrão e calorosa para quem pergunta o preço nos comentários" },
  { tool:"gancho", cat:"Comentários & Respostas", text:"Preciso de texto para legendar carrossel de dúvidas frequentes dos seguidores" },
  { tool:"gancho", cat:"Pessoal & Vida", text:"Quero escrever sobre o que aprendi após 1 ano empreendendo sozinho" },
  { tool:"gancho", cat:"Pessoal & Vida", text:"Quero uma legenda para foto de viagem que gere engajamento real" },
  { tool:"gancho", cat:"Pessoal & Vida", text:"Quero escrever sobre como equilibro trabalho e vida pessoal de verdade" },
  { tool:"gancho", cat:"Pessoal & Vida", text:"Quero escrever sobre o que me motivou a mudar de carreira com coragem" },
  { tool:"gancho", cat:"Pessoal & Vida", text:"Quero uma legenda para aniversário da empresa que emocione sem exagerar" },
  // ── CTA ──
  { tool:"cta", cat:"Vendas & Preço", text:"Cliente perguntou o preço, ficou em silêncio e sumiu. Como responder sem parecer desesperado?" },
  { tool:"cta", cat:"Vendas & Preço", text:"Cliente disse que está caro. Como responder e ainda manter a venda?" },
  { tool:"cta", cat:"Vendas & Preço", text:"Cliente pediu desconto e eu não posso dar. O que falar sem perder o cliente?" },
  { tool:"cta", cat:"Vendas & Preço", text:"Cliente disse 'vou pensar' há 3 dias e sumiu. Que mensagem mando?" },
  { tool:"cta", cat:"Vendas & Preço", text:"Cliente perguntou 'por que devo te contratar?' e eu travei. Como responder?" },
  { tool:"cta", cat:"Vendas & Preço", text:"Cliente disse que já tentou algo parecido e não funcionou. Como quebrar essa objeção?" },
  { tool:"cta", cat:"Vendas & Preço", text:"Cliente quer parcelamento que eu não ofereço. Como contornar sem perder a venda?" },
  { tool:"cta", cat:"Vendas & Preço", text:"Cliente comparou meu preço com concorrente mais barato. O que responder?" },
  { tool:"cta", cat:"Vendas & Preço", text:"Preciso convencer cliente que está em dúvida entre mim e outro profissional" },
  { tool:"cta", cat:"Vendas & Preço", text:"Cliente pediu proposta mas está sumido há 1 semana. O que falar?" },
  { tool:"cta", cat:"Relacionamento com Cliente", text:"Cliente reclamou do atendimento e preciso responder com calma e profissionalismo" },
  { tool:"cta", cat:"Relacionamento com Cliente", text:"Cliente ficou insatisfeito com resultado e está bravo. Como responder?" },
  { tool:"cta", cat:"Relacionamento com Cliente", text:"Cliente está me cobrando por algo que atrasei. Como me posicionar?" },
  { tool:"cta", cat:"Relacionamento com Cliente", text:"Cliente pediu reembolso e não sei como reagir de forma profissional" },
  { tool:"cta", cat:"Relacionamento com Cliente", text:"Preciso me desculpar por um erro sem parecer improfissional" },
  { tool:"cta", cat:"Relacionamento com Cliente", text:"Cliente elogiou muito e não sei como agradecer de forma elegante" },
  { tool:"cta", cat:"Relacionamento com Cliente", text:"Preciso responder uma avaliação negativa no Google com classe" },
  { tool:"cta", cat:"Relacionamento com Cliente", text:"Cliente voltou depois de sumir por meses. O que falar?" },
  { tool:"cta", cat:"Relacionamento com Cliente", text:"Preciso encerrar relação com cliente difícil de forma profissional" },
  { tool:"cta", cat:"Relacionamento com Cliente", text:"Cliente está pedindo algo fora do escopo. Como recusar educadamente?" },
  { tool:"cta", cat:"Trabalho & Carreira", text:"Meu chefe pediu minha opinião sobre um projeto e não sei como ser honesto" },
  { tool:"cta", cat:"Trabalho & Carreira", text:"Colega de trabalho está me pressionando. Como responder de forma assertiva?" },
  { tool:"cta", cat:"Trabalho & Carreira", text:"Preciso recusar uma tarefa que claramente não é minha responsabilidade" },
  { tool:"cta", cat:"Trabalho & Carreira", text:"Fui criticado numa reunião e quero responder com maturidade na hora" },
  { tool:"cta", cat:"Trabalho & Carreira", text:"Preciso dar feedback negativo para um colega sem criar conflito" },
  { tool:"cta", cat:"Trabalho & Carreira", text:"Recebi uma crítica por e-mail injusta e quero responder com firmeza" },
  { tool:"cta", cat:"Trabalho & Carreira", text:"Colega levou crédito pelo meu trabalho. Como abordar sem criar guerra?" },
  { tool:"cta", cat:"Trabalho & Carreira", text:"Preciso questionar decisão do meu chefe sem parecer rebelde" },
  { tool:"cta", cat:"Pessoal & Social", text:"Amigo me pediu dinheiro emprestado e não quero emprestar sem estragar a amizade" },
  { tool:"cta", cat:"Pessoal & Social", text:"Familiar está me pressionando sobre minha vida e preciso me posicionar com calma" },
  { tool:"cta", cat:"Pessoal & Social", text:"Fui convidado para algo que não quero ir e preciso recusar com jeitinho" },
  { tool:"cta", cat:"Pessoal & Social", text:"Recebi crítica de familiar sobre minha carreira. Como responder sem brigar?" },
  { tool:"cta", cat:"Pessoal & Social", text:"Alguém me pediu favor enorme e quero recusar sem sentir culpa" },
  { tool:"cta", cat:"Online & Redes Sociais", text:"Alguém me atacou nos comentários. Como responder com inteligência?" },
  { tool:"cta", cat:"Online & Redes Sociais", text:"Fui marcado em polêmica online e preciso me posicionar de forma estratégica" },
  { tool:"cta", cat:"Online & Redes Sociais", text:"Recebi crítica pública sobre meu produto ou serviço. Como reagir?" },
  { tool:"cta", cat:"Online & Redes Sociais", text:"Alguém está espalhando informação errada sobre mim. Como responder?" },
  { tool:"cta", cat:"Online & Redes Sociais", text:"Recebi DM tentando me vender algo invasivo. Como responder com educação?" },
  { tool:"cta", cat:"Negociação", text:"Fornecedor aumentou o preço e preciso negociar mantendo o relacionamento" },
  { tool:"cta", cat:"Negociação", text:"Preciso negociar prazo de entrega com cliente que está pressionando" },
  { tool:"cta", cat:"Negociação", text:"Prestador de serviço fez trabalho abaixo do esperado. Como abordar?" },
  { tool:"cta", cat:"Negociação", text:"Preciso pedir extensão de prazo para um projeto sem perder credibilidade" },
  { tool:"cta", cat:"Negociação", text:"Cliente quer mudanças fora do escopo sem pagar a mais. Como responder?" },
  { tool:"cta", cat:"Negociação", text:"Parceiro não cumpriu o combinado. Como cobrar sem estragar a parceria?" },
  { tool:"cta", cat:"Cotidiano", text:"Empresa me cobrou errado na fatura e preciso reclamar de forma efetiva" },
  { tool:"cta", cat:"Cotidiano", text:"Comprei produto com defeito e a loja está dificultando a troca. O que escrever?" },
  { tool:"cta", cat:"Cotidiano", text:"Prestador de serviço sumiu com parte do pagamento. Como agir?" },
  { tool:"cta", cat:"Cotidiano", text:"Preciso dar má notícia para um colega de trabalho com cuidado" },
  // ── FUNIL ──
  { tool:"funil", cat:"Lançamento Digital", text:"Quero lançar um curso online de R$97 sobre culinária fitness para iniciantes" },
  { tool:"funil", cat:"Lançamento Digital", text:"Quero criar um ebook de R$27 ensinando a organizar as finanças do lar" },
  { tool:"funil", cat:"Lançamento Digital", text:"Preciso lançar uma mentoria de R$297 para gestoras de tráfego iniciantes" },
  { tool:"funil", cat:"Lançamento Digital", text:"Quero vender um workshop de R$47 sobre criação de conteúdo com IA" },
  { tool:"funil", cat:"Lançamento Digital", text:"Preciso lançar um desafio online de 7 dias sobre emagrecimento com preço de entrada" },
  { tool:"funil", cat:"Lançamento Digital", text:"Quero criar plano de lançamento para planilha de produtividade a R$17" },
  { tool:"funil", cat:"Lançamento Digital", text:"Preciso lançar uma comunidade paga de R$37 por mês para empreendedores" },
  { tool:"funil", cat:"Lançamento Digital", text:"Quero vender um curso de fotografia para celular a R$67" },
  { tool:"funil", cat:"Lançamento Digital", text:"Preciso lançar um infoproduto sobre como passar em concurso público" },
  { tool:"funil", cat:"Lançamento Digital", text:"Quero criar plano de lançamento para curso de inglês para viagens a R$127" },
  { tool:"funil", cat:"Lançamento Digital", text:"Quero lançar templates de Instagram para profissionais de saúde a R$37" },
  { tool:"funil", cat:"Lançamento Digital", text:"Preciso de estratégia para vender assessoria de redes sociais a R$497 por mês" },
  { tool:"funil", cat:"Serviços Locais", text:"Sou personal trainer e quero mais alunos particulares na minha cidade" },
  { tool:"funil", cat:"Serviços Locais", text:"Sou nutricionista e quero mais pacientes pagando consulta particular" },
  { tool:"funil", cat:"Serviços Locais", text:"Tenho salão de beleza e quero encher minha agenda pelo Instagram" },
  { tool:"funil", cat:"Serviços Locais", text:"Sou advogado e quero clientes de família e divórcio pelas redes sociais" },
  { tool:"funil", cat:"Serviços Locais", text:"Sou dentista e quero mais pacientes para clareamento e estética dental" },
  { tool:"funil", cat:"Serviços Locais", text:"Faço bolos personalizados e quero mais encomendas de casamento" },
  { tool:"funil", cat:"Serviços Locais", text:"Sou fotógrafo e quero mais clientes para ensaio newborn e família" },
  { tool:"funil", cat:"Serviços Locais", text:"Sou professora de dança e quero montar turmas novas online e presencial" },
  { tool:"funil", cat:"Serviços Locais", text:"Tenho clínica de estética e quero vender pacotes de tratamento" },
  { tool:"funil", cat:"Serviços Locais", text:"Sou arquiteta e quero atrair clientes para reforma de apartamentos" },
  { tool:"funil", cat:"Serviços Locais", text:"Tenho empresa de limpeza e quero mais contratos mensais fixos" },
  { tool:"funil", cat:"Escalar Negócio", text:"Tenho 200 clientes ativos e quero vender produto mais caro para eles" },
  { tool:"funil", cat:"Escalar Negócio", text:"Quero criar upsell para quem já comprou meu produto básico" },
  { tool:"funil", cat:"Escalar Negócio", text:"Preciso reativar base de 500 clientes que não compram há 6 meses" },
  { tool:"funil", cat:"Escalar Negócio", text:"Quero criar programa de indicação para meus clientes mais fiéis" },
  { tool:"funil", cat:"Escalar Negócio", text:"Preciso de plano para migrar clientes avulsos para recorrência mensal" },
  { tool:"funil", cat:"Escalar Negócio", text:"Quero aumentar meu ticket médio em 50% sem perder os clientes atuais" },
  { tool:"funil", cat:"Escalar Negócio", text:"Quero criar programa de fidelidade para meu serviço mensal" },
  { tool:"funil", cat:"Escalar Negócio", text:"Preciso de estratégia para criar versão premium do que já vendo" },
  { tool:"funil", cat:"Conteúdo & Audiência", text:"Quero um plano de conteúdo de 30 dias para crescer no Instagram do zero" },
  { tool:"funil", cat:"Conteúdo & Audiência", text:"Preciso de estratégia para crescer no YouTube com conteúdo do meu nicho" },
  { tool:"funil", cat:"Conteúdo & Audiência", text:"Quero um plano para construir audiência qualificada no LinkedIn" },
  { tool:"funil", cat:"Conteúdo & Audiência", text:"Preciso de estratégia de conteúdo para TikTok de negócios" },
  { tool:"funil", cat:"Conteúdo & Audiência", text:"Quero criar plano de newsletters semanais que nutrem e vendem" },
  { tool:"funil", cat:"Conteúdo & Audiência", text:"Preciso de estratégia para lives que engajam e geram vendas" },
  { tool:"funil", cat:"Conteúdo & Audiência", text:"Quero plano de reels que atraem seguidores e viram clientes" },
  { tool:"funil", cat:"Conteúdo & Audiência", text:"Preciso de estratégia para construir autoridade no meu nicho em 90 dias" },
  { tool:"funil", cat:"Validação & Ideia", text:"Tenho uma ideia de produto mas não sei se vai vender. Como validar rápido?" },
  { tool:"funil", cat:"Validação & Ideia", text:"Quero testar um produto novo sem investir muito dinheiro antes" },
  { tool:"funil", cat:"Validação & Ideia", text:"Quero criar oferta irresistível para meu produto ou serviço" },
  { tool:"funil", cat:"Validação & Ideia", text:"Preciso diferenciar meu serviço de outros que fazem a mesma coisa" },
  { tool:"funil", cat:"Validação & Ideia", text:"Quero testar preço mais alto sem perder minha base de clientes" },
  { tool:"funil", cat:"Validação & Ideia", text:"Preciso criar estratégia de pré-venda para novo produto ainda em criação" },
  { tool:"funil", cat:"Validação & Ideia", text:"Quero sair do emprego CLT e viver do meu negócio em 6 meses" },
  { tool:"funil", cat:"Datas & Campanhas", text:"Quero criar oferta de Black Friday irresistível para minha base de clientes" },
  { tool:"funil", cat:"Datas & Campanhas", text:"Preciso de estratégia de vendas para o Natal no meu nicho" },
  { tool:"funil", cat:"Datas & Campanhas", text:"Quero um plano para fazer minha primeira venda em exatamente 7 dias" },
  { tool:"funil", cat:"Datas & Campanhas", text:"Quero campanha de aniversário da empresa que gere vendas reais" },
  // ── STORIES/ROTEIRO ──
  { tool:"stories", cat:"Venda & Conversão", text:"Quero gravar um vídeo vendendo meu curso online de R$97 de forma natural" },
  { tool:"stories", cat:"Venda & Conversão", text:"Preciso fazer stories mostrando resultado real de cliente em 30 dias" },
  { tool:"stories", cat:"Venda & Conversão", text:"Quero gravar reels com oferta relâmpago de 24 horas que gera urgência" },
  { tool:"stories", cat:"Venda & Conversão", text:"Preciso de roteiro para vídeo quebrando a objeção de preço de forma honesta" },
  { tool:"stories", cat:"Venda & Conversão", text:"Quero gravar vídeo mostrando tudo que está incluído no meu pacote" },
  { tool:"stories", cat:"Venda & Conversão", text:"Preciso de roteiro para série de stories de lançamento de produto digital" },
  { tool:"stories", cat:"Venda & Conversão", text:"Quero gravar um antes e depois de cliente de forma ética e impactante" },
  { tool:"stories", cat:"Venda & Conversão", text:"Preciso de roteiro para live de lançamento que prende a audiência" },
  { tool:"stories", cat:"Venda & Conversão", text:"Quero um vídeo mostrando por que meu serviço vale o preço cobrado" },
  { tool:"stories", cat:"Venda & Conversão", text:"Preciso de roteiro para stories com depoimento real de cliente" },
  { tool:"stories", cat:"Educativo & Autoridade", text:"Quero gravar um reels dando 3 dicas sobre emagrecimento saudável" },
  { tool:"stories", cat:"Educativo & Autoridade", text:"Preciso de roteiro para vídeo explicando o que é marketing digital para leigos" },
  { tool:"stories", cat:"Educativo & Autoridade", text:"Quero gravar uma mini aula sobre organização financeira em menos de 60 segundos" },
  { tool:"stories", cat:"Educativo & Autoridade", text:"Preciso de roteiro para vídeo sobre os 3 erros que destroem negócios" },
  { tool:"stories", cat:"Educativo & Autoridade", text:"Quero um vídeo mostrando minha rotina de trabalho de forma inspiradora" },
  { tool:"stories", cat:"Educativo & Autoridade", text:"Preciso gravar sobre o maior mito do meu nicho que todo mundo acredita" },
  { tool:"stories", cat:"Educativo & Autoridade", text:"Quero um roteiro para vídeo explicando meu método de forma simples" },
  { tool:"stories", cat:"Educativo & Autoridade", text:"Preciso de vídeo respondendo as 5 dúvidas mais frequentes dos seguidores" },
  { tool:"stories", cat:"Educativo & Autoridade", text:"Quero gravar sobre como uso IA para economizar tempo no trabalho" },
  { tool:"stories", cat:"Educativo & Autoridade", text:"Preciso de roteiro para vídeo com dica de produtividade que aplico todo dia" },
  { tool:"stories", cat:"Storytelling", text:"Quero gravar sobre o maior erro que cometi e o que aprendi com ele" },
  { tool:"stories", cat:"Storytelling", text:"Preciso de roteiro para vídeo contando minha história de transformação" },
  { tool:"stories", cat:"Storytelling", text:"Quero gravar sobre meu dia real como empreendedor sem filtro" },
  { tool:"stories", cat:"Storytelling", text:"Preciso de vídeo sobre por que escolhi essa profissão de forma emocionante" },
  { tool:"stories", cat:"Storytelling", text:"Quero um roteiro para vídeo comemorando uma meta que parecia impossível" },
  { tool:"stories", cat:"Storytelling", text:"Preciso de roteiro para anunciar algo novo que está chegando em breve" },
  { tool:"stories", cat:"Storytelling", text:"Quero gravar agradecimento genuíno para seguidores ao bater 10k" },
  { tool:"stories", cat:"Engajamento", text:"Quero gravar perguntas estratégicas para engajar meus seguidores" },
  { tool:"stories", cat:"Engajamento", text:"Preciso de roteiro para stories de enquete que gera muitas respostas" },
  { tool:"stories", cat:"Engajamento", text:"Quero gravar vídeo com opinião polêmica sobre o meu mercado" },
  { tool:"stories", cat:"Engajamento", text:"Preciso de roteiro para reels de comparação antes e depois do resultado" },
  { tool:"stories", cat:"Engajamento", text:"Quero gravar lista dos erros mais comuns que meu público comete" },
  { tool:"stories", cat:"Engajamento", text:"Preciso de roteiro para vídeo de 'você sabia que...' no meu nicho" },
  { tool:"stories", cat:"Nichos Específicos", text:"Quero gravar reels de receita saudável em 60 segundos com visual bonito" },
  { tool:"stories", cat:"Nichos Específicos", text:"Preciso de roteiro para vídeo de treino em casa sem nenhum equipamento" },
  { tool:"stories", cat:"Nichos Específicos", text:"Quero gravar tour pelo apartamento reformado mostrando antes e depois" },
  { tool:"stories", cat:"Nichos Específicos", text:"Preciso de roteiro para vídeo de cuidados com pet de forma divertida" },
  { tool:"stories", cat:"Nichos Específicos", text:"Quero um vídeo de skincare rotina que converte em vendas" },
  { tool:"stories", cat:"Nichos Específicos", text:"Preciso de roteiro para médico dar dica de saúde de forma acessível" },
  { tool:"stories", cat:"Nichos Específicos", text:"Quero gravar como advogado explicando direito do consumidor de forma simples" },
  { tool:"stories", cat:"Nichos Específicos", text:"Preciso de vídeo para dentista mostrando cuidado diário com os dentes" },
  { tool:"stories", cat:"Nichos Específicos", text:"Quero um roteiro para psicólogo dando dica de saúde mental prática" },
  { tool:"stories", cat:"Nichos Específicos", text:"Preciso gravar como contador explicando imposto de renda de forma leve" },
  { tool:"stories", cat:"Anúncios", text:"Preciso de roteiro para vídeo de anúncio de 15 segundos que prende atenção" },
  { tool:"stories", cat:"Anúncios", text:"Quero gravar criativo para stories de anúncio no Instagram que converte" },
  { tool:"stories", cat:"Anúncios", text:"Preciso de roteiro para anúncio de produto físico no Facebook em 30 segundos" },
  { tool:"stories", cat:"Anúncios", text:"Quero um criativo de vídeo para campanha de remarketing impactante" },
  { tool:"stories", cat:"Anúncios", text:"Preciso de roteiro para anúncio de consulta gratuita que gera agendamentos" },
  { tool:"stories", cat:"Anúncios", text:"Quero gravar criativo para anunciar desconto especial de forma urgente" },
  { tool:"stories", cat:"YouTube & Longa Duração", text:"Preciso de roteiro para vídeo de 10 minutos de autoridade no meu nicho" },
  { tool:"stories", cat:"YouTube & Longa Duração", text:"Quero um roteiro para vlog da minha semana como empreendedor autêntico" },
  { tool:"stories", cat:"YouTube & Longa Duração", text:"Preciso de roteiro para vídeo tutorial passo a passo completo" },
  { tool:"stories", cat:"YouTube & Longa Duração", text:"Quero roteiro para vídeo respondendo as dúvidas mais frequentes" },
  { tool:"stories", cat:"YouTube & Longa Duração", text:"Preciso de roteiro para vídeo de case de sucesso de cliente real" },
  { tool:"stories", cat:"YouTube & Longa Duração", text:"Quero gravar vídeo sobre tendências do meu mercado para o próximo ano" },
  // ── EMAILS ──
  { tool:"emails", cat:"Vendas & Conversão", text:"Quero sequência de 5 mensagens para vender meu curso de R$197 para lista fria" },
  { tool:"emails", cat:"Vendas & Conversão", text:"Preciso de mensagens para converter lead que baixou meu material gratuito" },
  { tool:"emails", cat:"Vendas & Conversão", text:"Quero sequência de follow-up para proposta enviada há 1 semana sem resposta" },
  { tool:"emails", cat:"Vendas & Conversão", text:"Preciso de mensagens para reativar clientes que não compram há 6 meses" },
  { tool:"emails", cat:"Vendas & Conversão", text:"Quero sequência de upsell para quem acabou de fazer a primeira compra" },
  { tool:"emails", cat:"Vendas & Conversão", text:"Preciso de mensagens para converter trial gratuito em assinante pagante" },
  { tool:"emails", cat:"Vendas & Conversão", text:"Quero sequência para nutrir lead que disse 'agora não é o momento'" },
  { tool:"emails", cat:"Vendas & Conversão", text:"Preciso de mensagens para campanha de Black Friday para minha base" },
  { tool:"emails", cat:"Vendas & Conversão", text:"Quero sequência para carrinho abandonado no meu e-commerce" },
  { tool:"emails", cat:"Vendas & Conversão", text:"Preciso de mensagens para lançamento de produto em pré-venda" },
  { tool:"emails", cat:"Relacionamento", text:"Quero sequência de boas-vindas calorosa para novo assinante da newsletter" },
  { tool:"emails", cat:"Relacionamento", text:"Preciso de mensagens para coletar depoimento de cliente satisfeito" },
  { tool:"emails", cat:"Relacionamento", text:"Quero sequência para cliente que reclamou, resolvendo com excelência" },
  { tool:"emails", cat:"Relacionamento", text:"Preciso de mensagens para pesquisa de satisfação após entrega do serviço" },
  { tool:"emails", cat:"Relacionamento", text:"Quero sequência de retenção para cliente prestes a cancelar" },
  { tool:"emails", cat:"Relacionamento", text:"Preciso de mensagens para coletar indicação de cliente fidelizado" },
  { tool:"emails", cat:"Relacionamento", text:"Quero sequência para reconquistar cliente que cancelou há 2 meses" },
  { tool:"emails", cat:"Relacionamento", text:"Preciso de mensagens para parabenizar cliente por resultado alcançado" },
  { tool:"emails", cat:"Relacionamento", text:"Quero sequência de aniversário de cliente que gera fidelização" },
  { tool:"emails", cat:"Relacionamento", text:"Preciso de mensagens para comunidade de clientes VIP manter engajamento" },
  { tool:"emails", cat:"Conteúdo & Nutrição", text:"Quero sequência de 5 emails educativos para construir autoridade no nicho" },
  { tool:"emails", cat:"Conteúdo & Nutrição", text:"Preciso de newsletter semanal que engaja e vende de forma sutil no final" },
  { tool:"emails", cat:"Conteúdo & Nutrição", text:"Quero sequência para entregar conteúdo gratuito e converter ao final" },
  { tool:"emails", cat:"Conteúdo & Nutrição", text:"Preciso de mensagens para divulgar webinar gratuito e maximizar inscrições" },
  { tool:"emails", cat:"Conteúdo & Nutrição", text:"Quero sequência para lançar desafio online de 5 dias pela lista" },
  { tool:"emails", cat:"Conteúdo & Nutrição", text:"Preciso de mensagens para reativar lista de email inativa por 3 meses" },
  { tool:"emails", cat:"Conteúdo & Nutrição", text:"Quero sequência para promover nova comunidade paga para seguidores" },
  { tool:"emails", cat:"WhatsApp", text:"Quero sequência de boas-vindas para lead que chegou pelo Instagram" },
  { tool:"emails", cat:"WhatsApp", text:"Preciso de mensagens para acompanhar orçamento enviado sem parecer ansioso" },
  { tool:"emails", cat:"WhatsApp", text:"Quero sequência para qualificar lead antes de fazer a proposta" },
  { tool:"emails", cat:"WhatsApp", text:"Preciso de mensagens para nutrir lead que pediu mais tempo para decidir" },
  { tool:"emails", cat:"WhatsApp", text:"Quero sequência pós-reunião para fechar o negócio com elegância" },
  { tool:"emails", cat:"WhatsApp", text:"Preciso de mensagens para acompanhar entrega e garantir satisfação" },
  { tool:"emails", cat:"WhatsApp", text:"Quero sequência para reativar conversa de venda que travou" },
  { tool:"emails", cat:"WhatsApp", text:"Preciso de mensagens para coletar feedback após atendimento completo" },
  { tool:"emails", cat:"Educação & Cursos", text:"Quero sequência de mensagens para manter alunos ativos e engajados" },
  { tool:"emails", cat:"Educação & Cursos", text:"Preciso de mensagens para motivar turma de mentoria nas primeiras semanas" },
  { tool:"emails", cat:"Educação & Cursos", text:"Quero sequência para reengajar aluno que sumiu do curso" },
  { tool:"emails", cat:"Educação & Cursos", text:"Preciso de mensagens para encerramento de turma com pedido de depoimento" },
  { tool:"emails", cat:"Educação & Cursos", text:"Quero sequência para anunciar nova turma para ex-alunos satisfeitos" },
  { tool:"emails", cat:"Educação & Cursos", text:"Preciso de mensagens para coletar resultados reais de alunos" },
  { tool:"emails", cat:"Equipe & Gestão", text:"Quero sequência de onboarding para novo colaborador se sentir bem-vindo" },
  { tool:"emails", cat:"Equipe & Gestão", text:"Preciso de mensagens para comunicar mudança de processo internamente" },
  { tool:"emails", cat:"Equipe & Gestão", text:"Quero mensagens para motivar equipe antes de meta importante" },
  { tool:"emails", cat:"Equipe & Gestão", text:"Preciso de sequência para celebrar meta batida com a equipe" },
  { tool:"emails", cat:"Equipe & Gestão", text:"Quero mensagens para comunicar novidade positiva para colaboradores" },
];

export default function MotorIAPro() {
  const [selectedTool, setSelectedTool] = useState("bio");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [freeUses, setFreeUses] = useState(3);
  const [showModal, setShowModal] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dots, setDots] = useState("");
  const [trustIdx, setTrustIdx] = useState(0);
  const [showIntents, setShowIntents] = useState(true);
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libTab, setLibTab] = useState("bio");
  const [libSearch, setLibSearch] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [screen, setScreen] = useState("home");
  const [activeFlow, setActiveFlow] = useState(null);
  const [guidedInputs, setGuidedInputs] = useState({});
  const [activeCategory, setActiveCategory] = useState("todos");
  const intervalRef = useRef(null);
  const cacheRef = useRef(new Map());
  const lastCallRef = useRef("");
  const flowGridRef = useRef(null);

  const currentTool = TOOLS.find((t) => t.id === selectedTool);
  const isTurbo = !currentTool?.free;
  const step = showOutput ? 3 : 2;

  useEffect(() => {
    if (loading) {
      intervalRef.current = setInterval(
        () => setDots((d) => (d.length >= 3 ? "" : d + ".")),
        380
      );
    } else {
      clearInterval(intervalRef.current);
      setDots("");
    }
    return () => clearInterval(intervalRef.current);
  }, [loading]);

  const handleGenerate = async () => {
    if (isTurbo || freeUses <= 0) { setShowModal(true); return; }
    if (!input.trim() || input.trim().length < 10) return;
    setUserMessage(input.trim());

    const cacheKey = `${selectedTool}::${input.trim()}`;
    if (cacheKey === lastCallRef.current) return;

    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setOutput(cached);
      setShowOutput(true);
      setTrustIdx(Math.floor(Math.random() * TRUST_COPIES.length));
      return;
    }

    lastCallRef.current = cacheKey;
    setLoading(true);
    setShowOutput(false);
    setOutput("");
    setTrustIdx(Math.floor(Math.random() * TRUST_COPIES.length));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: selectedTool,
          userMessage: input,
        }),
      });
      const data = await res.json();
      const text =
        data.content?.find((c) => c.type === "text")?.text ||
        "Não consegui gerar. Tenta de novo.";
      setOutput(text);
      setShowOutput(true);
      setFreeUses((f) => f - 1);
      cacheRef.current.set(cacheKey, text);
    } catch {
      setOutput("Erro de conexão. Verifica sua internet e tenta de novo.");
      setShowOutput(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    lastCallRef.current = "";
    handleGenerate();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleIntent = (intent) => {
    setSelectedIntent(intent.id);
    setSelectedTool(intent.tool);
    setShowOutput(false);
    setInput("");
    setOutput("");
    setShowIntents(false);
  };

  const handleCategory = (cat) => {
    setLibTab(cat.libTool);
    setLibSearch(cat.libSearch);
    setShowLibrary(true);
  };

  const handleSelectTool = (id) => {
    setSelectedTool(id);
    setShowOutput(false);
    setInput("");
    setOutput("");
  };

  const handleFlowSelect = (flow) => {
    setActiveFlow(flow);
    setGuidedInputs({});
    setScreen("guided");
    setShowOutput(false);
    setOutput("");
    setUserMessage("");
    lastCallRef.current = "";
  };

  const handleQuickModel = (model) => {
    const flow = GUIDED_FLOWS.find(f => f.id === model.flowId);
    if (!flow) return;
    setActiveFlow(flow);
    setGuidedInputs(model.inputs || {});
    setScreen("guided");
    setShowOutput(false);
    setOutput("");
    setUserMessage("");
    lastCallRef.current = "";
  };

  const buildGuidedPrompt = (flow, inputs) => {
    return flow.fields
      .map(f => {
        const val = (inputs[f.key] || "").trim();
        if (!val) return null;
        return `${f.label}\n${val}`;
      })
      .filter(Boolean)
      .join("\n\n");
  };

  const handleGuidedGenerate = async () => {
    if (!activeFlow) return;
    const promptText = buildGuidedPrompt(activeFlow, guidedInputs);
    if (!promptText || promptText.length < 3) return;
    if (freeUses <= 0) { setShowModal(true); return; }

    setUserMessage("✓ Informações enviadas — gerando agora");
    const cacheKey = `guided::${activeFlow.id}::${promptText}`;
    if (cacheKey === lastCallRef.current) return;

    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setOutput(cached);
      setShowOutput(true);
      setTrustIdx(Math.floor(Math.random() * TRUST_COPIES.length));
      return;
    }

    lastCallRef.current = cacheKey;
    setLoading(true);
    setShowOutput(false);
    setOutput("");
    setTrustIdx(Math.floor(Math.random() * TRUST_COPIES.length));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: activeFlow.promptKey,
          userMessage: promptText,
        }),
      });
      const data = await res.json();
      const text = data.content?.find(c => c.type === "text")?.text || "Não consegui gerar. Tenta de novo.";
      setOutput(text);
      setShowOutput(true);
      setFreeUses(f => f - 1);
      cacheRef.current.set(cacheKey, text);
    } catch {
      setOutput("Erro de conexão. Verifica sua internet e tenta de novo.");
      setShowOutput(true);
    } finally {
      setLoading(false);
    }
  };

  const getButtonLabel = () => {
    if (loading) return `Gerando${dots}`;
    if (isTurbo) return currentTool.buttonLabel;
    if (freeUses <= 0) return "🔒 Ver acesso completo";
    if (input.trim().length > 0 && input.trim().length < 10) return "Escreve mais um pouquinho...";
    return "Gerar resposta agora";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #10101d;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }

        .m-root {
          background: #10101d;
          min-height: 100vh;
          color: #e8e6f4;
          padding: 24px 16px 96px;
        }
        .m-inner { max-width: 580px; margin: 0 auto; }

        /* ─── HEADER ─── */
        .m-header {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 20px;
          gap: 12px; flex-wrap: wrap;
        }
        .m-logo {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800;
          letter-spacing: -0.8px; color: #f4f2ff; line-height: 1.1;
        }
        .m-logo em { color: #22c55e; font-style: normal; }
        .m-logo-badge {
          display: inline-block; font-family: 'Inter', sans-serif;
          font-size: 10px; font-weight: 700;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #051a08; padding: 2px 8px; border-radius: 5px;
          letter-spacing: 0.5px; vertical-align: middle; margin-left: 6px;
        }
        .m-tagline {
          font-size: 14px; font-weight: 700;
          color: #f4f2ff; margin-top: 5px; line-height: 1.3;
        }
        .m-positioning {
          font-size: 12.5px; font-weight: 600;
          color: #4ade80; margin-top: 2px;
        }
        .m-header-pill {
          display: flex; align-items: center; gap: 6px;
          background: #0e1a0e; border: 1px solid #22c55e22;
          border-radius: 20px; padding: 6px 13px;
          font-size: 12px; font-weight: 700; flex-shrink: 0;
        }

        /* ─── STATUS BAR ─── */
        .m-status {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 14px; background: #14142a;
          border: 1px solid #2a2740; border-radius: 9px; margin-bottom: 12px;
        }
        .m-dot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
          background: #4ade80; box-shadow: 0 0 8px #4ade8066;
          animation: pulse 2s infinite;
        }
        .m-status-text { font-size: 12px; font-weight: 500; color: #8b89a8; }

        /* ─── PROMISE BAR ─── */
        .m-promise {
          font-size: 12.5px; font-weight: 500; color: #c8c4e4; text-align: center;
          padding: 10px 16px; margin-bottom: 20px;
          border: 1px solid #22c55e20; border-radius: 9px;
          background: linear-gradient(135deg, #22c55e08 0%, transparent 100%);
          line-height: 1.5;
        }

        /* ─── HERO ─── */
        .m-hero {
          text-align: center; padding: 28px 20px 22px;
          margin-bottom: 16px;
          background: linear-gradient(160deg, #16162c 0%, #10101d 100%);
          border: 1px solid #2a2740; border-radius: 16px;
          position: relative; overflow: hidden;
        }
        .m-hero::before {
          content: ''; position: absolute;
          top: 0; left: 50%; transform: translateX(-50%);
          width: 55%; height: 1px;
          background: linear-gradient(90deg, transparent, #22c55e55, transparent);
        }
        .m-hero-eyebrow {
          font-size: 11px; font-weight: 700; color: #22c55e99; letter-spacing: 1.5px;
          text-transform: uppercase; margin-bottom: 10px;
        }
        .m-hero-title {
          font-family: 'Syne', sans-serif;
          font-size: 26px; font-weight: 800; color: #f4f2ff;
          letter-spacing: -1px; line-height: 1.2; margin-bottom: 12px;
        }
        .m-hero-title em { color: #22c55e; font-style: normal; }
        .m-hero-sub {
          font-size: 15px; font-weight: 500; color: #c8c4e0;
          line-height: 1.65; margin-bottom: 8px;
        }
        .m-hero-extra {
          font-size: 13px; font-weight: 600; color: #e8e6f4;
          margin-bottom: 18px; line-height: 1.5;
        }
        .m-hero-bullets { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
        .m-hero-bullet {
          font-size: 11px; font-weight: 700; color: #4ade80;
          background: #4ade8010; border: 1px solid #4ade8025;
          border-radius: 20px; padding: 4px 12px; letter-spacing: 0.2px;
        }

        /* ─── SOCIAL PROOF ─── */
        .m-social {
          margin-bottom: 20px;
          padding: 14px 16px;
          background: #14142a; border: 1px solid #2a2740; border-radius: 12px;
        }
        .m-social-count {
          font-size: 12px; font-weight: 700; color: #4ade80;
          text-align: center; margin-bottom: 10px; letter-spacing: 0.2px;
        }
        .m-social-reviews { display: flex; flex-direction: column; gap: 6px; }
        .m-social-review {
          display: flex; align-items: center; gap: 9px;
          font-size: 12px; font-weight: 500; color: #b8b4d4;
          background: #1c1c34; border: 1px solid #2a2740;
          border-radius: 8px; padding: 8px 12px; line-height: 1.3;
        }
        .m-social-review span { font-size: 14px; flex-shrink: 0; }

        /* ─── PROGRESS STEPS ─── */
        .m-steps {
          display: flex; align-items: flex-start; margin-bottom: 20px;
        }
        .m-step {
          display: flex; flex-direction: column; align-items: center;
          gap: 5px; flex: 1; position: relative;
        }
        .m-step:not(:last-child)::after {
          content: ''; position: absolute;
          top: 11px; left: calc(50% + 14px);
          width: calc(100% - 28px); height: 1px;
          background: #2a2740; transition: background 0.3s;
        }
        .m-step.done:not(:last-child)::after { background: #22c55e33; }
        .m-step-dot {
          width: 22px; height: 22px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700;
          border: 1px solid #2a2740; color: #55537a; background: #18182e;
          transition: all 0.25s; position: relative; z-index: 1;
        }
        .m-step.active .m-step-dot {
          background: #22c55e; color: #051a08; border-color: #22c55e;
          box-shadow: 0 0 16px #22c55e55;
        }
        .m-step.done .m-step-dot {
          background: #4ade8015; color: #4ade80; border-color: #4ade8033;
        }
        .m-step-lbl {
          font-size: 9px; color: #45436a; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.4px; text-align: center;
        }
        .m-step.active .m-step-lbl { color: #22c55e; }
        .m-step.done .m-step-lbl { color: #4ade8088; }

        /* ─── INTENT LAYER ─── */
        .m-intents-wrap { animation: fadeUp 0.3s ease; }
        .m-intents-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800; color: #f4f2ff;
          margin-bottom: 4px; letter-spacing: -0.4px; line-height: 1.2;
        }
        .m-intents-sub { font-size: 14px; font-weight: 500; color: #a1a1aa; margin-bottom: 16px; }
        .m-intents-grid { display: flex; flex-direction: column; gap: 7px; margin-bottom: 14px; }

        .m-intent-btn {
          display: flex; align-items: center; gap: 13px;
          background: #14142a; border: 1px solid #2a2740;
          border-radius: 12px; padding: 14px 16px;
          cursor: pointer; text-align: left; width: 100%;
          transition: all 0.17s ease;
        }
        .m-intent-btn:hover {
          border-color: #22c55e66; background: #061408;
          transform: translateX(5px);
          box-shadow: -4px 0 0 #22c55e, 0 6px 24px #22c55e0d;
        }
        .m-intent-btn:active { transform: translateX(2px) scale(0.985); }
        .m-intent-emoji { font-size: 20px; flex-shrink: 0; width: 26px; text-align: center; }
        .m-intent-label {
          font-size: 14px; font-weight: 700; color: #f0eeff;
          margin-bottom: 2px; line-height: 1.2;
        }
        .m-intent-desc { font-size: 12px; font-weight: 500; color: #a1a1aa; line-height: 1.3; }

        .m-intent-skip {
          background: none; border: none; color: #8886b0;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; padding: 10px 0; transition: color 0.2s;
          text-decoration: underline; text-underline-offset: 3px;
          text-decoration-color: #8886b044;
        }
        .m-intent-skip:hover { color: #22c55e; text-decoration-color: #22c55e66; }

        /* ─── TOOL GRID ─── */
        .m-tools {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 7px; margin-bottom: 8px;
        }
        @media (max-width: 420px) { .m-tools { grid-template-columns: 1fr; } }

        .m-tool {
          background: #14142a; border: 1px solid #2a2740;
          border-radius: 11px; padding: 13px; cursor: pointer;
          text-align: left; transition: all 0.17s ease;
          position: relative; overflow: hidden;
        }
        .m-tool::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, #22c55e08, transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .m-tool:hover { border-color: #22c55e66; transform: translateY(-3px); box-shadow: 0 8px 24px #22c55e0f; }
        .m-tool:hover::before { opacity: 1; }
        .m-tool:active { transform: translateY(0) scale(0.975); transition: transform 0.1s; }
        .m-tool.active { border-color: #22c55e88; background: #061408; }
        .m-tool.active::before { opacity: 1; }

        .m-tool-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
        .m-tool-icon { font-size: 13px; color: #3a3860; transition: color 0.2s; }
        .m-tool.active .m-tool-icon { color: #22c55e; }
        .m-tool:hover .m-tool-icon { color: #22c55e88; }

        .badge { font-size: 9px; font-weight: 700; letter-spacing: 0.5px; padding: 2px 7px; border-radius: 4px; }
        .badge-free { background: #22c55e18; color: #22c55e; border: 1px solid #22c55e33; }
        .badge-lock { background: #1e1c38; color: #55537a; border: 1px solid #2a2740; }

        .m-tool-label { font-size: 11px; font-weight: 600; color: #c8c4e0; line-height: 1.35; margin-bottom: 3px; transition: color 0.2s; }
        .m-tool.active .m-tool-label { color: #f4f2ff; }
        .m-tool:hover .m-tool-label { color: #f0eeff; }
        .m-tool-sub { font-size: 10px; font-weight: 500; color: #6b698a; line-height: 1.3; }

        .m-back-btn {
          background: none; border: none; color: #45436a;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
          cursor: pointer; padding: 10px 0; margin-bottom: 4px;
          display: block; transition: color 0.2s;
        }
        .m-back-btn:hover { color: #22c55e; }

        /* ─── INPUT AREA ─── */
        .m-input-label { font-size: 13px; font-weight: 700; color: #e8e6f4; margin-bottom: 4px; }
        .m-input-label span { color: #c8c4e0; font-weight: 500; }
        .m-input-hint { font-size: 12px; font-weight: 500; color: #a1a1aa; margin-bottom: 8px; }

        .m-textarea {
          width: 100%; background: #14142a;
          border: 1px solid #2a2740; border-radius: 11px;
          padding: 13px 15px; color: #e8e6f4;
          font-family: 'Inter', sans-serif; font-size: 14px;
          line-height: 1.6; resize: vertical; min-height: 88px;
          outline: none; transition: border-color 0.22s, box-shadow 0.22s;
          margin-bottom: 8px;
        }
        .m-textarea:focus { border-color: #22c55e55; box-shadow: 0 0 0 3px #22c55e0a; }
        .m-textarea::placeholder { color: #2e2c50; }

        .m-example-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
        .m-example-lbl { font-size: 10px; font-weight: 700; color: #45436a; text-transform: uppercase; letter-spacing: 0.4px; flex-shrink: 0; }
        .m-example-chip {
          font-size: 11px; font-weight: 500; color: #9896b8; background: #18182e;
          border: 1px solid #2a2740; border-radius: 20px;
          padding: 5px 13px; cursor: pointer; transition: all 0.17s;
          font-family: 'Inter', sans-serif;
          max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .m-example-chip:hover { border-color: #22c55e55; color: #22c55e; background: #061408; }
        .m-example-chip:active { transform: scale(0.97); }

        /* ─── PRESSURE BANNERS ─── */
        .m-pressure {
          font-size: 12.5px; font-weight: 700; text-align: center;
          padding: 10px 16px; margin-bottom: 10px; border-radius: 9px;
          animation: fadeUp 0.3s ease;
          background: #0a1a0a; border: 1px solid #22c55e30; color: #22c55ecc;
        }
        .m-pressure-urgent { background: #1c0808; border-color: #ef444430; color: #ef4444cc; }
        .m-pressure-locked {
          background: #18182e; border-color: #2a2740; color: #a8a6cc;
          cursor: pointer; transition: border-color 0.2s;
        }
        .m-pressure-locked:hover { border-color: #22c55e44; }

        /* ─── BUTTONS ─── */
        .m-btn {
          width: 100%; border: none; border-radius: 11px;
          padding: 15px 20px; font-family: 'Inter', sans-serif;
          font-weight: 800; font-size: 15px; cursor: pointer;
          letter-spacing: -0.2px; transition: all 0.2s ease;
        }
        .m-btn-active {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #051a08; box-shadow: 0 4px 20px #22c55e20;
        }
        .m-btn-active:hover:not(:disabled) {
          background: linear-gradient(135deg, #fcd34d 0%, #22c55e 100%);
          transform: translateY(-3px); box-shadow: 0 12px 36px #22c55e35;
        }
        .m-btn-active:active:not(:disabled) { transform: translateY(0) scale(0.975); box-shadow: none; transition: transform 0.1s; }
        .m-btn-active:disabled { opacity: 0.36; cursor: default; box-shadow: none; }

        .m-btn-lock { background: #18182e; color: #9896b8; border: 1px solid #2a2740; }
        .m-btn-lock:hover { border-color: #22c55e44; color: #22c55e; background: #061408; }

        .m-btn-secondary {
          width: 100%; border: 1px solid #2a2740; border-radius: 11px;
          padding: 12px 20px; font-family: 'Inter', sans-serif;
          font-weight: 600; font-size: 13px; cursor: pointer;
          color: #a8a6cc; background: #14142a; margin-top: 10px;
          transition: all 0.18s;
        }
        .m-btn-secondary:hover { border-color: #22c55e44; color: #22c55e; background: #061408; }

        /* ─── LOADING STATE ─── */
        .m-loading-msg {
          display: flex; align-items: center; gap: 12px;
          font-size: 13px; font-weight: 600;
          color: #c8c4e0; margin-bottom: 12px; padding: 14px 16px;
          background: #14142a; border: 1px solid #22c55e22; border-radius: 10px;
          animation: fadeUp 0.3s ease;
        }
        .m-loading-spinner { font-size: 20px; flex-shrink: 0; color: #22c55e; }
        .m-loading-main { font-size: 13px; font-weight: 600; color: #c8c4e0; }
        .m-loading-sub { font-size: 11px; font-weight: 500; color: #6b698a; margin-top: 2px; }

        /* ─── OUTPUT ─── */
        .m-output-wrap { margin-top: 20px; animation: fadeUp 0.4s ease; }
        .m-output {
          background: #0e0e1c; border: 1px solid #22c55e1c;
          border-radius: 12px; padding: 18px 18px 16px;
          font-family: 'DM Mono', 'Courier New', monospace;
          font-size: 13px; line-height: 1.9; color: #d8d4f4;
          white-space: pre-wrap; word-break: break-word;
        }

        .m-dop0 { margin-top: 10px; font-size: 13px; font-weight: 700; color: #4ade80; animation: fadeUp 0.5s ease 0.05s both; }
        .m-dop1 { margin-top: 4px; font-size: 13px; font-weight: 600; color: #22c55e; animation: fadeUp 0.5s ease 0.12s both; }
        .m-dop2 { margin-top: 4px; font-size: 12px; font-weight: 600; color: #c8c4e0; animation: fadeUp 0.5s ease 0.2s both; }
        .m-dop3 { margin-top: 4px; font-size: 12px; font-weight: 600; color: #7dd3fc; animation: fadeUp 0.5s ease 0.28s both; }

        .m-copy-main {
          padding: 11px 24px; font-size: 14px; font-weight: 800;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #051a08; border: none; border-radius: 9px;
          cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 16px #22c55e22;
        }
        .m-copy-main:hover { transform: scale(1.04); box-shadow: 0 8px 24px #22c55e33; }
        .m-copy-main:active { transform: scale(0.98); box-shadow: none; }
        .m-copy-main.ok {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          color: #0a1a0a; box-shadow: 0 4px 16px #4ade8022;
          animation: copyPop 0.35s ease;
        }

        .m-use-real {
          font-size: 13px; font-weight: 500; color: #b8b4d4; text-align: center;
          padding: 10px 16px; margin-bottom: 18px;
          border: 1px solid #2a2740; border-radius: 9px; background: #14142a;
          line-height: 1.5;
        }

        .m-regen-hint {
          font-size: 12px; font-weight: 500; color: #a1a1aa;
          text-align: center; margin-top: 14px; margin-bottom: 6px;
          font-style: italic;
        }

        .m-next-step {
          margin-top: 14px; padding: 13px 15px;
          background: #14142a; border: 1px solid #2a2740; border-radius: 10px;
          animation: fadeUp 0.5s ease 0.3s both;
        }
        .m-next-step-lbl { font-size: 9px; font-weight: 700; color: #6b698a; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 5px; }
        .m-next-step-text { font-size: 13px; font-weight: 600; color: #c8c4e0; line-height: 1.4; }

        .m-output-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 13px; flex-wrap: wrap; gap: 8px; }
        .m-trust {
          display: flex; align-items: center; gap: 6px;
          background: #0a1408; border: 1px solid #1a3d1a22;
          border-radius: 20px; padding: 5px 13px;
          font-size: 11px; font-weight: 500; color: #4ade8088;
        }
        .m-trust-dot { width: 5px; height: 5px; border-radius: 50%; background: #4ade80; flex-shrink: 0; }

        .m-copy {
          background: #22c55e18; border: 1px solid #22c55e44;
          color: #22c55e; border-radius: 9px; padding: 9px 20px;
          font-family: 'Inter', sans-serif; font-size: 13px;
          font-weight: 700; cursor: pointer; transition: all 0.18s;
          white-space: nowrap;
        }
        .m-copy:hover { background: #22c55e; color: #051a08; transform: scale(1.03); }
        .m-copy.ok {
          background: #4ade8020; border-color: #4ade8044; color: #4ade80;
          animation: copyPop 0.35s ease;
        }

        /* ─── BIBLIOTECA ─── */
        .m-lib-bg {
          position: fixed; inset: 0; z-index: 60;
          background: rgba(5,5,15,0.85); backdrop-filter: blur(10px);
          display: flex; align-items: flex-end; justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        .m-lib-panel {
          background: #12122a; border: 1px solid #2a2740;
          border-radius: 20px 20px 0 0; width: 100%; max-width: 600px;
          height: 92vh; display: flex; flex-direction: column;
          animation: slideUp 0.3s ease;
        }
        .m-lib-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 20px 20px 0; flex-shrink: 0;
        }
        .m-lib-title {
          font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800;
          color: #f4f2ff; letter-spacing: -0.4px;
        }
        .m-lib-count {
          font-size: 12px; font-weight: 600; color: #22c55e; margin-top: 2px;
        }
        .m-lib-close {
          background: #1c1c38; border: 1px solid #2a2740; border-radius: 8px;
          color: #9896b8; font-size: 14px; cursor: pointer; padding: 6px 10px;
          transition: all 0.17s; font-family: 'Inter', sans-serif;
        }
        .m-lib-close:hover { background: #2a2740; color: #f4f2ff; }
        .m-lib-search {
          margin: 14px 20px 0; background: #1c1c38; border: 1px solid #2a2740;
          border-radius: 10px; padding: 11px 15px; color: #e8e6f4;
          font-family: 'Inter', sans-serif; font-size: 14px; outline: none;
          width: calc(100% - 40px); flex-shrink: 0; transition: border-color 0.2s;
        }
        .m-lib-search:focus { border-color: #22c55e55; }
        .m-lib-search::placeholder { color: #45436a; }
        .m-lib-tabs {
          display: flex; gap: 6px; padding: 12px 20px 0;
          overflow-x: auto; flex-shrink: 0;
          scrollbar-width: none;
        }
        .m-lib-tabs::-webkit-scrollbar { display: none; }
        .m-lib-tab {
          display: flex; align-items: center; gap: 5px; flex-shrink: 0;
          background: #1c1c38; border: 1px solid #2a2740; border-radius: 8px;
          padding: 7px 11px; cursor: pointer; color: #6b698a;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          transition: all 0.17s;
        }
        .m-lib-tab.active { background: #061a0e; border-color: #22c55e55; color: #22c55e; }
        .m-lib-tab:hover:not(.active) { border-color: #22c55e33; color: #c8c4e0; }
        .m-lib-tab-name { display: none; }
        @media (min-width: 400px) { .m-lib-tab-name { display: inline; } }
        .m-lib-tab-count {
          background: #2a2740; border-radius: 10px; padding: 1px 6px;
          font-size: 10px; color: #9896b8;
        }
        .m-lib-tab.active .m-lib-tab-count { background: #22c55e20; color: #22c55e; }
        .m-lib-list {
          flex: 1; overflow-y: auto; padding: 14px 20px 32px;
          scrollbar-width: thin; scrollbar-color: #2a2740 transparent;
        }
        .m-lib-group { margin-bottom: 20px; }
        .m-lib-cat {
          font-size: 10px; font-weight: 700; color: #22c55e77;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;
        }
        .m-lib-item {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; width: 100%; background: #1c1c38;
          border: 1px solid #2a2740; border-radius: 10px;
          padding: 12px 14px; margin-bottom: 6px; cursor: pointer;
          text-align: left; transition: all 0.17s;
          font-family: 'Inter', sans-serif;
        }
        .m-lib-item:hover { border-color: #22c55e55; background: #061a0e; }
        .m-lib-item:hover .m-lib-item-use { color: #22c55e; }
        .m-lib-item:active { transform: scale(0.99); }
        .m-lib-item-text { font-size: 13px; font-weight: 500; color: #c8c4e0; line-height: 1.4; }
        .m-lib-item-use { font-size: 12px; font-weight: 700; color: #45436a; flex-shrink: 0; transition: color 0.17s; }
        .m-lib-empty { text-align: center; color: #6b698a; font-size: 13px; padding: 32px 0; }

        /* ─── MODAL ─── */
        .m-modal-bg {
          min-height: 100vh; background: rgba(5,5,15,0.92);
          display: flex; align-items: center; justify-content: center;
          position: fixed; inset: 0; z-index: 50;
          animation: fadeIn 0.2s ease; backdrop-filter: blur(12px);
          padding: 16px;
        }
        .m-modal {
          background: #14142a; border: 1px solid #22c55e44;
          border-radius: 20px; padding: 28px 22px;
          max-width: 360px; width: 100%; animation: slideUp 0.3s ease;
          max-height: 92vh; overflow-y: auto;
        }
        .m-modal-icon { text-align: center; font-size: 30px; margin-bottom: 10px; }
        .m-modal-title {
          font-family: 'Syne', sans-serif;
          text-align: center; font-size: 19px; font-weight: 800;
          color: #f4f2ff; margin-bottom: 10px; letter-spacing: -0.4px;
        }
        .m-modal-narrative {
          text-align: center; font-size: 14px; font-weight: 500;
          color: #c8c4e8; line-height: 1.7; margin-bottom: 18px;
        }

        .m-modal-tiers { display: flex; flex-direction: column; gap: 7px; margin-bottom: 16px; }
        .m-modal-tier {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 13px; border-radius: 10px;
          border: 1px solid #2a2740; background: #1c1c38;
        }
        .m-modal-tier-icon { font-size: 16px; flex-shrink: 0; }
        .m-modal-tier-title { font-size: 12px; font-weight: 700; color: #c8c4e8; }
        .m-modal-tier-sub { font-size: 10px; font-weight: 500; color: #55537a; margin-top: 1px; }
        .m-modal-tier.hl { border-color: #22c55e44; background: #061a0e; }
        .m-modal-tier.hl .m-modal-tier-title { color: #22c55e; }

        .m-modal-vps {
          display: flex; flex-direction: column; gap: 6px;
          margin-bottom: 16px; padding: 12px 14px;
          background: #22c55e08; border: 1px solid #22c55e18; border-radius: 10px;
        }
        .m-vp { font-size: 13px; font-weight: 600; color: #d8d4f4; display: flex; align-items: center; gap: 8px; }

        .m-price-box {
          background: #0e0e1c; border: 1px solid #22c55e2a;
          border-radius: 10px; padding: 14px; text-align: center; margin-bottom: 14px;
        }
        .m-price-tag { font-size: 9px; font-weight: 700; color: #9896b8; letter-spacing: 1.5px; margin-bottom: 4px; text-transform: uppercase; }
        .m-price-val { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; color: #22c55e; line-height: 1; }
        .m-price-note { font-size: 11px; font-weight: 500; color: #9896b8; margin-top: 5px; }

        .m-features { display: flex; flex-direction: column; gap: 7px; margin-bottom: 14px; }
        .m-feat { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; font-weight: 500; color: #c8c4e8; line-height: 1.4; }
        .m-feat-check { color: #4ade80; font-size: 12px; flex-shrink: 0; margin-top: 1px; }

        .m-urgency { text-align: center; font-size: 10px; font-weight: 600; color: #22c55e77; margin-bottom: 12px; letter-spacing: 0.3px; }
        .m-modal-guarantee { text-align: center; font-size: 11px; font-weight: 500; color: #9896b8; margin-top: 8px; }

        /* ─── VALUE STACK ─── */
        .m-value-stack {
          background: #0e0e1c; border: 1px solid #22c55e1a;
          border-radius: 12px; padding: 14px 16px; margin-bottom: 12px;
        }
        .m-value-stack-title {
          font-size: 9px; font-weight: 700; color: #22c55e88;
          text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 10px;
        }
        .m-value-items { display: flex; flex-direction: column; gap: 8px; }
        .m-value-item {
          display: flex; align-items: center; gap: 12px;
        }
        .m-value-qty {
          font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800;
          color: #22c55e; min-width: 44px; text-align: right; line-height: 1;
          flex-shrink: 0;
        }
        .m-value-label {
          font-size: 12px; font-weight: 500; color: #c8c4e0; line-height: 1.35;
        }

        /* ─── VALUE COMPARE ─── */
        .m-value-compare {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 10px; padding: 8px 14px;
          background: #061408; border: 1px solid #22c55e22; border-radius: 9px;
          font-size: 13px; font-weight: 700;
        }
        .m-value-original { color: #6b698a; }
        .m-value-original s { color: #55537a; }
        .m-value-arrow { color: #22c55e66; }
        .m-value-final { color: #22c55e; }

        /* ─── CTA BUTTON UPGRADE ─── */
        .m-btn-cta {
          display: flex; flex-direction: column; align-items: center;
          gap: 3px; padding: 14px 20px;
        }
        .m-btn-cta-main {
          font-size: 15px; font-weight: 800; line-height: 1.2;
        }
        .m-btn-cta-sub {
          font-size: 10px; font-weight: 600; opacity: 0.7;
          letter-spacing: 0.2px;
        }
        .m-modal-close {
          background: none; border: none; color: #3d3b60;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
          cursor: pointer; width: 100%; padding: 10px; text-align: center; transition: color 0.2s;
        }
        .m-modal-close:hover { color: #9896b8; }

        /* ─── CHAT INTERFACE ─── */
        .m-chat-wrap {
          margin-top: 20px; display: flex; flex-direction: column; gap: 16px;
          animation: fadeUp 0.4s ease;
        }
        .m-chat-user {
          display: flex; justify-content: flex-end;
        }
        .m-chat-user-bubble {
          background: #1e1040; border: 1px solid #3a2860;
          border-radius: 16px 16px 4px 16px;
          padding: 12px 16px; max-width: 85%;
          font-size: 13px; font-weight: 500; color: #c8c4e0; line-height: 1.6;
          word-break: break-word;
        }
        .m-chat-ai { display: flex; gap: 10px; align-items: flex-start; }
        .m-chat-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; color: #051a08;
          font-family: 'Syne', sans-serif; margin-top: 2px;
        }
        .m-chat-ai-bubble {
          background: #14142a; border: 1px solid #2a2740;
          border-radius: 4px 16px 16px 16px;
          padding: 16px 18px; flex: 1;
          font-family: 'Inter', sans-serif;
          font-size: 13px; line-height: 1.85; color: #d8d4f4;
          white-space: pre-wrap; word-break: break-word;
        }
        .m-chat-ai-label {
          font-size: 10px; font-weight: 700; color: #22c55e88;
          letter-spacing: 0.8px; text-transform: uppercase;
          margin-bottom: 8px;
        }
        .m-chat-actions {
          display: flex; justify-content: flex-end; gap: 8px;
          margin-top: 12px; flex-wrap: wrap;
        }

        /* ─── FOOTER ─── */
        .m-footer {
          margin-top: 44px; text-align: center;
          font-size: 11px; font-weight: 500; color: #2a2848;
          letter-spacing: 0.3px; line-height: 1.6;
        }
        .m-footer-tagline { color: #45436a; margin-top: 3px; font-size: 10px; }

        /* ─── ANIMATIONS ─── */
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #4ade8066; }
          50% { opacity: 0.5; box-shadow: none; }
        }
        /* ─── HOME SCREEN ─── */
        .m-home-wrap { animation: fadeUp 0.3s ease; }
        .m-trust-strip {
          display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px;
        }
        .m-trust-badge {
          font-size: 10px; font-weight: 700; color: #4ade80;
          background: #4ade8010; border: 1px solid #4ade8025;
          border-radius: 20px; padding: 4px 10px; letter-spacing: 0.2px;
        }
        .m-home-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px; font-weight: 800; color: #f4f2ff;
          letter-spacing: -1px; line-height: 1.15; margin-bottom: 8px;
        }
        .m-home-sub {
          font-size: 13.5px; font-weight: 500; color: #6b698a;
          margin-bottom: 18px; line-height: 1.5;
        }

        /* ─── CATEGORY NAV ─── */
        .m-cat-nav-wrap {
          position: relative; margin-bottom: 16px;
        }
        .m-cat-nav-wrap::after {
          content: ''; position: absolute;
          right: 0; top: 0; bottom: 4px; width: 36px;
          background: linear-gradient(to right, transparent, #10101d);
          pointer-events: none; z-index: 1;
        }
        .m-cat-nav {
          display: flex; gap: 7px; overflow-x: auto;
          padding-bottom: 4px; padding-right: 36px;
          scrollbar-width: thin; scrollbar-color: #2a2740 transparent;
          -webkit-overflow-scrolling: touch;
        }
        .m-cat-nav::-webkit-scrollbar { height: 3px; }
        .m-cat-nav::-webkit-scrollbar-track { background: transparent; }
        .m-cat-nav::-webkit-scrollbar-thumb { background: #2a2740; border-radius: 4px; }
        .m-cat-btn {
          flex-shrink: 0; padding: 7px 14px; border-radius: 20px;
          background: #14142a; border: 1px solid #2a2740;
          font-size: 12px; font-weight: 600; color: #8b89a8;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
          font-family: 'Inter', sans-serif;
        }
        .m-cat-btn:hover { border-color: #22c55e33; color: #22c55e; }
        .m-cat-btn.active {
          background: #061408; border-color: #22c55e55; color: #22c55e;
          box-shadow: 0 0 10px #22c55e18;
        }

        /* ─── FLOW GRID ─── */
        .m-flow-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; margin-bottom: 20px;
        }
        .m-flow-card {
          background: #14142a; border: 1px solid #2a2740;
          border-radius: 14px; padding: 14px 14px 12px;
          text-align: left; cursor: pointer;
          transition: all 0.2s; display: flex; flex-direction: column; gap: 5px;
        }
        .m-flow-card:hover {
          background: #0c1c10; border-color: #22c55e44;
          transform: translateY(-3px); box-shadow: 0 8px 24px #22c55e0d;
        }
        .m-flow-card:active { transform: translateY(0) scale(0.982); transition: transform 0.1s; }
        .m-flow-card.m-flow-highlight {
          background: linear-gradient(135deg, #061a0d 0%, #0a1a10 100%);
          border: 1px solid #22c55e40;
          box-shadow: 0 0 16px #22c55e0a;
        }
        .m-flow-card.m-flow-highlight .m-flow-arrow { color: #22c55e; }
        .m-flow-card.m-flow-highlight:hover { border-color: #22c55e88; box-shadow: 0 8px 24px #22c55e15; }
        .m-flow-card-top { display: flex; align-items: center; justify-content: space-between; }
        .m-flow-emoji { font-size: 22px; line-height: 1; }
        .m-flow-badge {
          font-size: 9px; font-weight: 800; letter-spacing: 0.8px;
          background: #22c55e; color: #051a08;
          padding: 2px 7px; border-radius: 4px;
        }
        .m-flow-title {
          font-size: 13px; font-weight: 700; color: #e8e6f4; line-height: 1.3;
        }
        .m-flow-sub {
          font-size: 11px; font-weight: 500; color: #6b698a; line-height: 1.4;
        }
        .m-flow-arrow {
          font-size: 11px; font-weight: 700; color: #22c55e; margin-top: 2px;
        }

        /* ─── MODELOS PRONTOS ─── */
        .m-models-section { margin-bottom: 18px; }
        .m-models-label {
          font-size: 10px; font-weight: 700; color: #55537a;
          letter-spacing: 1px; text-transform: uppercase;
          margin-bottom: 10px;
        }
        .m-models-strip {
          display: flex; flex-wrap: wrap; gap: 7px;
        }
        .m-model-btn {
          font-size: 12px; font-weight: 600; color: #c8c4e0;
          background: #0e0e1c; border: 1px solid #2a2740;
          border-radius: 20px; padding: 7px 14px;
          cursor: pointer; transition: all 0.18s; white-space: nowrap;
        }
        .m-model-btn:hover { background: #061408; border-color: #22c55e44; color: #22c55e; }

        /* ─── SECONDARY ACTIONS ─── */
        .m-home-secondary {
          display: flex; gap: 8px; margin-bottom: 4px;
        }
        .m-secondary-action {
          flex: 1; font-size: 12px; font-weight: 600; color: #8b89a8;
          background: #0e0e1c; border: 1px solid #2a2740; border-radius: 9px;
          padding: 10px 12px; cursor: pointer; transition: all 0.18s;
          text-align: center;
        }
        .m-secondary-action:hover { background: #14142a; color: #c8c4e0; border-color: #3a3760; }

        /* ─── GUIDED FORM ─── */
        .m-guided-wrap { animation: fadeUp 0.3s ease; }
        .m-guided-header {
          text-align: center; padding: 18px 16px 16px;
          background: linear-gradient(160deg, #16162c 0%, #10101d 100%);
          border: 1px solid #2a2740; border-radius: 14px;
          margin-bottom: 18px;
        }
        .m-guided-emoji { font-size: 32px; line-height: 1; margin-bottom: 8px; }
        .m-guided-title {
          font-family: 'Syne', sans-serif;
          font-size: 19px; font-weight: 800; color: #f4f2ff;
          letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 6px;
        }
        .m-guided-sub {
          font-size: 13px; font-weight: 500; color: #8b89a8; line-height: 1.5;
        }
        .m-guided-form { display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px; }
        .m-guided-form-label {
          font-size: 11px; font-weight: 700; color: #22c55e;
          letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px;
        }
        .m-guided-field { display: flex; flex-direction: column; gap: 6px; }
        .m-guided-label {
          font-size: 13px; font-weight: 600; color: #c8c4e0; line-height: 1.4;
        }
        .m-guided-select {
          background: #14142a; border: 1px solid #2a2740; border-radius: 10px;
          color: #e8e6f4; font-size: 14px; font-weight: 500;
          padding: 12px 14px; width: 100%; outline: none;
          font-family: 'Inter', sans-serif; cursor: pointer;
          transition: border-color 0.18s; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b698a' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center;
          padding-right: 36px;
        }
        .m-guided-select:focus { border-color: #22c55e55; }
        .m-guided-select option { background: #14142a; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes copyPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .spin { display: inline-block; animation: spin 1s linear infinite; }

        /* ─── HOME HERO ─── */
        .m-home-hero {
          text-align: center; padding: 36px 16px 28px; margin-bottom: 20px;
        }
        .m-home-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; color: #22c55e; letter-spacing: 1px;
          text-transform: uppercase; margin-bottom: 18px;
          background: #22c55e12; border: 1px solid #22c55e28;
          border-radius: 20px; padding: 5px 16px;
        }
        .m-home-headline {
          font-family: 'Syne', sans-serif;
          font-size: 34px; font-weight: 800; color: #f4f2ff;
          letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 14px;
        }
        .m-home-headline em { color: #22c55e; font-style: normal; }
        .m-home-subline {
          font-size: 15px; font-weight: 500; color: #8b89a8;
          line-height: 1.65; margin-bottom: 22px;
        }
        .m-home-cta-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #051a08; font-family: 'Inter', sans-serif;
          font-size: 15px; font-weight: 800;
          padding: 14px 32px; border-radius: 12px;
          border: none; cursor: pointer; margin-bottom: 22px;
          box-shadow: 0 4px 24px #22c55e25; transition: all 0.2s;
          letter-spacing: -0.2px;
        }
        .m-home-cta-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 36px #22c55e35; }
        .m-home-cta-btn:active { transform: translateY(0) scale(0.975); }
        .m-home-stats {
          display: flex; justify-content: center; align-items: center;
          gap: 10px; flex-wrap: wrap;
        }
        .m-home-stat {
          font-size: 12px; font-weight: 600; color: #45436a;
        }
        .m-home-stat strong { color: #4ade80; font-weight: 800; }
        .m-home-stat-dot { font-size: 14px; color: #2a2848; }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 480px) {
          .m-root { padding: 18px 14px 80px; }
          .m-header { flex-direction: row; align-items: center; }
          .m-hero-title { font-size: 20px; letter-spacing: -0.3px; line-height: 1.25; }
          .m-hero-sub { font-size: 13px; }
          .m-modal { padding: 22px 16px; border-radius: 16px; }
          .m-btn { font-size: 14px; padding: 14px 16px; }
          .m-intents-title { font-size: 17px; letter-spacing: -0.2px; }
          .m-tagline { font-size: 13px; line-height: 1.4; }
          .m-positioning { font-size: 12px; }
          .m-home-title { font-size: 19px; }
          .m-home-headline { font-size: 26px; letter-spacing: -0.8px; }
          .m-home-subline { font-size: 13.5px; }
          .m-home-cta-btn { font-size: 14px; padding: 13px 24px; }
          .m-flow-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
          .m-flow-card { padding: 12px 11px 10px; }
          .m-flow-title { font-size: 12px; }
          .m-flow-sub { font-size: 10.5px; }
          .m-flow-emoji { font-size: 19px; }
          .m-models-strip { gap: 6px; }
          .m-model-btn { font-size: 11.5px; padding: 6px 12px; }
          .m-home-secondary { flex-direction: column; }
          .m-guided-title { font-size: 17px; }
        }
      `}</style>

      <div className="m-root">
        <div className="m-inner">

          {/* ── HEADER ── */}
          <div className="m-header">
            <div>
              <div className="m-logo">
                Motor<em>IA</em>
                <span className="m-logo-badge">PRO</span>
              </div>
              <div className="m-tagline">Preenche pouco. Recebe pronto.</div>
            </div>
            <div className="m-header-pill" style={{ color: freeUses > 0 ? "#4ade80" : "#ef4444" }}>
              <div className="m-dot" style={{ background: freeUses > 0 ? "#4ade80" : "#ef4444", boxShadow: freeUses > 0 ? "0 0 6px #4ade8066" : "none", animation: "none" }} />
              {freeUses > 0 ? `${freeUses} grátis restante${freeUses > 1 ? "s" : ""}` : "Grátis esgotado"}
            </div>
          </div>

          {/* ── STATUS ── */}
          <div className="m-status">
            <div className="m-dot" />
            <span className="m-status-text">Sem login · Sem mensalidade · Resposta em segundos</span>
          </div>

          {/* ══════════════════════════════════════ */}
          {/* ── TELA HOME ── */}
          {/* ══════════════════════════════════════ */}
          {screen === "home" && (
            <div className="m-home-wrap">

              {/* Hero */}
              <div className="m-home-hero">
                <div className="m-home-eyebrow">✦ Motor de conteúdo com IA</div>
                <h1 className="m-home-headline">Escreve pra você<br/>em <em>segundos</em></h1>
                <p className="m-home-subline">Sem precisar saber de prompt.<br/>Preenche uma linha. A IA entrega pronto.</p>
                <button
                  className="m-home-cta-btn"
                  onClick={() => flowGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  Começar agora →
                </button>
                <div className="m-home-stats">
                  <span className="m-home-stat"><strong>+500</strong> comandos prontos</span>
                  <span className="m-home-stat-dot">·</span>
                  <span className="m-home-stat">Sem login</span>
                  <span className="m-home-stat-dot">·</span>
                  <span className="m-home-stat">Resultado em segundos</span>
                </div>
              </div>

              {/* Category navigation */}
              <div className="m-cat-nav-wrap">
                <div className="m-cat-nav">
                  {NAV_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      className={`m-cat-btn${activeCategory === cat.id ? " active" : ""}`}
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flow cards */}
              <div className="m-flow-grid" ref={flowGridRef}>
                {(activeCategory === "todos"
                  ? GUIDED_FLOWS
                  : GUIDED_FLOWS.filter(f =>
                      NAV_CATEGORIES.find(c => c.id === activeCategory)?.flows?.includes(f.id)
                    )
                ).map(flow => (
                  <button
                    key={flow.id}
                    className={`m-flow-card${flow.highlight ? " m-flow-highlight" : ""}`}
                    onClick={() => handleFlowSelect(flow)}
                  >
                    <div className="m-flow-card-top">
                      <span className="m-flow-emoji">{flow.emoji}</span>
                      {flow.highlight && <span className="m-flow-badge">MAIS FÁCIL</span>}
                    </div>
                    <div className="m-flow-title">{flow.title}</div>
                    <div className="m-flow-sub">{flow.sub}</div>
                    <div className="m-flow-arrow">Começar →</div>
                  </button>
                ))}
              </div>

              {/* Modelos prontos */}
              <div className="m-models-section">
                <div className="m-models-label">Escolha um modelo pronto — clique e já começa</div>
                <div className="m-models-strip">
                  {QUICK_MODELS.map(m => (
                    <button key={m.id} className="m-model-btn" onClick={() => handleQuickModel(m)}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary actions */}
              <div className="m-home-secondary">
                <button className="m-secondary-action" onClick={() => { setShowLibrary(true); setLibTab("bio"); setLibSearch(""); }}>
                  📚 Ver +500 prompts prontos
                </button>
                <button className="m-secondary-action" onClick={() => { setScreen("tool"); setShowIntents(false); setShowOutput(false); }}>
                  ✏️ Modo livre
                </button>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════ */}
          {/* ── TELA FLUXO GUIADO ── */}
          {/* ══════════════════════════════════════ */}
          {screen === "guided" && activeFlow && (
            <div className="m-guided-wrap">

              <button className="m-back-btn" onClick={() => { setScreen("home"); setShowOutput(false); setOutput(""); setUserMessage(""); lastCallRef.current = ""; }}>
                ← Voltar
              </button>

              {/* Header do fluxo */}
              <div className="m-guided-header">
                <div className="m-guided-emoji">{activeFlow.emoji}</div>
                <div className="m-guided-title">{activeFlow.title}</div>
                <div className="m-guided-sub">{activeFlow.sub}</div>
              </div>

              {/* Campos do formulário */}
              {!showOutput && (
                <div className="m-guided-form">
                  <div className="m-guided-form-label">Preencha pouco. Receba pronto.</div>
                  {activeFlow.fields.map(field => (
                    <div key={field.key} className="m-guided-field">
                      <label className="m-guided-label">{field.label}</label>
                      {field.type === "select" ? (
                        <select
                          className="m-guided-select"
                          value={guidedInputs[field.key] || ""}
                          onChange={e => setGuidedInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                        >
                          <option value="">Selecione...</option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <textarea
                          className="m-textarea"
                          rows={field.rows || 2}
                          placeholder={field.placeholder}
                          value={guidedInputs[field.key] || ""}
                          onChange={e => setGuidedInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pressure banners */}
              {freeUses > 0 && freeUses <= 2 && (
                <div className={`m-pressure${freeUses === 1 ? " m-pressure-urgent" : ""}`}>
                  {freeUses === 2 ? "⚠️ Você ainda tem 2 usos grátis" : "🚨 Último uso gratuito disponível"}
                </div>
              )}
              {freeUses === 0 && !showOutput && (
                <div className="m-pressure m-pressure-locked" onClick={() => setShowModal(true)}>
                  🔒 Desbloqueie o modo completo para continuar
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="m-loading-msg">
                  <div className="m-loading-spinner"><span className="spin">⟳</span></div>
                  <div>
                    <div className="m-loading-main">A IA está montando tudo pra você{dots}</div>
                    <div className="m-loading-sub">Só um segundo — vai sair completo e pronto para usar</div>
                  </div>
                </div>
              )}

              {/* Botão gerar */}
              {!showOutput && (
                <button
                  className={`m-btn ${freeUses <= 0 ? "m-btn-lock" : "m-btn-active"}`}
                  onClick={handleGuidedGenerate}
                  disabled={loading || freeUses <= 0}
                  style={{ marginTop: 8 }}
                >
                  {loading
                    ? <><span className="spin">⟳</span>&nbsp; Gerando{dots}</>
                    : freeUses <= 0
                      ? "🔒 Ver acesso completo"
                      : `Gerar ${activeFlow.title} agora`}
                </button>
              )}

              {/* Chat output */}
              {(showOutput || loading) && (
                <div className="m-chat-wrap">
                  {loading && (
                    <div className="m-chat-ai">
                      <div className="m-chat-avatar">M</div>
                      <div className="m-chat-ai-bubble" style={{ color: "#6b698a" }}>
                        <div className="m-chat-ai-label">Motor IA</div>
                        <span className="spin" style={{ fontSize: 18, color: "#4ade80" }}>⟳</span>
                        {"  "}Montando tudo pra você{dots}
                      </div>
                    </div>
                  )}
                  {showOutput && output && !loading && (
                    <div className="m-chat-ai">
                      <div className="m-chat-avatar">M</div>
                      <div className="m-chat-ai-bubble">
                        <div className="m-chat-ai-label">Motor IA · Pronto para usar — só copiar</div>
                        {output}
                        <div className="m-chat-actions" style={{ marginTop: 14 }}>
                          <button
                            className="m-btn-secondary"
                            style={{ marginTop: 0, flex: 1 }}
                            onClick={() => { setShowOutput(false); setOutput(""); setUserMessage(""); lastCallRef.current = ""; }}
                          >
                            ← Editar informações
                          </button>
                          <button className={`m-copy m-copy-main${copied ? " ok" : ""}`} onClick={handleCopy}>
                            {copied ? "✔ Copiado!" : "📋 Copiar tudo"}
                          </button>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <button
                            className="m-btn-secondary"
                            style={{ marginTop: 0, width: "100%" }}
                            onClick={() => { lastCallRef.current = ""; handleGuidedGenerate(); }}
                          >
                            🔄 Gerar outra versão
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ══════════════════════════════════════ */}
          {/* ── TELA MODO LIVRE (ferramenta direta) ── */}
          {/* ══════════════════════════════════════ */}
          {screen === "tool" && (
            <>
              {/* Progress steps */}
              <div className="m-steps">
                {[{ n: 1, lbl: "Escolha" }, { n: 2, lbl: "Descreva" }, { n: 3, lbl: "Copie e use" }].map(({ n, lbl }) => (
                  <div key={n} className={`m-step ${step === n ? "active" : step > n ? "done" : ""}`}>
                    <div className="m-step-dot">{step > n ? "✓" : n}</div>
                    <div className="m-step-lbl">{lbl}</div>
                  </div>
                ))}
              </div>

              {/* Tool grid */}
              <div className="m-tools">
                {TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    className={`m-tool${selectedTool === tool.id ? " active" : ""}`}
                    onClick={() => handleSelectTool(tool.id)}
                  >
                    <div className="m-tool-top">
                      <span className="m-tool-icon">{tool.icon}</span>
                      {tool.free
                        ? <span className="badge badge-free">GRÁTIS</span>
                        : <span className="badge badge-lock">🔒 TURBO</span>}
                    </div>
                    <div className="m-tool-label">{tool.label}</div>
                    <div className="m-tool-sub">{tool.sub}</div>
                  </button>
                ))}
              </div>

              <div className="m-input-label">
                Descreva o que você quer criar — <span>não precisa saber nada</span>
              </div>
              <div className="m-input-hint">A IA monta tudo por você em segundos.</div>

              <textarea
                className="m-textarea"
                rows={4}
                placeholder={PLACEHOLDERS[selectedTool]}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />

              <div className="m-example-row">
                <span className="m-example-lbl">Exemplo</span>
                <button
                  className="m-example-chip"
                  onClick={() => setInput(EXAMPLES[selectedTool])}
                  title={EXAMPLES[selectedTool]}
                >
                  {EXAMPLES[selectedTool].length > 50
                    ? EXAMPLES[selectedTool].slice(0, 50) + "…"
                    : EXAMPLES[selectedTool]}
                </button>
              </div>

              {!isTurbo && freeUses > 0 && freeUses <= 2 && (
                <div className={`m-pressure${freeUses === 1 ? " m-pressure-urgent" : ""}`}>
                  {freeUses === 2 ? "⚠️ Você ainda tem 2 usos grátis" : "🚨 Último uso gratuito disponível"}
                </div>
              )}
              {!isTurbo && freeUses === 0 && (
                <div className="m-pressure m-pressure-locked" onClick={() => setShowModal(true)}>
                  🔒 Desbloqueie o modo completo para continuar
                </div>
              )}

              {loading && (
                <div className="m-loading-msg">
                  <div className="m-loading-spinner"><span className="spin">⟳</span></div>
                  <div>
                    <div className="m-loading-main">A IA está organizando isso pra você{dots}</div>
                    <div className="m-loading-sub">Só um segundo — vai sair pronto</div>
                  </div>
                </div>
              )}

              <button
                className={`m-btn ${isTurbo || freeUses <= 0 ? "m-btn-lock" : "m-btn-active"}`}
                onClick={handleGenerate}
                disabled={loading || (!isTurbo && freeUses > 0 && input.trim().length < 10)}
              >
                {loading
                  ? <><span className="spin">⟳</span>&nbsp; Gerando{dots}</>
                  : getButtonLabel()}
              </button>

              {(userMessage || showOutput) && (
                <div className="m-chat-wrap">
                  {userMessage && (
                    <div className="m-chat-user">
                      <div className="m-chat-user-bubble">{userMessage}</div>
                    </div>
                  )}
                  {loading && (
                    <div className="m-chat-ai">
                      <div className="m-chat-avatar">M</div>
                      <div className="m-chat-ai-bubble" style={{ color: "#6b698a" }}>
                        <div className="m-chat-ai-label">Motor IA</div>
                        <span className="spin" style={{ fontSize: 18, color: "#4ade80" }}>⟳</span>
                        {"  "}Gerando sua resposta{dots}
                      </div>
                    </div>
                  )}
                  {showOutput && output && !loading && (
                    <div className="m-chat-ai">
                      <div className="m-chat-avatar">M</div>
                      <div className="m-chat-ai-bubble">
                        <div className="m-chat-ai-label">Motor IA · {TRUST_COPIES[trustIdx]}</div>
                        {output}
                        <div className="m-chat-actions">
                          <div className="m-next-step" style={{ flex: 1, marginTop: 0 }}>
                            <div className="m-next-step-lbl">Próximo passo</div>
                            <div className="m-next-step-text">👉 {NEXT_STEPS[selectedTool]}</div>
                          </div>
                        </div>
                        <div className="m-chat-actions">
                          <button className="m-btn-secondary" style={{ marginTop: 0, flex: 1 }} onClick={handleRegenerate}>
                            🔄 Gerar outra versão
                          </button>
                          <button className={`m-copy m-copy-main${copied ? " ok" : ""}`} onClick={handleCopy}>
                            {copied ? "✔ Copiado!" : "📋 Copiar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button className="m-back-btn" onClick={() => { setScreen("home"); setShowOutput(false); setOutput(""); setInput(""); setUserMessage(""); }}>
                ← Voltar ao início
              </button>
            </>
          )}

          {/* ── FOOTER ── */}
          <div className="m-footer">
            MOTOR IA PRO · JEAN LUCCA · RENDA COM IA
            <div className="m-footer-tagline">Preenche pouco. Recebe pronto. Sem aprender IA.</div>
          </div>

        </div>
      </div>

      {/* ── BIBLIOTECA DE PROMPTS ── */}
      {showLibrary && (
        <div className="m-lib-bg">
          <div className="m-lib-panel">
            <div className="m-lib-header">
              <div>
                <div className="m-lib-title">Biblioteca de Prompts</div>
                <div className="m-lib-count">{PROMPT_LIBRARY.length}+ prontos pra usar</div>
              </div>
              <button className="m-lib-close" onClick={() => setShowLibrary(false)}>✕</button>
            </div>

            <input
              className="m-lib-search"
              placeholder="Buscar prompt..."
              value={libSearch}
              onChange={e => setLibSearch(e.target.value)}
            />

            <div className="m-lib-tabs">
              {TOOLS.map(t => {
                const count = PROMPT_LIBRARY.filter(p => p.tool === t.id).length;
                return (
                  <button
                    key={t.id}
                    className={`m-lib-tab${libTab === t.id ? " active" : ""}`}
                    onClick={() => { setLibTab(t.id); setLibSearch(""); }}
                  >
                    <span>{t.icon}</span>
                    <span className="m-lib-tab-name">{t.tabLabel}</span>
                    <span className="m-lib-tab-count">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="m-lib-list">
              {(() => {
                const filtered = PROMPT_LIBRARY.filter(p => {
                  const matchTool = libSearch ? true : p.tool === libTab;
                  const matchSearch = libSearch
                    ? p.text.toLowerCase().includes(libSearch.toLowerCase())
                    : true;
                  return matchTool && matchSearch;
                });

                if (filtered.length === 0) return (
                  <div className="m-lib-empty">Nenhum prompt encontrado. Tenta outra busca.</div>
                );

                const cats = [...new Set(filtered.map(p => p.cat))];
                return cats.map(cat => (
                  <div key={cat} className="m-lib-group">
                    <div className="m-lib-cat">{cat}</div>
                    {filtered.filter(p => p.cat === cat).map((p, i) => (
                      <button
                        key={i}
                        className="m-lib-item"
                        onClick={() => {
                          setInput(p.text);
                          setSelectedTool(p.tool);
                          setScreen("tool");
                          setShowIntents(false);
                          setShowOutput(false);
                          setOutput("");
                          setUserMessage("");
                          setShowLibrary(false);
                        }}
                      >
                        <span className="m-lib-item-text">{p.text}</span>
                        <span className="m-lib-item-use">Usar →</span>
                      </button>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div className="m-modal-bg" onClick={() => setShowModal(false)}>
          <div className="m-modal" onClick={(e) => e.stopPropagation()}>
            <div className="m-modal-icon">⚡</div>
            <div className="m-modal-title">Acesso Completo — R$27</div>
            <div className="m-modal-narrative">
              Teste grátis agora.<br />
              <span style={{ color: "#d8d4f4" }}>Em segundos você já vê o resultado.</span><br /><br />
              Se fizer sentido pra você, desbloqueie tudo por{" "}
              <strong style={{ color: "#4ade80" }}>R$27 (pagamento único).</strong><br /><br />
              <span style={{ color: "#6b698a", fontSize: 13 }}>Menos de R$1 por dia pra nunca mais perder tempo escrevendo.</span>
            </div>

            <div className="m-modal-tiers">
              <div className="m-modal-tier">
                <span className="m-modal-tier-icon">🎁</span>
                <div>
                  <div className="m-modal-tier-title">Teste grátis</div>
                  <div className="m-modal-tier-sub">3 usos pra experimentar</div>
                </div>
              </div>
              <div className="m-modal-tier hl">
                <span className="m-modal-tier-icon">⚡</span>
                <div>
                  <div className="m-modal-tier-title">Turbo — R$27 vitalício</div>
                  <div className="m-modal-tier-sub">6 ferramentas · uso ilimitado · pra sempre</div>
                </div>
              </div>
            </div>

            <div className="m-modal-vps">
              <div className="m-vp">💸 1 venda já paga o acesso completo</div>
              <div className="m-vp">🔁 Uso ilimitado pra sempre</div>
            </div>

            <div className="m-price-box">
              <div className="m-price-tag">Oferta de validação</div>
              <div className="m-price-val">R$ 27</div>
              <div className="m-price-note">acesso vitalício · sem mensalidade · sem renovação</div>
            </div>

            {/* Value stack */}
            <div className="m-value-stack">
              <div className="m-value-stack-title">O que você leva por R$27</div>
              <div className="m-value-items">
                {[
                  { qty: "6", label: "ferramentas de IA desbloqueadas" },
                  { qty: "+500", label: "prompts e comandos prontos pra usar" },
                  { qty: "∞", label: "gerações — sem limite, sem crédito" },
                  { qty: "1x", label: "pagamento — acesso pra sempre" },
                ].map((item) => (
                  <div key={item.label} className="m-value-item">
                    <span className="m-value-qty">{item.qty}</span>
                    <span className="m-value-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Value comparison */}
            <div className="m-value-compare">
              <span className="m-value-original">Valor real: <s>R$197</s></span>
              <span className="m-value-arrow">→</span>
              <span className="m-value-final">Hoje: R$27</span>
            </div>

            <div className="m-urgency">⏱ Preço de lançamento por tempo limitado</div>

            <button
              className="m-btn m-btn-active m-btn-cta"
              style={{ marginBottom: 6 }}
              onClick={() => {
                setShowModal(false);
                window.open("https://seulink.com/checkout", "_blank");
              }}
            >
              <span className="m-btn-cta-main">Quero tudo isso por R$27 agora →</span>
              <span className="m-btn-cta-sub">+500 prompts · 6 ferramentas · uso ilimitado</span>
            </button>

            <div className="m-modal-guarantee">Sem mensalidade. Pagou uma vez, usa sempre.</div>

            <button className="m-modal-close" onClick={() => setShowModal(false)}>
              Continuar com versão gratuita
            </button>
          </div>
        </div>
      )}
    </>
  );
}
