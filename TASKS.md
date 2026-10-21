# Tasks — Vinil Virtual

# Tasks — Vinyl Player Simulator

Legenda: [ ] pendente · [\~] em andamento · [x] feita · ∥ pode rodar em paralelo

## Fase 1 — Fundação

* [x]  T01 — Criar projeto base (Vite + React + TS + Vitest + ESLint) com script `validate`
  * Arquivos: `package.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `.gitignore`
  * Depende de: —
  * Aceite: `npm run validate` passa; `npm run dev` abre em http://127.0.0.1:5173
* [x]  T02 — Login Spotify com PKCE (login, callback, guardar e renovar token)
  * Arquivos: `src/spotify/auth.ts`, `src/spotify/auth.test.ts`, `src/App.tsx`
  * Depende de: T01
  * Aceite: botão "Entrar com Spotify" → após login, tela mostra o nome do usuário; testes da geração do PKCE passam
* [x]  T03 — Spike da API: buscar álbum, listar dispositivos, tocar álbum
  * Arquivos: `src/spotify/api.ts`, `src/spotify/api.test.ts`
  * Depende de: T02
  * Aceite: tela de debug busca "Kind of Blue", clica e o álbum toca no Spotify; registrar em DECISIONS.md qualquer endpoint com 403

## Fase 2 — Player

* [x]  T04 — Módulo player: playAlbum, pause, resume, next, prev, getNowPlaying
  * Arquivos: `src/spotify/player.ts`, `src/spotify/player.test.ts`
  * Depende de: T03
  * Aceite: testes com fetch mockado cobrem cada função e o erro "sem dispositivo ativo"
* [x]  T05 ∥ — Toca-discos visual: disco girando/parado, agulha levantada/baixada (CSS)
  * Arquivos: `src/components/Turntable.tsx`, `Turntable.css`, `Turntable.test.tsx`
  * Depende de: T01
  * Aceite: prop `playing` alterna animação; teste verifica classes de estado
* [x]  T06 ∥ — Busca e seleção de álbum (lista com capa, nome, artista)
  * Arquivos: `src/components/AlbumSearch.tsx`, `AlbumSearch.test.tsx`
  * Depende de: T04
  * Aceite: digitar → lista de álbuns; clicar → álbum selecionado aparece no disco

## Fase 3 — Integração

* [x]  T07 — Baixar agulha toca o álbum; controles play/pause/prev/next
  * Arquivos: `src/components/Controls.tsx`, `src/App.tsx`
  * Depende de: T04, T05, T06
  * Aceite: selecionar álbum → baixar agulha → toca no Spotify em < 3s e o disco gira
* [x]  T08 — Sincronização: polling a cada 2s (faixa, artista, tocando/pausado)
  * Arquivos: `src/hooks/useNowPlaying.ts`, `useNowPlaying.test.ts`, `src/components/NowPlaying.tsx`
  * Depende de: T07
  * Aceite: pausar no app do Spotify → disco para e agulha levanta em até 3s
* [x]  T09 — Erros: sem dispositivo ativo, token expirado, falha de rede
  * Arquivos: `src/spotify/player.ts`, `src/App.tsx`
  * Depende de: T08
  * Aceite: com Spotify fechado, baixar agulha mostra "Abra o Spotify em algum dispositivo"

## Fase 4 — Pós-MVP

* [x]  T10 — Tema light/dark (FAZER ANTES DA T05)
  * Arquivos: `src/theme/theme.css`, `src/theme/useTheme.ts`, `useTheme.test.ts`, `src/components/ThemeToggle.tsx`
  * Depende de: T01
  * Aceite: cores só via variáveis CSS; botão alterna light/dark; segue o sistema na 1ª visita; escolha persiste ao recarregar
* [x]  T11 — Ruído de agulha (crackle) gerado via Web Audio, sem arquivo de áudio
  * Arquivos: `src/audio/crackle.ts`, `crackle.test.ts`, `src/components/CrackleControl.tsx`
  * Depende de: T08
  * Aceite: crackle toca só com agulha baixada e música tocando; para no pause; botão on/off + volume; preferência persiste
* [x]  T12 — Playlist como disco (busca retorna álbuns e playlists; baixar agulha toca qualquer um)
  * Arquivos: `src/spotify/player.ts`, `src/spotify/api.ts`, `src/components/AlbumSearch.tsx`
  * Depende de: T07
  * Aceite: buscar playlist → selecionar → baixar agulha → toca no Spotify
* [x]  T13 — Favoritos (salvar/remover disco) em localStorage
  * Arquivos: `src/library/favorites.ts`, `favorites.test.ts`, `src/components/AlbumSearch.tsx`
  * Depende de: T12
  * Aceite: favoritar na busca → persiste ao recarregar; remover funciona; UI não acessa localStorage direto
* [x]  T14 — Estante de vinis (lombadas/capas na prateleira; clicar coloca no toca-discos)
  * Arquivos: `src/components/Shelf.tsx`, `Shelf.css`, `Shelf.test.tsx`, `src/App.tsx`
  * Depende de: T13, T10
  * Aceite: favoritos aparecem na estante; clicar seleciona o disco; estante vazia mostra mensagem
* [x]  T15 — Importar minhas playlists do Spotify para a estante
  * Arquivos: `src/spotify/api.ts`, `src/components/Shelf.tsx`
  * Depende de: T14
  * Aceite: botão "Importar do Spotify" lista minhas playlists e adiciona as escolhidas aos favoritos
* [x]  T16 — Volume do Spotify (slider que aumenta/abaixa o volume da música)
  * Arquivos: `src/spotify/player.ts`, `player.test.ts`, `src/components/VolumeControl.tsx`, `VolumeControl.test.tsx`
  * Depende de: T08
  * Aceite: slider inicia com o volume atual do dispositivo; mover altera o volume no Spotify (envio com debounce \~300ms); se o dispositivo não suportar volume remoto, slider desabilitado com aviso
* [x]  T17 — Botão play sobre o disco selecionado (na busca, estante e minhas playlists)
  * Arquivos: `src/components/PlayOverlay.tsx`, `PlayOverlay.test.tsx`, componentes de lista
  * Depende de: T07
  * Aceite: item selecionado mostra botão play sobre a capa; clicar dispara a mesma ação de "baixar agulha"; acessível por teclado (Enter/Espaço)

## Fase 5 — Layout e experiência

* [x]  T18 — Layout: toca-discos ocupa a maior parte da tela + menu lateral recolhível
  * Arquivos: `src/App.tsx`, `src/components/Sidebar.tsx`, `Sidebar.css`, `Sidebar.test.tsx`, `Turntable.css`
  * Depende de: T10
  * Aceite: toca-discos ocupa \~70% da largura e escala com a tela; todas as opções (busca, controles, volume, sons, estante, playlists) ficam no menu lateral; botão recolhe/expande o menu e o toca-discos cresce ao recolher; estado do menu persiste ao recarregar; funciona em light e dark
* [x]  T19 — Estante maior: painel amplo que abre pelo menu lateral
  * Arquivos: `src/components/Shelf.tsx`, `Shelf.css`, `Shelf.test.tsx`
  * Depende de: T18
  * Aceite: estante abre como painel grande sobre a tela (fecha com Esc ou clique fora); capas grandes em prateleiras; clicar coloca o disco no toca-discos e fecha o painel
* [x]  T20 — Detalhes do disco: ícone pequeno abaixo do toca-discos expande capa + faixas
  * Arquivos: `src/spotify/api.ts`, `src/components/DiscDetails.tsx`, `DiscDetails.test.tsx`
  * Depende de: T18
  * Aceite: ícone mostra a capa em miniatura; clicar expande capa grande + lista de faixas (número, nome, duração) e destaca a faixa atual; álbum usa GET /albums/{id}; playlist que não é minha mostra só a capa com aviso "faixas indisponíveis"
* [x]  T21 — Sons ambiente: chuva e lareira, além do ruído de agulha
  * Arquivos: `src/audio/ambient.ts`, `ambient.test.ts`, `src/components/AmbientMixer.tsx`
  * Depende de: T11
  * Aceite: agulha, chuva e lareira com liga/desliga e volume independentes; podem tocar juntos; agulha só toca com música tocando, chuva e lareira tocam independentes da música; preferências persistem
* [x]  T22 — Sugestão de álbum baseada na estante (Last.fm)
  * Depende de: T19
  * Aceite: chave em VITE\_LASTFM\_API\_KEY; módulo isolado em src/suggest/; sorteia até 5 artistas da estante → artist.getSimilar → escolhe artista similar que não está na estante → artist.getTopAlbums → encontra o álbum no Spotify (busca, limit ≤ 10); mostra capa, nome, artista e motivo ("Parecido com X"); botões "Tocar", "Adicionar à estante" e "Outra sugestão"; estante vazia mostra aviso; erro do Last.fm mostra mensagem clara

## Fase 6 — Publicação

* [x]  T27 — Knob da vitrola controla o volume do Spotify
  * Depende de: T16, T26
  * Aceite: knob em CSS sobreposto ao da foto; -135° (0%) a +135° (100%) por arrastar, scroll e setas; mesmo estado/debounce da T16, sincronizado com o slider; 33/45 viram mín./máx.; role="slider" com aria-valuenow
* [x]  T29 — Marca: nome Vinyl Player Simulator + logo
  * Depende de: T27
  * Aceite: "Vinil Virtual" substituído em toda a UI, <title>, manifest (name/short\_name "Vinyl Player"), README e package.json; logo no topo trocando entre logo-dark-bg e logo-light-bg conforme o tema; menu recolhido mostra só o símbolo; favicon, apple-touch-icon e ícones PWA (incl. maskable) ligados no index.html e manifest; theme\_color/background\_color #0A0A0A; laranja #E35634 como cor de destaque nas variáveis de tema
* [x]  T30 — Rodapé "Developed by: Rafael Carneiro" linkado ao GitHub
  * Depende de: T29
  * Aceite: rodapé discreto no canto inferior direito; "Rafael Carneiro" linka para https://github.com/elrafapc (target="\_blank", rel="noopener noreferrer"); usa variáveis de tema (legível em light e dark); não sobrepõe a vitrola nem o menu; visível com menu recolhido e em tela cheia
* [x]  T28 — Preparar para publicação
  * Depende de: T30
  * Aceite: redirect do Spotify usa window.location.origin + "/callback"; vercel.json com rewrite para index.html; npm run build gera dist/ sem erro; README com variáveis de ambiente

---

## Prompt padrão (uma task por sessão, /clear entre tasks)

TAREFA: T0X — <objetivo em 1 linha> CONTEXTO: @SCOPE.md @TASKS.md @<arquivos relevantes> FAZER:

* <passo>

NÃO FAZER:

* Refatorar fora do escopo
* Adicionar dependências ACEITE:
* <teste/comando> Ao final: rodar `npm run validate` e marcar T0X em TASKS.md.

Legenda: [ ] pendente · [~] em andamento · [x] feita · ∥ pode rodar em paralelo

> [~] = código e testes prontos; falta conferir o aceite manual com o Spotify real.

## Fase 1 — Fundação

- [x]  T01 — Criar projeto base (Vite + React + TS + Vitest + ESLint) com script `validate`
  - Arquivos: `package.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `.gitignore`
  - Depende de: —
  - Aceite: `npm run validate` passa; `npm run dev` abre em http://127.0.0.1:5173

