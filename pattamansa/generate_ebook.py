from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime
import os

# Cores personalizadas para PattaMansa
COLOR_PRIMARY = colors.HexColor("#78B85C")  # Verde PattaMansa
COLOR_DARK = colors.HexColor("#333333")
COLOR_TEXT = colors.HexColor("#555555")
COLOR_LIGHT = colors.HexColor("#F5F5F5")

# Configurar documento
pdf_path = "c:\\Users\\DELL\\Desktop\\jean IA\\pattamansa\\Ebook_Adestramento_PattaMansa.pdf"
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    rightMargin=1.5*cm,
    leftMargin=1.5*cm,
    topMargin=1.5*cm,
    bottomMargin=1.5*cm
)

# Estilos
styles = getSampleStyleSheet()

# Estilo customizado para títulos principais
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=36,
    textColor=COLOR_PRIMARY,
    spaceAfter=12,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

# Estilo para subtítulos
subtitle_style = ParagraphStyle(
    'CustomSubtitle',
    parent=styles['Heading2'],
    fontSize=24,
    textColor=COLOR_PRIMARY,
    spaceAfter=12,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

# Estilo para seções
section_style = ParagraphStyle(
    'CustomSection',
    parent=styles['Heading2'],
    fontSize=20,
    textColor=COLOR_PRIMARY,
    spaceAfter=10,
    spaceBefore=10,
    fontName='Helvetica-Bold'
)

# Estilo para body text
body_style = ParagraphStyle(
    'CustomBody',
    parent=styles['BodyText'],
    fontSize=11,
    textColor=COLOR_TEXT,
    alignment=TA_JUSTIFY,
    spaceAfter=10,
    leading=14
)

# Estilo para lista
list_style = ParagraphStyle(
    'CustomList',
    parent=styles['BodyText'],
    fontSize=11,
    textColor=COLOR_TEXT,
    alignment=TA_LEFT,
    spaceAfter=6,
    leading=13,
    leftIndent=20
)

# Conteúdo do documento
story = []

# ===== PÁGINA DE CAPA =====
story.append(Spacer(1, 2*cm))

# Título Principal
story.append(Paragraph("O Guia Completo para<br/>Cães Bem-Comportados", title_style))
story.append(Spacer(1, 0.5*cm))

# Subtítulo
story.append(Paragraph("<b>Adestramento de Obediência Básica:</b>", ParagraphStyle(
    'CoverSubtitle',
    parent=styles['Normal'],
    fontSize=18,
    textColor=COLOR_PRIMARY,
    alignment=TA_CENTER,
    spaceAfter=6
)))

story.append(Spacer(1, 3*cm))

# Imagem placeholder - será adicionada manualmente se necessário
story.append(Paragraph(
    "<i>Ebook Exclusivo PattaMansa — um presente para quem compra camiseta</i>",
    ParagraphStyle(
        'CoverNote',
        parent=styles['Normal'],
        fontSize=12,
        textColor=COLOR_TEXT,
        alignment=TA_CENTER,
        italic=True,
        spaceAfter=4
    )
))

story.append(Spacer(1, 2*cm))

# Logo/Branding PattaMansa
story.append(Paragraph(
    "<b>🐾 PATTAMANSA 🐾</b>",
    ParagraphStyle(
        'Logo',
        parent=styles['Normal'],
        fontSize=20,
        textColor=COLOR_PRIMARY,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        spaceAfter=4
    )
))

story.append(Paragraph(
    "Vestuário Pet & Estilo de Vida",
    ParagraphStyle(
        'LogoSub',
        parent=styles['Normal'],
        fontSize=11,
        textColor=COLOR_TEXT,
        alignment=TA_CENTER,
        spaceAfter=4
    )
))

story.append(Spacer(1, 0.5*cm))

story.append(PageBreak())

# ===== ÍNDICE =====
story.append(Paragraph("ÍNDICE", title_style))
story.append(Spacer(1, 0.5*cm))

toc_items = [
    ("Sobre a PattaMansa", "3"),
    ("Introdução", "4"),
    ("1. A Importância do Adestramento", "5"),
    ("2. Preparação para o Treinamento", "6"),
    ("3. Comandos Básicos", "7"),
    ("4. Dicas para um Treinamento Eficaz", "9"),
    ("5. Resolvendo Problemas Comuns", "12"),
    ("6. Mantendo o Aprendizado", "14"),
    ("Conclusão", "15"),
]

for item, page in toc_items:
    toc_line = Paragraph(
        f"{item}" + "&nbsp;"*20 + f"<b>{page}</b>",
        ParagraphStyle(
            'TOC',
            parent=styles['Normal'],
            fontSize=11,
            textColor=COLOR_TEXT,
            spaceAfter=6
        )
    )
    story.append(toc_line)

story.append(Spacer(1, 1*cm))
story.append(PageBreak())

# ===== SOBRE A PATTAMANSA =====
story.append(Paragraph("SOBRE A PATTAMANSA", subtitle_style))
story.append(Spacer(1, 0.5*cm))

story.append(Paragraph(
    "A PattaMansa é uma marca feita por quem ama cães e acredita que cada rotina pode ficar mais leve quando o tutor encontra segurança e respeito na relação com o pet.",
    body_style
))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "Este ebook foi criado como um presente exclusivo para clientes PattaMansa, com dicas simples e práticas para fortalecer o carinho e a convivência no dia a dia.",
    body_style
))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "<b>Missão:</b> Ajudar tutores a construir uma relação mais harmoniosa, segura e afetuosa com seus cães, onde cuidado e bem-estar caminham juntos.",
    body_style
))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "<b>Valores:</b> Empatia, respeito aos limites animais, reforço positivo e construção de relacionamentos genuínos entre humanos e pets.",
    body_style
))

