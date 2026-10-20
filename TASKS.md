# Tasks — Vinil Virtual

Legenda: [ ] pendente · [~] em andamento · [x] feita · ∥ pode rodar em paralelo

## Fase 1 — Fundação
- [ ] T01 — Criar projeto base (Vite + React + TS + Vitest + ESLint) com script `validate`
  - Arquivos: `package.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `.gitignore`
  - Depende de: —
  - Aceite: `npm run validate` passa; `npm run dev` abre em http://127.0.0.1:5173
- [ ] T02 — Login Spotify com PKCE (login, callback, guardar e renovar token)
  - Arquivos: `src/spotify/auth.ts`, `src/spotify/auth.test.ts`, `src/App.tsx`
  - Depende de: T01
  - Aceite: botão "Entrar com Spotify" → após login, tela mostra o nome do usuário; testes da geração do PKCE passam
- [ ] T03 — Spike da API: buscar álbum, listar dispositivos, tocar álbum
  - Arquivos: `src/spotify/api.ts`, `src/spotify/api.test.ts`
  - Depende de: T02
  - Aceite: tela de debug busca "Kind of Blue", clica e o álbum toca no Spotify; registrar em DECISIONS.md qualquer endpoint com 403

## Fase 2 — Player
- [ ] T04 — Módulo player: playAlbum, pause, resume, next, prev, getNowPlaying
  - Arquivos: `src/spotify/player.ts`, `src/spotify/player.test.ts`
  - Depende de: T03
  - Aceite: testes com fetch mockado cobrem cada função e o erro "sem dispositivo ativo"
- [ ] T05 ∥ — Toca-discos visual: disco girando/parado, agulha levantada/baixada (CSS)
  - Arquivos: `src/components/Turntable.tsx`, `Turntable.css`, `Turntable.test.tsx`
  - Depende de: T01
  - Aceite: prop `playing` alterna animação; teste verifica classes de estado
- [ ] T06 ∥ — Busca e seleção de álbum (lista com capa, nome, artista)
  - Arquivos: `src/components/AlbumSearch.tsx`, `AlbumSearch.test.tsx`
  - Depende de: T04
  - Aceite: digitar → lista de álbuns; clicar → álbum selecionado aparece no disco

## Fase 3 — Integração
- [ ] T07 — Baixar agulha toca o álbum; controles play/pause/prev/next
  - Arquivos: `src/components/Controls.tsx`, `src/App.tsx`
  - Depende de: T04, T05, T06
  - Aceite: selecionar álbum → baixar agulha → toca no Spotify em < 3s e o disco gira
- [ ] T08 — Sincronização: polling a cada 2s (faixa, artista, tocando/pausado)
  - Arquivos: `src/hooks/useNowPlaying.ts`, `useNowPlaying.test.ts`, `src/components/NowPlaying.tsx`
  - Depende de: T07
  - Aceite: pausar no app do Spotify → disco para e agulha levanta em até 3s
- [ ] T09 — Erros: sem dispositivo ativo, token expirado, falha de rede
  - Arquivos: `src/spotify/player.ts`, `src/App.tsx`
  - Depende de: T08
  - Aceite: com Spotify fechado, baixar agulha mostra "Abra o Spotify em algum dispositivo"

---

## Prompt padrão (uma task por sessão, /clear entre tasks)

TAREFA: T0X — <objetivo em 1 linha>
CONTEXTO: @SCOPE.md @TASKS.md @<arquivos relevantes>
FAZER:
- <passo>
NÃO FAZER:
- Refatorar fora do escopo
- Adicionar dependências
ACEITE:
- <teste/comando>
Ao final: rodar `npm run validate` e marcar T0X em TASKS.md.
