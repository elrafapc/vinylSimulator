# Vinil Virtual

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
