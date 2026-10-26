---
description: "Gera um diagrama de sequência Mermaid a partir de um fluxo ou código do DMS."
name: gerar-diagrama-sequencia
argument-hint: "Fluxo ou caminho do código (ex. upload de documento)"
agent: agent
---

# Gerar diagrama de sequência

Gere um diagrama de sequência Mermaid para o fluxo `${input:fluxo:descreva o fluxo ou indique os arquivos}`.

Use o código selecionado como ponto de partida quando houver seleção. Caso contrário, localize no workspace os arquivos necessários para entender o fluxo indicado. Por padrão, cubra o fluxo full-stack desde a interação da interface até a resposta e atualização da tela, atravessando frontend, proxy/API e backend quando participarem. Restrinja o diagrama a uma camada apenas se isso for pedido explicitamente. Siga as chamadas reais entre componentes e camadas; não invente participantes, respostas ou comportamento que não estejam implementados.

Requisitos para o diagrama:

- Inclua somente participantes que façam parte do fluxo analisado.
- Para o backend, respeite as dependências `routes -> controllers -> services -> repositories`.
- Quando aplicável ao fluxo, mostre o frontend usando `fetch` via `/api`, o proxy do Vite, o Express, o multer com `diskStorage`, o filesystem local em `backend/storage` e os metadados em memória.
- Represente as chamadas e respostas em ordem, incluindo os caminhos principais de sucesso e erro com blocos `alt` do Mermaid quando forem relevantes.
- Use nomes curtos e compreensíveis para os participantes, sem omitir uma camada que realmente participa do fluxo.
- Se o contexto não esclarecer um comportamento, não o presuma: registre a dúvida ou premissa abaixo do diagrama.

Formato da resposta:

1. Uma frase identificando o fluxo coberto.
2. Um único bloco `mermaid` usando `sequenceDiagram`.
3. Uma seção curta de observações somente se houver premissas, ambiguidades ou limitações importantes.

Não altere arquivos do projeto. Entregue o diagrama e as observações diretamente na resposta.
