# Vinyl Player Simulator

## O que é

Toca-discos virtual na web que controla o Spotify (app aberto em segundo plano) para ouvir álbuns sem distração. Uso pessoal. Escopo completo: @SCOPE.md

## Stack

* Vite + React + TypeScript
* Vitest + Testing Library (testes), ESLint
* Spotify Web API com OAuth PKCE no navegador (sem backend)

## Marca

* Nome: "Vinyl Player Simulator" (curto: "Vinyl Player"). Ver @BRAND.md
* Logos em public/brand/ (versão -light-bg para tema light); ícones em public/
* Cores de marca: laranja #E35634, creme #F2EBE0, preto #0A0A0A

## Comandos

* Instalar: `npm install`
* Rodar: `npm run dev` → http://127.0.0.1:5173
* Validar (lint + tipos + testes): `npm run validate`  ← rodar antes de concluir qualquer tarefa

## Estrutura

* `src/spotify/` — TODO acesso ao Spotify (auth, API). A UI nunca chama a API direto.
* `src/components/` — UI (Turntable, AlbumSearch, Controls, NowPlaying)
* `src/hooks/` — estado do player (polling)
* Testes: `*.test.ts(x)` ao lado do arquivo testado

## Convenções

* Componentes em PascalCase; funções e hooks em camelCase.
* Animações em CSS puro, sem bibliotecas de animação.
* Client ID em `.env.local` (`VITE_SPOTIFY_CLIENT_ID`), nunca commitado.
* Erros da API viram mensagem clara na UI (ex.: "Abra o Spotify em algum dispositivo").
* Testes junto da feature; chamadas ao Spotify mockadas nos testes.
* Não adicionar dependências sem pedir.
* Não refatorar fora da tarefa atual.
* Edições pontuais; não reescrever arquivos inteiros.

## Restrições Spotify (Development Mode, fev/2026)