story.append(Spacer(1, 1*cm))
story.append(PageBreak())

# ===== INTRODUÇÃO =====
story.append(Paragraph("INTRODUÇÃO", subtitle_style))
story.append(Spacer(1, 0.5*cm))

story.append(Paragraph(
    "O adestramento de obediência básica é uma parte fundamental da vida de um cão e do relacionamento com seu tutor. Ensinar comandos simples não apenas melhora o comportamento do seu pet, mas também fortalece o vínculo entre vocês e garante a segurança do cão em diversas situações.",
    body_style
))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "Na PattaMansa, acreditamos que o cuidado com o cão faz parte do estilo de vida: quando ele se sente seguro e respeitado, a convivência se torna mais tranquila e mais feliz.",
    body_style
))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "Neste ebook, você encontrará técnicas eficazes, dicas práticas e um passo a passo para ensinar seu cão a obedecer comandos básicos. Com paciência, consistência e amor, você transformará a experiência de convivência com seu companheiro de quatro patas.",
    body_style
))

story.append(Spacer(1, 1*cm))
story.append(PageBreak())

# ===== SEÇÃO 1: IMPORTÂNCIA =====
story.append(Paragraph("1. A IMPORTÂNCIA DO ADESTRAMENTO", subtitle_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Benefícios do Adestramento</b>", section_style))

story.append(Paragraph("<b>Segurança:</b> Cães bem treinados são menos propensos a se envolver em situações perigosas.", list_style))
story.append(Paragraph("<b>Socialização:</b> O adestramento ajuda os cães a se comportarem adequadamente em ambientes sociais.", list_style))
story.append(Paragraph("<b>Vínculo:</b> Treinar juntos fortalece o relacionamento entre cão e seu tutor.", list_style))

story.append(Spacer(1, 0.5*cm))

story.append(Paragraph("<b>O Que Esperar do Adestramento</b>", section_style))

story.append(Paragraph("<b>Tempo e Paciência:</b> O aprendizado pode levar tempo, e cada cão aprende em seu próprio ritmo.", list_style))
story.append(Paragraph("<b>Reforço Positivo:</b> A técnica mais eficaz é o reforço positivo, que envolve recompensas para comportamentos desejados.", list_style))

story.append(Spacer(1, 1*cm))
story.append(PageBreak())

# ===== SEÇÃO 2: PREPARAÇÃO =====
story.append(Paragraph("2. PREPARAÇÃO PARA O TREINAMENTO", subtitle_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Equipamentos Necessários</b>", section_style))

story.append(Paragraph("<b>Coleira e Guia:</b> Use uma coleira confortável e uma guia de 1,5 a 2 metros.", list_style))
story.append(Paragraph("<b>Petiscos:</b> Escolha petiscos pequenos e saborosos que seu cão adore.", list_style))
story.append(Paragraph("<b>Brinquedos:</b> Utilize brinquedos como recompensa durante o treino.", list_style))

story.append(Spacer(1, 0.5*cm))

story.append(Paragraph("<b>Ambiente de Treinamento</b>", section_style))

story.append(Paragraph("<b>Local Calmo:</b> Escolha um lugar tranquilo, livre de distrações, para as sessões de treinamento.", list_style))
story.append(Paragraph("<b>Duração das Sessões:</b> Mantenha as sessões curtas (5 a 10 minutos) para que seu cão não fique entediado ou cansado.", list_style))

story.append(Spacer(1, 1*cm))
story.append(PageBreak())

# ===== SEÇÃO 3: COMANDOS =====
story.append(Paragraph("3. COMANDOS BÁSICOS", subtitle_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Sentar</b>", section_style))
story.append(Paragraph("1. <b>Atraia a Atenção:</b> Mostre um petisco ao seu cão.", list_style))
story.append(Paragraph("2. <b>Movimente o Petisco:</b> Levante o petisco acima do nariz dele e mova-o para trás, fazendo com que ele se sente.", list_style))
story.append(Paragraph("3. <b>Reforço:</b> Assim que ele sentar, elogie e ofereça o petisco.", list_style))
story.append(Paragraph("4. <b>Repetição:</b> Repita o processo várias vezes até que ele associe o comando 'sentar' à ação.", list_style))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Fica</b>", section_style))
story.append(Paragraph("1. <b>Comando Inicial:</b> Peça para o seu cão se sentar.", list_style))
story.append(Paragraph("2. <b>Dê o Comando:</b> Diga 'fica' e dê um passo para trás.", list_style))
story.append(Paragraph("3. <b>Reforço:</b> Se ele permanecer no lugar, volte e recompense-o. Se ele se mover, repita o comando.", list_style))
story.append(Paragraph("4. <b>Aumente a Distância:</b> Gradualmente, aumente a distância e o tempo que ele deve ficar.", list_style))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>'Vem'</b>", section_style))
story.append(Paragraph("1. <b>Chame-o com Alegria:</b> Afaste-se alguns passos e chame seu cão pelo nome seguido de 'vem'.", list_style))
story.append(Paragraph("2. <b>Use um Petisco:</b> Mostre um petisco para incentivá-lo a vir até você.", list_style))
story.append(Paragraph("3. <b>Recompense:</b> Assim que ele chegar até você, elogie e ofereça o petisco.", list_style))
story.append(Paragraph("4. <b>Repetição:</b> Pratique em diferentes locais e em situações variadas.", list_style))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>'Deitar'</b>", section_style))
story.append(Paragraph("1. <b>Atraia a Atenção:</b> Comece com o cão sentado.", list_style))
story.append(Paragraph("2. <b>Use um Petisco:</b> Leve o petisco ao chão, próximo ao nariz dele e mova-o para frente.", list_style))
story.append(Paragraph("3. <b>Reforço:</b> Assim que ele se deitar, elogie e recompense.", list_style))
story.append(Paragraph("4. <b>Comando Verbal:</b> Após várias repetições, use o comando 'deita'.", list_style))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>'Solta'</b>", section_style))
story.append(Paragraph("1. <b>Treinamento de Objeto:</b> Ofereça um brinquedo ou objeto que seu cão goste.", list_style))
story.append(Paragraph("2. <b>Peça para 'Soltar':</b> Diga 'solta' e ofereça um petisco em troca do objeto.", list_style))
story.append(Paragraph("3. <b>Recompense:</b> Assim que ele soltar, elogie e dê o petisco.", list_style))
story.append(Paragraph("4. <b>Repetição:</b> Pratique o comando até que ele aprenda a soltar objetos quando solicitado.", list_style))

story.append(Spacer(1, 1*cm))
story.append(PageBreak())

# ===== SEÇÃO 4: DICAS =====
story.append(Paragraph("4. DICAS PARA UM TREINAMENTO EFICAZ", subtitle_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Reforço Positivo</b>", section_style))
story.append(Paragraph("<b>Elogios e Recompensas:</b> Sempre que seu cão obedecer a um comando, elogie-o com entusiasmo e ofereça uma recompensa. Isso reforça o comportamento positivo.", list_style))
story.append(Paragraph("<b>Varie as Recompensas:</b> Use diferentes tipos de recompensas, como petiscos, brinquedos ou carinho, para manter o interesse do seu cão.", list_style))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Consistência é Fundamental</b>", section_style))
story.append(Paragraph("<b>Use os Mesmos Comandos:</b> Sempre use as mesmas palavras para os comandos e mantenha a mesma entonação.", list_style))
story.append(Paragraph("<b>Treine Regularmente:</b> Mantenha uma rotina de treinamento diária para reforçar o aprendizado.", list_style))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Seja Paciente e Flexível</b>", section_style))
story.append(Paragraph("<b>Respeite o Ritmo do Seu Cão:</b> Cada cão tem seu próprio ritmo de aprendizado. Seja paciente e ajuste suas expectativas.", list_style))
story.append(Paragraph("<b>Evite Punições:</b> Nunca puna seu cão por não obedecer. Em vez disso, concentre-se em recompensar os comportamentos corretos.", list_style))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Crie um Ambiente Livre de Distrações</b>", section_style))
story.append(Paragraph("<b>Escolha o Local Adequado:</b> Comece o treinamento em um ambiente tranquilo, livre de distrações, e vá aumentando a dificuldade gradualmente.", list_style))
story.append(Paragraph("<b>Minimize Interrupções:</b> Mantenha o ambiente calmo durante as sessões de treinamento para que seu cão possa se concentrar.", list_style))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Socialização</b>", section_style))
story.append(Paragraph("<b>Exponha seu Cão a Novas Experiências:</b> A socialização é crucial para o desenvolvimento de um cão equilibrado. Apresente-o a diferentes pessoas, ambientes e outros cães.", list_style))
story.append(Paragraph("<b>Treinos em Grupo:</b> Considere participar de aulas de obediência em grupo para socializar seu cão e praticar comandos em um ambiente mais desafiador.", list_style))

story.append(Spacer(1, 1*cm))
story.append(PageBreak())

# ===== SEÇÃO 5: PROBLEMAS =====
story.append(Paragraph("5. RESOLVENDO PROBLEMAS COMUNS", subtitle_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Problemas de Concentração</b>", section_style))
story.append(Paragraph("<b>Diminua a Duração das Sessões:</b> Se seu cão parecer desinteressado, reduza a duração das sessões de treino.", list_style))
story.append(Paragraph("<b>Incorpore Brincadeiras:</b> Inclua jogos e brincadeiras durante o treinamento para torná-lo mais divertido.", list_style))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Resistência a Comandos</b>", section_style))
story.append(Paragraph("<b>Avalie o Ambiente:</b> Se seu cão não obedecer, pode haver distrações no ambiente. Mude para um local mais tranquilo.", list_style))
story.append(Paragraph("<b>Revisite Comandos Anteriores:</b> Se ele não estiver respondendo, volte a comandos que ele já aprendeu e recompense-o por isso.", list_style))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Comportamentos Indesejados</b>", section_style))
story.append(Paragraph("<b>Identifique as Causas:</b> Observe o que pode estar causando comportamentos indesejados. Isso pode incluir falta de exercício, ansiedade ou falta de atenção.", list_style))
story.append(Paragraph("<b>Redirecione a Atenção:</b> Use comandos ou brinquedos para redirecionar a atenção do seu cão para comportamentos mais desejáveis.", list_style))

story.append(Spacer(1, 1*cm))
story.append(PageBreak())

# ===== SEÇÃO 6: MANUTENÇÃO =====
story.append(Paragraph("6. MANTENDO O APRENDIZADO", subtitle_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Prática Contínua</b>", section_style))
story.append(Paragraph("<b>Reforce os Comandos:</b> Continue praticando os comandos mesmo após o aprendizado. Isso ajuda a manter as habilidades afiadas.", list_style))
story.append(Paragraph("<b>Treine em Diferentes Ambientes:</b> A prática em diversos locais e situações ajuda seu cão a generalizar os comandos.", list_style))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Crie Novos Desafios</b>", section_style))
story.append(Paragraph("<b>Introduza Novos Comandos:</b> Após dominar os comandos básicos, comece a introduzir comandos mais avançados.", list_style))
story.append(Paragraph("<b>Desafios de Obediência:</b> Faça jogos de obediência, como 'circuitos de obstáculos', para tornar o treinamento mais interessante e divertido.", list_style))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("<b>Compartilhe o Aprendizado</b>", section_style))
story.append(Paragraph("<b>Mostre o Progresso:</b> Compartilhe seus sucessos com amigos e familiares. Isso pode ser motivador e ajudar a manter a consistência no treinamento.", list_style))
story.append(Paragraph("<b>Documente o Aprendizado:</b> Faça vídeos ou anotações sobre o progresso do seu cão para acompanhar seu desenvolvimento.", list_style))

story.append(Spacer(1, 1*cm))
story.append(PageBreak())

# ===== CONCLUSÃO =====
story.append(Paragraph("CONCLUSÃO", subtitle_style))
story.append(Spacer(1, 0.5*cm))

story.append(Paragraph(
    "O adestramento de obediência básica é uma jornada gratificante que beneficia tanto o cão quanto o tutor. Ao seguir as técnicas e dicas apresentadas neste ebook, você estará no caminho certo para ter um cão mais seguro, equilibrado e feliz.",
    body_style
))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "Cada passo do treinamento é também um passo para conhecer melhor o seu cão e para construir uma convivência mais leve. Pequenas conquistas diárias se transformam em um relacionamento de confiança.",
    body_style
))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "A paciência, a consistência e o carinho fazem parte do que chamamos de cuidado PattaMansa: simples, cuidadoso e sempre voltado para o bem-estar do seu pet.",
    body_style
))

story.append(Spacer(1, 0.5*cm))

story.append(Paragraph(
    "Obrigado por escolher PattaMansa. Este ebook foi preparado para ajudar você e seu cão a viverem melhor juntos.",
    body_style
))

story.append(Spacer(1, 1*cm))

# Call to action
story.append(Paragraph(
    "🐾 <b>VOCÊ AGORA FAZ PARTE DA MATILHA PATTAMANSA</b> 🐾",
    ParagraphStyle(
        'CTA',
        parent=styles['Normal'],
        fontSize=13,
        textColor=COLOR_PRIMARY,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        spaceAfter=8
    )
))

story.append(Paragraph(
    "Se quiser continuar sua jornada com mais dicas e inspirações para o dia a dia do seu cão, estamos juntos.",
    ParagraphStyle(
        'CTAText',
        parent=styles['Normal'],
        fontSize=11,
        textColor=COLOR_TEXT,
        alignment=TA_CENTER,
        spaceAfter=4
    )
))

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph(
    "<b>Instagram:</b> @pattamansa<br/><b>Site:</b> www.pattamansa.com.br",
    ParagraphStyle(
        'Social',
        parent=styles['Normal'],
        fontSize=11,
        textColor=COLOR_PRIMARY,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
))

story.append(Spacer(1, 0.5*cm))

story.append(Paragraph(
    "___________<br/><br/>",
    ParagraphStyle(
        'Divider',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER
    )
))

story.append(Paragraph(
    "Obrigado por escolher PattaMansa. Seu cão merece o melhor—em estilo e educação.",
    ParagraphStyle(
        'Closing',
        parent=styles['Normal'],
        fontSize=11,
        textColor=COLOR_TEXT,
        alignment=TA_CENTER,
        italic=True
    )
))

story.append(Spacer(1, 0.5*cm))

story.append(Paragraph(
    "<b>PATTAMANSA</b><br/>Vestuário Pet & Estilo de Vida<br/>Com Amor aos Cães 🐾",
    ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=10,
        textColor=COLOR_PRIMARY,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        leading=12
    )
))

# Gerar PDF
print("Gerando PDF...")
doc.build(story)
print(f"✓ PDF criado com sucesso: {pdf_path}")