- [x] T02 — Login Spotify com PKCE (login, callback, guardar e renovar token)
  - Arquivos: `src/spotify/auth.ts`, `src/spotify/auth.test.ts`, `src/App.tsx`
  - Depende de: T01
  - Aceite: botão "Entrar com Spotify" → após login, tela mostra o nome do usuário; testes da geração do PKCE passam
- [x] T03 — Spike da API: buscar álbum, listar dispositivos, tocar álbum
  - Arquivos: `src/spotify/api.ts`, `src/spotify/api.test.ts`
  - Depende de: T02
  - Aceite: tela de debug busca "Kind of Blue", clica e o álbum toca no Spotify; registrar em DECISIONS.md qualquer endpoint com 403

## Fase 2 — Player

- [x]  T04 — Módulo player: playAlbum, pause, resume, next, prev, getNowPlaying
  - Arquivos: `src/spotify/player.ts`, `src/spotify/player.test.ts`
  - Depende de: T03
  - Aceite: testes com fetch mockado cobrem cada função e o erro "sem dispositivo ativo"
- [x]  T05 ∥ — Toca-discos visual: disco girando/parado, agulha levantada/baixada (CSS)
  - Arquivos: `src/components/Turntable.tsx`, `Turntable.css`, `Turntable.test.tsx`
  - Depende de: T01
  - Aceite: prop `playing` alterna animação; teste verifica classes de estado
