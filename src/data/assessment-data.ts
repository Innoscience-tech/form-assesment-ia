import type { AssessmentDimension, AssessmentQuestion, ScaleOption, ResultContent, MaturityLevel } from '@/types/assessment';

export const CTA_URL = 'https://innoscience.com.br/contato';

// Textos transcritos da nota texto-de-abertura-identifiqu.
export const openingText = "Identifique os avanços e as principais lacunas da sua empresa nas oito dimensões do Octógono da IA. Ao final, você receberá uma leitura inicial da sua prontidão e orientações sobre onde concentrar os próximos esforços.";
export const instructionText = "Responda considerando a situação atual da empresa, não os planos futuros. Quando houver diferenças entre áreas, considere a prática predominante. Se não tiver visibilidade sobre um tema, marque ‘Não sei informar’.";
export const dimensions = [
  {
    "id": "estrategia",
    "name": "Estratégia",
    "questionIds": [
      1,
      2
    ]
  },
  {
    "id": "lideranca",
    "name": "Liderança",
    "questionIds": [
      3,
      4
    ]
  },
  {
    "id": "governanca",
    "name": "Governança",
    "questionIds": [
      5,
      6
    ]
  },
  {
    "id": "tecnologia",
    "name": "Tecnologia",
    "questionIds": [
      7,
      8
    ]
  },
  {
    "id": "cultura",
    "name": "Cultura",
    "questionIds": [
      9,
      10
    ]
  },
  {
    "id": "funding",
    "name": "Funding",
    "questionIds": [
      11,
      12
    ]
  },
  {
    "id": "pessoas",
    "name": "Pessoas",
    "questionIds": [
      13,
      14
    ]
  },
  {
    "id": "relacionamentos",
    "name": "Relacionamentos",
    "questionIds": [
      15,
      16
    ]
  }
] as const satisfies readonly AssessmentDimension[];
export const questions = [
  {
    "id": 1,
    "dimensionId": "estrategia",
    "title": "Visão, Objetivos e Métricas",
    "text": "Em que medida a empresa tem uma direção clara para o uso de IA, conectada a objetivos de negócio e indicadores de resultado?"
  },
  {
    "id": 2,
    "dimensionId": "estrategia",
    "title": "AI Portfolio",
    "text": "Em que medida a empresa organiza suas iniciativas de IA em um portfólio priorizado por valor para o negócio e viabilidade de execução?"
  },
  {
    "id": 3,
    "dimensionId": "lideranca",
    "title": "Literacia Executiva",
    "text": "Em que medida os executivos compreendem as possibilidades e limitações da IA para tomar decisões sobre seu uso no negócio?"
  },
  {
    "id": 4,
    "dimensionId": "lideranca",
    "title": "Sponsorship",
    "text": "Em que medida existe uma liderança executiva que assume a responsabilidade pelo avanço da IA e atua para remover obstáculos?"
  },
  {
    "id": 5,
    "dimensionId": "governanca",
    "title": "Modelo de Operação",
    "text": "Em que medida estão definidos os responsáveis e os processos para decidir, desenvolver e operar iniciativas de IA?"
  },
  {
    "id": 6,
    "dimensionId": "governanca",
    "title": "Responsible AI",
    "text": "Em que medida a empresa aplica controles para lidar com os riscos do uso de IA, como privacidade, segurança, erros e decisões inadequadas?"
  },
  {
    "id": 7,
    "dimensionId": "tecnologia",
    "title": "Plataformas & Modelos",
    "text": "Em que medida a empresa dispõe de ferramentas e plataformas de IA adequadas para colocar suas iniciativas em funcionamento com segurança?"
  },
  {
    "id": 8,
    "dimensionId": "tecnologia",
    "title": "Dados & Infraestrutura",
    "text": "Em que medida os dados necessários às iniciativas de IA estão acessíveis e têm qualidade suficiente para uso?"
  },
  {
    "id": 9,
    "dimensionId": "cultura",
    "title": "Change Readiness",
    "text": "Em que medida a empresa prepara as equipes para as mudanças de rotina e de responsabilidades decorrentes do uso de IA?"
  },
  {
    "id": 10,
    "dimensionId": "cultura",
    "title": "Comunicação",
    "text": "Em que medida a empresa comunica às equipes os objetivos e as orientações para o uso de IA?"
  },
  {
    "id": 11,
    "dimensionId": "funding",
    "title": "Orçamento",
    "text": "Em que medida a empresa destina orçamento às iniciativas de IA de acordo com suas prioridades de negócio?"
  },
  {
    "id": 12,
    "dimensionId": "funding",
    "title": "Fontes de Funding",
    "text": "Em que medida a empresa avalia e viabiliza fontes de recursos para sustentar suas iniciativas de IA?"
  },
  {
    "id": 13,
    "dimensionId": "pessoas",
    "title": "Literacia Organizacional",
    "text": "Em que medida a empresa desenvolve as competências necessárias para que as pessoas utilizem IA de forma adequada em suas funções?"
  },
  {
    "id": 14,
    "dimensionId": "pessoas",
    "title": "Nível de Adoção",
    "text": "Em que medida o uso de IA está incorporado à rotina de trabalho, além de testes e experiências individuais?"
  },
  {
    "id": 15,
    "dimensionId": "relacionamentos",
    "title": "AI Providers",
    "text": "Em que medida a empresa utiliza critérios claros para selecionar e acompanhar fornecedores de soluções e serviços de IA?"
  },
  {
    "id": 16,
    "dimensionId": "relacionamentos",
    "title": "Ecossistema & Comunidade",
    "text": "Em que medida a empresa se conecta a parceiros, startups, universidades ou comunidades para desenvolver suas capacidades em IA?"
  }
] as const satisfies readonly AssessmentQuestion[];
export const scaleOptions = [
  {
    "value": 0,
    "label": "Não existe essa prática na empresa."
  },
  {
    "value": 1,
    "label": "Existem ações isoladas, dependentes de algumas pessoas."
  },
  {
    "value": 2,
    "label": "A prática existe em algumas áreas, mas ainda é pouco estruturada."
  },
  {
    "value": 3,
    "label": "A prática está definida, tem responsáveis e é aplicada de forma consistente em parte relevante da empresa."
  },
  {
    "value": 4,
    "label": "A prática está disseminada e seus resultados são acompanhados."
  },
  {
    "value": 5,
    "label": "A prática é continuamente aprimorada e contribui de forma demonstrável para os resultados do negócio."
  },
  {
    "value": 6,
    "label": "Não sei informar"
  }
] as const satisfies readonly ScaleOption[];
export const resultContents = {
  "inicial": {
    "level": "inicial",
    "label": "Inicial",
    "title": "Maturidade inicial",
    "scoreRange": "0 a menos de 2",
    "challenge": "Construir as bases para a adoção de IA",
    "headline": "Sua empresa está nos primeiros passos para uma adoção estruturada da inteligência artificial.",
    "paragraphs": [
      "As respostas indicam que a organização ainda possui práticas pouco estruturadas para orientar o uso da inteligência artificial. Embora possam existir iniciativas e experiências em determinadas áreas, faltam elementos para garantir uma atuação consistente, integrada às prioridades do negócio e capaz de produzir resultados sustentáveis.",
      "Nesse estágio, o principal desafio não é ampliar rapidamente o número de aplicações de IA, mas construir as condições necessárias para que sua adoção aconteça com direcionamento estratégico, segurança e capacidade de execução."
    ],
    "guidanceTitle": "Por onde começar?",
    "guidance": [
      "O primeiro passo é estabelecer uma visão clara sobre o papel da IA na organização, identificando desafios de negócio que podem ser solucionados com seu uso. Esse direcionamento deve ser acompanhado pelo envolvimento da liderança, pela definição de responsabilidades e pelo desenvolvimento de competências essenciais nas equipes.",
      "Também é importante selecionar casos de uso prioritários, avaliar a disponibilidade dos dados e estabelecer controles básicos para experimentar a tecnologia com segurança e medir seus primeiros resultados."
    ],
    "callout": "Transforme o potencial da IA em uma agenda estruturada para o seu negócio.",
    "support": "A Innoscience apoia organizações na definição de estratégias de IA, identificação de oportunidades e preparação de lideranças e equipes para uma adoção orientada à geração de valor.",
    "cta": "Converse com nossos especialistas"
  },
  "em-desenvolvimento": {
    "level": "em-desenvolvimento",
    "label": "Em desenvolvimento",
    "title": "Maturidade em desenvolvimento",
    "scoreRange": "2 a menos de 4",
    "challenge": "Estruturar e ampliar as práticas existentes",
    "headline": "Sua empresa já avançou na adoção de IA. Agora, o desafio é transformar práticas existentes em resultados consistentes.",
    "paragraphs": [
      "As respostas indicam que sua organização já desenvolveu iniciativas e capacidades relacionadas à inteligência artificial. Entretanto, essas práticas ainda podem apresentar diferenças de maturidade entre áreas, limitações de estruturação e dificuldades para ampliar sua aplicação aos processos do negócio.",
      "Nesse estágio, a prioridade é transformar experiências e iniciativas pontuais em uma agenda coordenada, com responsabilidades definidas, investimentos direcionados e mecanismos que permitam acompanhar os resultados alcançados."
    ],
    "guidanceTitle": "Como avançar?",
    "guidance": [
      "A organização deve fortalecer sua governança e organizar as iniciativas de IA em um portfólio priorizado por valor para o negócio e viabilidade de execução. Também é fundamental estabelecer indicadores, aprimorar a gestão dos investimentos e garantir que dados, plataformas e fornecedores estejam preparados para sustentar a evolução das soluções.",
      "Outro movimento importante é ampliar a adoção entre as equipes, integrando a IA aos processos de trabalho e desenvolvendo as competências necessárias para que a tecnologia produza ganhos efetivos de produtividade, eficiência e qualidade."
    ],
    "callout": "Consolide suas iniciativas e acelere a geração de valor com inteligência artificial.",
    "support": "A Innoscience apoia empresas na estruturação da governança de IA, priorização de oportunidades, desenvolvimento de capacidades e implementação de soluções conectadas aos objetivos do negócio.",
    "cta": "Converse com nossos especialistas"
  },
  "consolidado": {
    "level": "consolidado",
    "label": "Consolidado",
    "title": "Maturidade consolidada",
    "scoreRange": "4 a 5",
    "challenge": "Maximizar o valor gerado pela IA",
    "headline": "Sua empresa possui práticas consolidadas de inteligência artificial. O próximo desafio é ampliar seu impacto estratégico.",
    "paragraphs": [
      "As respostas indicam que sua organização alcançou um estágio avançado de estruturação e adoção da inteligência artificial. As práticas relacionadas à estratégia, liderança, governança, tecnologia e desenvolvimento de pessoas tendem a estar mais disseminadas, criando condições para acompanhar resultados e aprimorar continuamente o uso da IA.",
      "Nesse estágio, o principal desafio é avançar da eficiência operacional para a transformação do negócio, garantindo que os investimentos em inteligência artificial contribuam de maneira demonstrável para a competitividade, o crescimento e a criação de novas oportunidades."
    ],
    "guidanceTitle": "Como evoluir?",
    "guidance": [
      "O foco deve estar no aprimoramento contínuo do portfólio de IA, com indicadores que permitam mensurar o valor capturado e orientar decisões de investimento. A organização também pode avançar no redesenho de processos, na implementação de soluções mais sofisticadas e na exploração de novas aplicações, incluindo agentes de IA.",
      "Além disso, fortalecer conexões com parceiros tecnológicos e ecossistemas de inovação pode ampliar o acesso a conhecimentos, soluções e oportunidades para desenvolver novos produtos, serviços e modelos de negócio."
    ],
    "callout": "Transforme a maturidade em IA em diferenciação competitiva e novas oportunidades de crescimento.",
    "support": "A Innoscience apoia organizações na evolução de suas estratégias de IA, na transformação de processos e na identificação de oportunidades que conectem tecnologia, inovação e resultados para o negócio.",
    "cta": "Converse com nossos especialistas"
  }
} as const satisfies Record<MaturityLevel, ResultContent>;