* NÃO usar endpoints em lote: GET /albums?ids=, /tracks?ids=, /artists?ids= → usar a versão por ID (GET /albums/{id}).
* NÃO usar /browse/*, /artists/{id}/top-tracks, /users/{id}/*.
* Playlists: /playlists/{id}/tracks virou /playlists/{id}/items (só para playlists minhas ou colaborativas).
* Busca: limit máximo 10.
* Tocar álbum/playlist: 1) PUT /me/player/shuffle?state=false 2) PUT /me/player/play com {"context\_uri": "spotify:album:...", "offset": {"position": 0}, "position\_ms": 0}. Sempre da 1ª faixa, sem aleatório.
* Em erro, logar no console: método, URL, status e corpo da resposta.

## Fluxo de trabalho

* Backlog e status: @TASKS.md
* Decisões: @DECISIONS.md (registrar novas decisões lá)
* Ao concluir uma tarefa: rodar `npm run validate`, marcar em TASKS.md.

# Vinyl Player Simulator

## O que é

Toca-discos virtual na web que controla o Spotify (app aberto em segundo plano) para ouvir álbuns sem distração. Uso pessoal. Escopo completo: @SCOPE.md

## Stack

* Vite + React + TypeScript
* Vitest + Testing Library (testes), ESLint
* Spotify Web API com OAuth PKCE no navegador (sem backend)

## Marca

* Nome: "Vinyl Player Simulator" (curto: "Vinyl Player"). Ver @BRAND.md
* Logos em public/brand/ (versão -light-bg para tema light); ícones em public/
* Cores de marca: laranja #E35634, creme #F2EBE0, preto #0A0A0A

## Comandos

* Instalar: `npm install`
* Rodar: `npm run dev` → http://127.0.0.1:5173
* Validar (lint + tipos + testes): `npm run validate`  ← rodar antes de concluir qualquer tarefa

## Estrutura

* `src/spotify/` — TODO acesso ao Spotify (auth, API). A UI nunca chama a API direto.
* `src/components/` — UI (Turntable, AlbumSearch, Controls, NowPlaying)
* `src/hooks/` — estado do player (polling)
* Testes: `*.test.ts(x)` ao lado do arquivo testado

## Convenções

* Componentes em PascalCase; funções e hooks em camelCase.
* Animações em CSS puro, sem bibliotecas de animação.
* Client ID em `.env.local` (`VITE_SPOTIFY_CLIENT_ID`), nunca commitado.
* Erros da API viram mensagem clara na UI (ex.: "Abra o Spotify em algum dispositivo").
* Testes junto da feature; chamadas ao Spotify mockadas nos testes.
* Não adicionar dependências sem pedir.
* Não refatorar fora da tarefa atual.
* Edições pontuais; não reescrever arquivos inteiros.

## Restrições Spotify (Development Mode, fev/2026)

* NÃO usar endpoints em lote: GET /albums?ids=, /tracks?ids=, /artists?ids= → usar a versão por ID (GET /albums/{id}).
* NÃO usar /browse/*, /artists/{id}/top-tracks, /users/{id}/*.
* Playlists: /playlists/{id}/tracks virou /playlists/{id}/items (só para playlists minhas ou colaborativas).
* Busca: limit máximo 10.
* Tocar álbum/playlist: 1) PUT /me/player/shuffle?state=false 2) PUT /me/player/play com {"context\_uri": "spotify:album:...", "offset": {"position": 0}, "position\_ms": 0}. Sempre da 1ª faixa, sem aleatório.
* Em erro, logar no console: método, URL, status e corpo da resposta.

## Fluxo de trabalho

* Backlog e status: @TASKS.md
* Decisões: @DECISIONS.md (registrar novas decisões lá)
* Ao concluir uma tarefa: rodar `npm run validate`, marcar em TASKS.md.

## O que é

Toca-discos virtual na web que controla o Spotify (app aberto em segundo plano) para ouvir álbuns sem distração. Uso pessoal. Escopo completo: @SCOPE.md

## Stack

- Vite + React + TypeScript
- Vitest + Testing Library (testes), ESLint
- Spotify Web API com OAuth PKCE no navegador (sem backend)


## Comandos

- Instalar: `npm install`
- Rodar: `npm run dev` → http://127.0.0.1:5173
- Validar (lint + tipos + testes): `npm run validate`  ← rodar antes de concluir qualquer tarefa

## Estrutura

- `src/spotify/` — TODO acesso ao Spotify (auth, API). A UI nunca chama a API direto.
- `src/components/` — UI (Turntable, AlbumSearch, Controls, NowPlaying)
- `src/hooks/` — estado do player (polling)
- Testes: `*.test.ts(x)` ao lado do arquivo testado

## Convenções

- Componentes em PascalCase; funções e hooks em camelCase.
- Animações em CSS puro, sem bibliotecas de animação.
- Client ID em `.env.local` (`VITE_SPOTIFY_CLIENT_ID`), nunca commitado.
- Erros da API viram mensagem clara na UI (ex.: "Abra o Spotify em algum dispositivo").
- Testes junto da feature; chamadas ao Spotify mockadas nos testes.
- Não adicionar dependências sem pedir.
- Não refatorar fora da tarefa atual.
- Edições pontuais; não reescrever arquivos inteiros.

## Fluxo de trabalho

- Backlog e status: @TASKS.md
- Decisões: @DECISIONS.md (registrar novas decisões lá)
- Ao concluir uma tarefa: rodar `npm run validate`, marcar em TASKS.md.

## Restrições Spotify (Development Mode, fev/2026)

- NÃO usar endpoints em lote: GET /albums?ids=, /tracks?ids=, /artists?ids= → usar a versão por ID (GET /albums/{id}).
- NÃO usar /browse/*, /artists/{id}/top-tracks, /users/{id}/*.
- Playlists: /playlists/{id}/tracks virou /playlists/{id}/items (só para playlists minhas ou colaborativas).
- Busca: limit máximo 10.
- Tocar álbum/playlist: PUT /me/player/play com {"context_uri": "spotify:album:..."}; sem offset fora do intervalo.
- Em erro, logar no console: método, URL, status e corpo da resposta.
