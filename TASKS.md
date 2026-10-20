# Tasks — Vinil Virtual

Legenda: [ ] pendente · [~] em andamento · [x] feita · ∥ pode rodar em paralelo

> [~] = código e testes prontos; falta conferir o aceite manual com o Spotify real.

## Fase 1 — Fundação

- [X]  T01 — Criar projeto base (Vite + React + TS + Vitest + ESLint) com script `validate`
  - Arquivos: `package.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `.gitignore`
  - Depende de: —
  - Aceite: `npm run validate` passa; `npm run dev` abre em http://127.0.0.1:5173

- [~] T02 — Login Spotify com PKCE (login, callback, guardar e renovar token)
  - Arquivos: `src/spotify/auth.ts`, `src/spotify/auth.test.ts`, `src/App.tsx`
  - Depende de: T01
  - Aceite: botão "Entrar com Spotify" → após login, tela mostra o nome do usuário; testes da geração do PKCE passam
- [~] T03 — Spike da API: buscar álbum, listar dispositivos, tocar álbum
  - Arquivos: `src/spotify/api.ts`, `src/spotify/api.test.ts`
  - Depende de: T02
  - Aceite: tela de debug busca "Kind of Blue", clica e o álbum toca no Spotify; registrar em DECISIONS.md qualquer endpoint com 403

## Fase 2 — Player

- [X]  T04 — Módulo player: playAlbum, pause, resume, next, prev, getNowPlaying
  - Arquivos: `src/spotify/player.ts`, `src/spotify/player.test.ts`
  - Depende de: T03
  - Aceite: testes com fetch mockado cobrem cada função e o erro "sem dispositivo ativo"
- [X]  T05 ∥ — Toca-discos visual: disco girando/parado, agulha levantada/baixada (CSS)
  - Arquivos: `src/components/Turntable.tsx`, `Turntable.css`, `Turntable.test.tsx`
  - Depende de: T01
  - Aceite: prop `playing` alterna animação; teste verifica classes de estado
- [X]  T06 ∥ — Busca e seleção de álbum (lista com capa, nome, artista)
  - Arquivos: `src/components/AlbumSearch.tsx`, `AlbumSearch.test.tsx`
  - Depende de: T04
  - Aceite: digitar → lista de álbuns; clicar → álbum selecionado aparece no disco

## Fase 3 — Integração

- [~] T07 — Baixar agulha toca o álbum; controles play/pause/prev/next

  - Arquivos: `src/components/Controls.tsx`, `src/App.tsx`
  - Depende de: T04, T05, T06
  - Aceite: selecionar álbum → baixar agulha → toca no Spotify em < 3s e o disco gira
- [~] T08 — Sincronização: polling a cada 2s (faixa, artista, tocando/pausado)

  - Arquivos: `src/hooks/useNowPlaying.ts`, `useNowPlaying.test.ts`, `src/components/NowPlaying.tsx`
  - Depende de: T07
  - Aceite: pausar no app do Spotify → disco para e agulha levanta em até 3s
- [~] T09 — Erros: sem dispositivo ativo, token expirado, falha de rede

  - Arquivos: `src/spotify/player.ts`, `src/App.tsx`
  - Depende de: T08
  - Aceite: com Spotify fechado, baixar agulha mostra "Abra o Spotify em algum dispositivo"

## Fase 4 — Pós-MVP

* [ ]  T10 — Tema light/dark (FAZER ANTES DA T05)
  * Arquivos: `src/theme/theme.css`, `src/theme/useTheme.ts`, `useTheme.test.ts`, `src/components/ThemeToggle.tsx`
  * Depende de: T01
  * Aceite: cores só via variáveis CSS; botão alterna light/dark; segue o sistema na 1ª visita; escolha persiste ao recarregar
* [ ]  T11 — Ruído de agulha (crackle) gerado via Web Audio, sem arquivo de áudio
  * Arquivos: `src/audio/crackle.ts`, `crackle.test.ts`, `src/components/CrackleControl.tsx`
  * Depende de: T08
  * Aceite: crackle toca só com agulha baixada e música tocando; para no pause; botão on/off + volume; preferência persiste
* [ ]  T12 — Playlist como disco (busca retorna álbuns e playlists; baixar agulha toca qualquer um)
  * Arquivos: `src/spotify/player.ts`, `src/spotify/api.ts`, `src/components/AlbumSearch.tsx`
  * Depende de: T07
  * Aceite: buscar playlist → selecionar → baixar agulha → toca no Spotify
* [ ]  T13 — Favoritos (salvar/remover disco) em localStorage
  * Arquivos: `src/library/favorites.ts`, `favorites.test.ts`, `src/components/AlbumSearch.tsx`
  * Depende de: T12
  * Aceite: favoritar na busca → persiste ao recarregar; remover funciona; UI não acessa localStorage direto
* [ ]  T14 — Estante de vinis (lombadas/capas na prateleira; clicar coloca no toca-discos)
  * Arquivos: `src/components/Shelf.tsx`, `Shelf.css`, `Shelf.test.tsx`, `src/App.tsx`
  * Depende de: T13, T10
  * Aceite: favoritos aparecem na estante; clicar seleciona o disco; estante vazia mostra mensagem
* [ ]  T15 — (Opcional) Importar minhas playlists do Spotify para a estante
  * Arquivos: `src/spotify/api.ts`, `src/components/Shelf.tsx`
  * Depende de: T14
  * Aceite: botão "Importar do Spotify" lista minhas playlists e adiciona as escolhidas aos favoritos

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