- [x]  T06 ∥ — Busca e seleção de álbum (lista com capa, nome, artista)
  - Arquivos: `src/components/AlbumSearch.tsx`, `AlbumSearch.test.tsx`
  - Depende de: T04
  - Aceite: digitar → lista de álbuns; clicar → álbum selecionado aparece no disco

## Fase 3 — Integração

- [x] T07 — Baixar agulha toca o álbum; controles play/pause/prev/next

  - Arquivos: `src/components/Controls.tsx`, `src/App.tsx`
  - Depende de: T04, T05, T06
  - Aceite: selecionar álbum → baixar agulha → toca no Spotify em < 3s e o disco gira
- [x] T08 — Sincronização: polling a cada 2s (faixa, artista, tocando/pausado)

  - Arquivos: `src/hooks/useNowPlaying.ts`, `useNowPlaying.test.ts`, `src/components/NowPlaying.tsx`
  - Depende de: T07
  - Aceite: pausar no app do Spotify → disco para e agulha levanta em até 3s
- [x] T09 — Erros: sem dispositivo ativo, token expirado, falha de rede

  - Arquivos: `src/spotify/player.ts`, `src/App.tsx`
  - Depende de: T08
  - Aceite: com Spotify fechado, baixar agulha mostra "Abra o Spotify em algum dispositivo"

