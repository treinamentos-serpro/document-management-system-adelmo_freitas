# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, consultem e baixem documentos armazenados localmente, com metadados mantidos em memória nesta fase inicial.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição.
- Listagem dos documentos associados ao usuário informado na requisição.
- Download de documento pelo identificador.
- Armazenamento dos arquivos no filesystem local, em `backend/storage`.
- Gestão simples de propriedade por identificador de usuário.

### Fora do escopo

- Autenticação, autorização robusta ou cadastro de usuários.
- Armazenamento externo, em nuvem ou por serviço de terceiros.
- Persistência durável dos metadados.
- Versionamento, edição ou exclusão de documentos.
- Pastas, busca avançada, compartilhamento e permissões configuráveis.
- Paginação nesta fase inicial.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo usando `multipart/form-data`, no campo `file`. |
| RF-02 | A aplicação gera um identificador único para cada documento. |
| RF-03 | A aplicação grava o arquivo em `backend/storage` usando `multer` com `diskStorage`; o nome físico é gerado pela aplicação. |
| RF-04 | Após o envio, a aplicação registra em memória os metadados: identificador, nome original, tamanho, data de envio e dono. |
| RF-05 | O usuário pode listar os documentos associados ao identificador enviado no cabeçalho `X-User-Id`. |
| RF-06 | A listagem retorna apenas metadados públicos, sem caminhos ou nomes físicos de armazenamento. |
| RF-07 | O usuário pode baixar pelo identificador um documento pertencente ao usuário informado. |
| RF-08 | A aplicação responde adequadamente a arquivo ausente, arquivo acima do limite ou falha de acesso. |
| RF-09 | O nome original é sugerido ao cliente no download e nunca é usado como caminho de armazenamento. |
| RF-10 | Se o registro dos metadados falhar após a gravação, a aplicação tenta remover o arquivo recém-gravado. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são armazenados somente no filesystem local, em `backend/storage`, com `multer` e `diskStorage`. |
| RNF-02 | Os metadados ficam em memória e podem ser perdidos ao reiniciar o processo. |
| RNF-03 | A configuração operacional usa variáveis de ambiente. |
| RNF-04 | `MAX_FILE_SIZE_BYTES` configura o limite; o padrão é 10 MiB. |
| RNF-05 | Entradas externas não são usadas diretamente para construir caminhos no filesystem. |
| RNF-06 | O backend usa Node.js, Express e CommonJS; os testes usam `node:test`. |
| RNF-07 | O frontend usa React e Vite; as chamadas à API usam `fetch` via `/api`. |
| RNF-08 | Erros não expõem caminhos locais, stack traces ou detalhes internos. |

## 5. Modelo de dados

### Metadados públicos

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único gerado pela aplicação (UUID). |
| `originalName` | string | Nome original informado pelo cliente. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora em ISO 8601 UTC. |
| `owner` | string | Identificador do usuário associado ao documento. |

### Metadados internos

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `storageName` | string | Nome físico gerado no diretório local; nunca retornado pela API. |
| `mimeType` | string | Tipo de mídia usado como indicação no download, não como validação de segurança. |

Os metadados internos ficam em um repositório em memória. O cabeçalho `X-User-Id` é uma simplificação para separar documentos, não autentica nem comprova a identidade de quem o envia.

## 6. Contratos de API

O backend expõe as rotas abaixo. No desenvolvimento, o proxy do Vite encaminha `/api` ao backend e remove esse prefixo. Todas as rotas exigem `X-User-Id` não vazio. Erros seguem o formato:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição do erro."
  }
}
```

### `POST /upload`

- **Entrada:** `multipart/form-data` com um arquivo obrigatório no campo `file`.
- **Sucesso (`201`):** metadados públicos do documento criado.
- **Erros:** `400` para usuário/arquivo ausente ou requisição inválida; `413` para arquivo acima do limite; `500` para falha interna.

### `GET /documents`

- **Entrada:** cabeçalho `X-User-Id`.
- **Sucesso (`200`):** lista de metadados públicos do usuário, ordenada do mais recente para o mais antigo; sem documentos, retorna `[]`.
- **Erros:** `400` para usuário ausente; `500` para falha interna.

### `GET /documents/:id/download`

- **Entrada:** identificador na rota e cabeçalho `X-User-Id`.
- **Sucesso (`200`):** conteúdo binário, com `Content-Disposition` indicando o nome original e `Content-Type` disponível ou `application/octet-stream`.
- **Erros:** `400` para usuário ausente ou identificador inválido; `404` se documento não existe, pertence a outro usuário ou arquivo local está ausente; `500` para falha interna.
- Documento inexistente e documento de outro usuário têm a mesma resposta para não revelar a existência de documentos de terceiros.

## 7. Decisões arquiteturais

- Fluxo de dependências: `routes -> controllers -> services -> repositories`.
- `routes` declaram endpoints e delegam aos controllers.
- `controllers` validam a entrada HTTP básica, coordenam respostas e traduzem erros para status HTTP.
- `services` concentram regras de upload, propriedade, listagem e download, sem depender do Express.
- `repositories` encapsulam os metadados em memória e a localização dos arquivos no filesystem.
- `multer` com `diskStorage` grava exclusivamente em `backend/storage`; não são permitidos provedores externos.
- A identidade por `X-User-Id` não substitui autenticação real.
- O frontend organiza a experiência em componentes e usa um serviço `fetch` via `/api`.
- A porta e o limite de upload são configuráveis por ambiente; `backend/storage` é o diretório padrão.
- Reinicializações podem perder metadados, embora os arquivos continuem no disco local.

## 8. Plano de execução

Este plano define etapas de entrega; ele não implica alterações além do escopo de cada etapa.

1. **Revisar a especificação:** confirmar contratos, limite de upload, ordenação e identidade simplificada. Aceite: decisões e limitações estão claras; não há autenticação real nem armazenamento externo.
2. **Implementar o backend:** construir rotas, controllers, services e repositories; integrar `multer`/`diskStorage`. Aceite: upload, listagem e download cumprem os contratos; nomes enviados não controlam caminhos; falhas de metadados removem o arquivo quando possível.
3. **Validar o backend:** cobrir sucesso, validações, isolamento por usuário, limite e falhas de filesystem com `node:test`. Aceite: `npm test` no pacote backend passa.
4. **Implementar o frontend:** criar envio, listagem e download com React e chamadas via `/api`. Aceite: interface apresenta estados de carregamento, sucesso e erro, e preserva nomes legíveis no download.
5. **Integrar e validar o fluxo:** exercitar frontend, API e arquivos no filesystem local. Aceite: envio, listagem e download funcionam em execução local; metadados públicos não incluem dados internos.