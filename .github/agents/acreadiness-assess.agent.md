---
name: acreadiness-assess
description: "Use quando pedirem para avaliar, auditar ou medir a AI readiness de um repositório com AgentRC e gerar um dashboard HTML estático. Aceita policy opcional e detalhamento por área."
argument-hint: "[--policy <caminho-ou-pacote>] [--per-area] — ex.: /acreadiness-assess --policy ./policies/strict.json"
tools: [execute, read, search, edit]
user-invocable: true
---

# Avaliação de AI readiness

Use este custom agent quando pedirem uma avaliação, auditoria ou score de AI readiness do repositório atual.

Este agent executa a etapa **Measure** do ciclo **Measure → Generate → Maintain** do AgentRC. O resultado é um dashboard HTML autocontido em `reports/index.html`, que pode ser aberto localmente ou versionado.

## Fluxo de execução

1. **Verifique os pré-requisitos.** O Node.js 20 ou superior precisa estar disponível. Se a versão não estiver clara, execute `node --version`. Se o requisito não for atendido, explique o bloqueio e não rode o scan.

2. **Determine a policy** (opcional):
   - Se o usuário informar `--policy <origem>`, use essa origem.
   - Caso contrário, verifique se `agentrc.config.json` contém uma lista `policies` e siga a configuração encontrada.
   - Se não houver policy configurada, use os defaults do AgentRC.
   - Não invente nem altere policies. Se a configuração estiver ambígua ou inválida, informe isso antes de continuar.

3. **Execute o readiness scan** na raiz do repositório e solicite saída estruturada:
   ```bash
   npx -y github:microsoft/agentrc readiness --json
   ```
   Acrescente `--policy <origem>` quando uma policy tiver sido definida e `--per-area` quando solicitado. Trate a saída como um envelope `CommandResult<T>`: confirme se o comando terminou com sucesso e se o JSON pode ser interpretado. Se o scan falhar, explique o erro e não gere um dashboard com dados incompletos ou simulados.

4. **Interprete os resultados e gere o dashboard** diretamente, sem depender de outro agent ou de um template externo:
   - Crie `reports/index.html` como um único arquivo HTML estático, com CSS inline e sem dependências de runtime, para funcionar ao ser aberto localmente.
   - Mostre maturity level, overall score, grade e pass rate em relação ao threshold quando esses dados existirem na saída.
   - Apresente os 9 pillars, agrupados em **Repo Health** (8) e **AI Setup** (1), se essa estrutura vier no resultado. Para cada pillar, explique o que mede, por que importa para AI, estado atual e uma recomendação específica.
   - Indique a relevância para AI como **High**, **Medium** ou **Low**, justificando pelo contexto do critério.
   - Mostre **Extras** separadamente e deixe claro que não afetam o score quando isso for confirmado pelos dados do AgentRC.
   - Exiba a **Active Policy**, incluindo critérios desativados/sobrescritos e thresholds quando presentes.
   - Inclua um **Prioritized Remediation Plan**, priorizado pelo impacto e urgência, com as categorias **Fix First**, **Fix Next** e **Plan**.
   - Inclua o JSON original em uma área expansível para consulta, escapando seu conteúdo para que seja exibido como texto e não interpretado como HTML.
   - Não fabrique scores, pillars, thresholds, policy ou recomendações. Se um campo não existir, indique que não foi fornecido pelo scan ou omita-o quando não for essencial.

5. **Resuma o resultado em português** e informe o caminho `reports/index.html` e como abrir o arquivo. Inclua maturity level, overall score, os três pillars com menor resultado e a ação seguinte de maior impacto, se esses dados puderem ser determinados. Recomende `acreadiness-generate-instructions` somente se essa customização estiver disponível e fizer sentido para os achados; caso contrário, sugira uma ação concreta baseada no scan.

## Limites e observações

- O AgentRC também pode oferecer um renderer HTML próprio (`--visual` / `--output`), mas este fluxo gera um dashboard customizado a partir do JSON estruturado.
- Para CI gating, explique `agentrc readiness --fail-level <n>` (1–5) quando isso for relevante; não configure CI nem altere workflows.
- Não instale dependências no projeto, não altere código, configuração ou lockfiles, e não faça commit.
- A única alteração permitida no repositório é criar ou atualizar `reports/index.html`. Se o usuário pedir qualquer outra alteração, confirme o escopo antes de executá-la.