## Fase 4 — Pós-MVP

* [x]  T10 — Tema light/dark (FAZER ANTES DA T05)

  * Arquivos: `src/theme/theme.css`, `src/theme/useTheme.ts`, `useTheme.test.ts`, `src/components/ThemeToggle.tsx`
  * Depende de: T01
  * Aceite: cores só via variáveis CSS; botão alterna light/dark; segue o sistema na 1ª visita; escolha persiste ao recarregar
* [x]  T11 — Ruído de agulha (crackle) gerado via Web Audio, sem arquivo de áudio

  * Arquivos: `src/audio/crackle.ts`, `crackle.test.ts`, `src/components/CrackleControl.tsx`
  * Depende de: T08
  * Aceite: crackle toca só com agulha baixada e música tocando; para no pause; botão on/off + volume; preferência persiste
* [x]  T12 — Playlist como disco (busca retorna álbuns e playlists; baixar agulha toca qualquer um)

  * Arquivos: `src/spotify/player.ts`, `src/spotify/api.ts`, `src/components/AlbumSearch.tsx`
  * Depende de: T07
  * Aceite: buscar playlist → selecionar → baixar agulha → toca no Spotify
* [x]  T13 — Favoritos (salvar/remover disco) em localStorage

  * Arquivos: `src/library/favorites.ts`, `favorites.test.ts`, `src/components/AlbumSearch.tsx`
  * Depende de: T12
  * Aceite: favoritar na busca → persiste ao recarregar; remover funciona; UI não acessa localStorage direto
* [x]  T14 — Estante de vinis (lombadas/capas na prateleira; clicar coloca no toca-discos)

  * Arquivos: `src/components/Shelf.tsx`, `Shelf.css`, `Shelf.test.tsx`, `src/App.tsx`
  * Depende de: T13, T10
  * Aceite: favoritos aparecem na estante; clicar seleciona o disco; estante vazia mostra mensagem
* [x]  T15 — (Opcional) Importar minhas playlists do Spotify para a estante

  * Arquivos: `src/spotify/api.ts`, `src/components/Shelf.tsx`
  * Depende de: T14
  * Aceite: botão "Importar do Spotify" lista minhas playlists e adiciona as escolhidas aos favoritos

- [x]  T16 — Volume do Spotify (slider que aumenta/abaixa o volume da música)
  - Arquivos: `src/spotify/player.ts`, `player.test.ts`, `src/components/VolumeControl.tsx`, `VolumeControl.test.tsx`
  - Depende de: T08
  - Aceite: slider inicia com o volume atual do dispositivo; mover altera o volume no Spotify (envio com debounce ~300ms); se o dispositivo não suportar volume remoto, slider desabilitado com aviso


- [x]  T17 — Botão play sobre o disco selecionado (na busca, estante e minhas playlists)
  - Arquivos: `src/components/PlayOverlay.tsx`, `PlayOverlay.test.tsx`, componentes de lista
  - Depende de: T07
  - Aceite: item selecionado mostra botão play sobre a capa; clicar dispara a mesma ação de "baixar agulha"; acessível por teclado (Enter/Espaço)

## Fase 5 — Layout e experiência

- [x]  T18 — Layout: toca-discos ocupa a maior parte da tela + menu lateral recolhível

  - Depende de: T10
  - Aceite: toca-discos ocupa ~70% da largura e escala com a tela; todas as opções (busca, controles, volume, sons, estante, playlists) no menu lateral; botão recolhe/expande e o toca-discos cresce ao recolher; estado persiste; funciona em light e dark
- [x]  T19 — Estante maior: painel amplo que abre pelo menu lateral

  - Depende de: T18
  - Aceite: abre como painel grande sobre a tela (fecha com Esc ou clique fora); capas grandes em prateleiras; clicar coloca o disco no toca-discos e fecha o painel
- [x]  T20 — Detalhes do disco: ícone pequeno abaixo do toca-discos expande capa + faixas

  - Depende de: T18
  - Aceite: ícone com capa em miniatura; clicar expande capa grande + faixas (número, nome, duração) com a atual destacada; álbum via GET /albums/{id}; playlist que não é minha mostra só a capa com aviso "faixas indisponíveis"
- [x]  T21 — Sons ambiente: chuva e lareira, além do ruído de agulha

  - Depende de: T11
  - Aceite: agulha, chuva e lareira com liga/desliga e volume independentes; podem tocar juntos; agulha só com música tocando; chuva e lareira independentes da música; preferências persistem
- [x]  T22 — Sugestão de álbum baseada na estante

  - Depende de: T19 + decisão da fonte (Last.fm ou Claude API)
  - Aceite: botão lê a estante e sugere 1 álbum que não está nela, com capa, nome, artista e 1 frase de motivo; botões "Tocar" e "Adicionar à estante"; "Outra sugestão" gera nova
- [x]  T23 — Botão tela cheia (esconde barra do navegador)

  - Depende de: T18
  - Aceite: botão no menu lateral e atalho "F" alternam tela cheia via Fullscreen API; ícone muda conforme o estado; sair com Esc atualiza o ícone; menu lateral continua recolhível em tela cheia
- [x]  T24 — Instalar como app (PWA)

  - Depende de: T18
  - Aceite: manifest com nome, ícone de vinil e display "standalone"; Chrome/Edge mostram opção "Instalar"; app instalado abre em janela própria sem barra de endereço; login Spotify continua funcionando no app instalado
- [x]  T25 — Realismo da vitrola (braço, disco, base e movimento)

  - Depende de: T18
  - Aceite: braço com base giratória, contrapeso e cápsula, girando a partir do pivô até o disco ao tocar; reflexos fixos sobre o disco girando; base em madeira fosca sem listras; prato acelera/desacelera; light e dark revisados; testes d
    o Turntable passam

## Fase 6 — Publicação

- [x]  T27 — Knob da vitrola controla o volume do Spotify

  - Depende de: T16, T26
  - Aceite: knob em CSS sobreposto ao da foto; -135° (0%) a +135° (100%) por arrastar, scroll e setas; mesmo estado/debounce da T16, sincronizado com o slider; 33/45 viram mín./máx.; role="slider" com aria-valuenow
- [x]  T29 — Marca: nome Vinyl Player Simulator + logo

  - Depende de: T27
  - Aceite: "Vinil Virtual" substituído em toda a UI, <title>, manifest (name/short_name "Vinyl Player"), README e package.json; logo no topo trocando entre logo-dark-bg e logo-light-bg conforme o tema; menu recolhido mostra só o símbolo; favicon, apple-touch-icon e ícones PWA (incl. maskable) ligados no index.html e manifest; theme_color/background_color #0A0A0A; laranja #E35634 como cor de destaque nas variáveis de tema

[x]  T30 — Rodapé "Developed by: Rafael Carneiro" linkado ao GitHub

- Depende de: T29
- Aceite: rodapé discreto no canto inferior direito; "Rafael Carneiro" linka para https://github.com/elrafapc (target="_blank", rel="noopener noreferrer"); usa variáveis de tema (legível em light e dark); não sobrepõe a vitrola nem o menu; visível com menu recolhido e em tela cheia

- [x]  T28 — Preparar para publicação

  - Depende de: T29
  - Aceite: redirect do Spotify usa window.location.origin + "/callback"; vercel.json com rewrite para index.html; npm run build gera dist/ sem erro; README com variáveis de ambiente

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
