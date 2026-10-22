## Fase 1 — Fundação

* [ ]  T01 — Criar projeto base (Vite + React + TS + Vitest + ESLint) com script `validate`
  * Arquivos: `package.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `.gitignore`
  * Depende de: —
  * Aceite: `npm run validate` passa; `npm run dev` abre em http://127.0.0.1:5173
* [ ]  T02 — Login Spotify com PKCE (login, callback, guardar e renovar token)
  * Arquivos: `src/spotify/auth.ts`, `src/spotify/auth.test.ts`, `src/App.tsx`
  * Depende de: T01
  * Aceite: botão "Entrar com Spotify" → após login, tela mostra o nome do usuário; testes da geração do PKCE passam
* [ ]  T03 — Spike da API: buscar álbum, listar dispositivos, tocar álbum
  * Arquivos: `src/spotify/api.ts`, `src/spotify/api.test.ts`
  * Depende de: T02
  * Aceite: tela de debug busca "Kind of Blue", clica e o álbum toca no Spotify; registrar em DECISIONS.md qualquer endpoint com 403

## Fase 2 — Player

* [ ]  T04 — Módulo player: playAlbum, pause, resume, next, prev, getNowPlaying
  * Arquivos: `src/spotify/player.ts`, `src/spotify/player.test.ts`
  * Depende de: T03
  * Aceite: testes com fetch mockado cobrem cada função e o erro "sem dispositivo ativo"
* [ ]  T05 ∥ — Toca-discos visual: disco girando/parado, agulha levantada/baixada (CSS)
  * Arquivos: `src/components/Turntable.tsx`, `Turntable.css`, `Turntable.test.tsx`
  * Depende de: T01
  * Aceite: prop `playing` alterna animação; teste verifica classes de estado
* [ ]  T06 ∥ — Busca e seleção de álbum (lista com capa, nome, artista)
  * Arquivos: `src/components/AlbumSearch.tsx`, `AlbumSearch.test.tsx`
  * Depende de: T04
  * Aceite: digitar → lista de álbuns; clicar → álbum selecionado aparece no disco

## Fase 3 — Integração

* [ ]  T07 — Baixar agulha toca o álbum; controles play/pause/prev/next
  * Arquivos: `src/components/Controls.tsx`, `src/App.tsx`
  * Depende de: T04, T05, T06
  * Aceite: selecionar álbum → baixar agulha → toca no Spotify em < 3s e o disco gira
* [ ]  T08 — Sincronização: polling a cada 2s (faixa, artista, tocando/pausado)
  * Arquivos: `src/hooks/useNowPlaying.ts`, `useNowPlaying.test.ts`, `src/components/NowPlaying.tsx`
  * Depende de: T07
  * Aceite: pausar no app do Spotify → disco para e agulha levanta em até 3s
* [ ]  T09 — Erros: sem dispositivo ativo, token expirado, falha de rede
  * Arquivos: `src/spotify/player.ts`, `src/App.tsx`
  * Depende de: T08
  * Aceite: com Spotify fechado, baixar agulha mostra "Abra o Spotify em algum dispositivo"

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
* [X]  T15 — Importar minhas playlists do Spotify para a estante
  * Arquivos: `src/spotify/api.ts`, `src/components/Shelf.tsx`
  * Depende de: T14
  * Aceite: botão "Importar do Spotify" lista minhas playlists e adiciona as escolhidas aos favoritos
* [ ]  T16 — Volume do Spotify (slider que aumenta/abaixa o volume da música)
  * Arquivos: `src/spotify/player.ts`, `player.test.ts`, `src/components/VolumeControl.tsx`, `VolumeControl.test.tsx`
  * Depende de: T08
  * Aceite: slider inicia com o volume atual do dispositivo; mover altera o volume no Spotify (envio com debounce \~300ms); se o dispositivo não suportar volume remoto, slider desabilitado com aviso
* [ ]  T17 — Botão play sobre o disco selecionado (na busca, estante e minhas playlists)
  * Arquivos: `src/components/PlayOverlay.tsx`, `PlayOverlay.test.tsx`, componentes de lista
  * Depende de: T07
  * Aceite: item selecionado mostra botão play sobre a capa; clicar dispara a mesma ação de "baixar agulha"; acessível por teclado (Enter/Espaço)

## Fase 5 — Layout e experiência

* [ ]  T18 — Layout: toca-discos ocupa a maior parte da tela + menu lateral recolhível
  * Arquivos: `src/App.tsx`, `src/components/Sidebar.tsx`, `Sidebar.css`, `Sidebar.test.tsx`, `Turntable.css`
  * Depende de: T10
  * Aceite: toca-discos ocupa \~70% da largura e escala com a tela; todas as opções (busca, controles, volume, sons, estante, playlists) ficam no menu lateral; botão recolhe/expande o menu e o toca-discos cresce ao recolher; estado do menu persiste ao recarregar; funciona em light e dark
* [ ]  T19 — Estante maior: painel amplo que abre pelo menu lateral
  * Arquivos: `src/components/Shelf.tsx`, `Shelf.css`, `Shelf.test.tsx`
  * Depende de: T18
  * Aceite: estante abre como painel grande sobre a tela (fecha com Esc ou clique fora); capas grandes em prateleiras; clicar coloca o disco no toca-discos e fecha o painel
* [ ]  T20 — Detalhes do disco: ícone pequeno abaixo do toca-discos expande capa + faixas
  * Arquivos: `src/spotify/api.ts`, `src/components/DiscDetails.tsx`, `DiscDetails.test.tsx`
  * Depende de: T18
  * Aceite: ícone mostra a capa em miniatura; clicar expande capa grande + lista de faixas (número, nome, duração) e destaca a faixa atual; álbum usa GET /albums/{id}; playlist que não é minha mostra só a capa com aviso "faixas indisponíveis"
* [ ]  T21 — Sons ambiente: chuva e lareira, além do ruído de agulha
  * Arquivos: `src/audio/ambient.ts`, `ambient.test.ts`, `src/components/AmbientMixer.tsx`
  * Depende de: T11
  * Aceite: agulha, chuva e lareira com liga/desliga e volume independentes; podem tocar juntos; agulha só toca com música tocando, chuva e lareira tocam independentes da música; preferências persistem
* [ ]  T22 — Sugestão de álbum baseada na estante (Last.fm)
  * Depende de: T19
  * Aceite: chave em VITE\_LASTFM\_API\_KEY; módulo isolado em src/suggest/; sorteia até 5 artistas da estante → artist.getSimilar → escolhe artista similar que não está na estante → artist.getTopAlbums → encontra o álbum no Spotify (busca, limit ≤ 10); mostra capa, nome, artista e motivo ("Parecido com X"); botões "Tocar", "Adicionar à estante" e "Outra sugestão"; estante vazia mostra aviso; erro do Last.fm mostra mensagem clara

## Fase 6 — Publicação

* [ ]  T27 — Knob da vitrola controla o volume do Spotify
  * Depende de: T16, T26
  * Aceite: knob em CSS sobreposto ao da foto; -135° (0%) a +135° (100%) por arrastar, scroll e setas; mesmo estado/debounce da T16, sincronizado com o slider; 33/45 viram mín./máx.; role="slider" com aria-valuenow
* [ ]  T29 — Marca: nome Vinyl Player Simulator + logo
  * Depende de: T27
  * Aceite: "Vinil Virtual" substituído em toda a UI, <title>, manifest (name/short\_name "Vinyl Player"), README e package.json; logo no topo trocando entre logo-dark-bg e logo-light-bg conforme o tema; menu recolhido mostra só o símbolo; favicon, apple-touch-icon e ícones PWA (incl. maskable) ligados no index.html e manifest; theme\_color/background\_color #0A0A0A; laranja #E35634 como cor de destaque nas variáveis de tema
* [ ]  T30 — Rodapé "Developed by: Rafael Carneiro" linkado ao GitHub
  * Depende de: T29
  * Aceite: rodapé discreto no canto inferior direito; "Rafael Carneiro" linka para https://github.com/elrafapc (target="\_blank", rel="noopener noreferrer"); usa variáveis de tema (legível em light e dark); não sobrepõe a vitrola nem o menu; visível com menu recolhido e em tela cheia
* [ ]  T28 — Preparar para publicação
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

- [ ]  T16 — Volume do Spotify (slider que aumenta/abaixa o volume da música)

  - Arquivos: `src/spotify/player.ts`, `player.test.ts`, `src/components/VolumeControl.tsx`, `VolumeControl.test.tsx`
  - Depende de: T08
  - Aceite: slider inicia com o volume atual do dispositivo; mover altera o volume no Spotify (envio com debounce ~300ms); se o dispositivo não suportar volume remoto, slider desabilitado com aviso
- [ ]  T17 — Botão play sobre o disco selecionado (na busca, estante e minhas playlists)

  - Arquivos: `src/components/PlayOverlay.tsx`, `PlayOverlay.test.tsx`, componentes de lista
  - Depende de: T07
  - Aceite: item selecionado mostra botão play sobre a capa; clicar dispara a mesma ação de "baixar agulha"; acessível por teclado (Enter/Espaço)

## Fase 5 — Layout e experiência

- [ ]  T18 — Layout: toca-discos ocupa a maior parte da tela + menu lateral recolhível

  - Depende de: T10
  - Aceite: toca-discos ocupa ~70% da largura e escala com a tela; todas as opções (busca, controles, volume, sons, estante, playlists) no menu lateral; botão recolhe/expande e o toca-discos cresce ao recolher; estado persiste; funciona em light e dark
- [ ]  T19 — Estante maior: painel amplo que abre pelo menu lateral

  - Depende de: T18
  - Aceite: abre como painel grande sobre a tela (fecha com Esc ou clique fora); capas grandes em prateleiras; clicar coloca o disco no toca-discos e fecha o painel
- [ ]  T20 — Detalhes do disco: ícone pequeno abaixo do toca-discos expande capa + faixas

  - Depende de: T18
  - Aceite: ícone com capa em miniatura; clicar expande capa grande + faixas (número, nome, duração) com a atual destacada; álbum via GET /albums/{id}; playlist que não é minha mostra só a capa com aviso "faixas indisponíveis"
- [ ]  T21 — Sons ambiente: chuva e lareira, além do ruído de agulha

  - Depende de: T11
  - Aceite: agulha, chuva e lareira com liga/desliga e volume independentes; podem tocar juntos; agulha só com música tocando; chuva e lareira independentes da música; preferências persistem
- [ ]  T22 — Sugestão de álbum baseada na estante

  - Depende de: T19 + decisão da fonte (Last.fm ou Claude API)
  - Aceite: botão lê a estante e sugere 1 álbum que não está nela, com capa, nome, artista e 1 frase de motivo; botões "Tocar" e "Adicionar à estante"; "Outra sugestão" gera nova
- [ ]  T23 — Botão tela cheia (esconde barra do navegador)

  - Depende de: T18
  - Aceite: botão no menu lateral e atalho "F" alternam tela cheia via Fullscreen API; ícone muda conforme o estado; sair com Esc atualiza o ícone; menu lateral continua recolhível em tela cheia
- [ ]  T24 — Instalar como app (PWA)

  - Depende de: T18
  - Aceite: manifest com nome, ícone de vinil e display "standalone"; Chrome/Edge mostram opção "Instalar"; app instalado abre em janela própria sem barra de endereço; login Spotify continua funcionando no app instalado
- [ ]  T25 — Realismo da vitrola (braço, disco, base e movimento)

  - Depende de: T18
  - Aceite: braço com base giratória, contrapeso e cápsula, girando a partir do pivô até o disco ao tocar; reflexos fixos sobre o disco girando; base em madeira fosca sem listras; prato acelera/desacelera; light e dark revisados; testes d
    o Turntable passam

## Fase 6 — Publicação

- [ ]  T27 — Knob da vitrola controla o volume do Spotify

  - Depende de: T16, T26
  - Aceite: knob em CSS sobreposto ao da foto; -135° (0%) a +135° (100%) por arrastar, scroll e setas; mesmo estado/debounce da T16, sincronizado com o slider; 33/45 viram mín./máx.; role="slider" com aria-valuenow
- [ ]  T29 — Marca: nome Vinyl Player Simulator + logo

  - Depende de: T27
  - Aceite: "Vinil Virtual" substituído em toda a UI, <title>, manifest (name/short_name "Vinyl Player"), README e package.json; logo no topo trocando entre logo-dark-bg e logo-light-bg conforme o tema; menu recolhido mostra só o símbolo; favicon, apple-touch-icon e ícones PWA (incl. maskable) ligados no index.html e manifest; theme_color/background_color #0A0A0A; laranja #E35634 como cor de destaque nas variáveis de tema

[ ]  T30 — Rodapé "Developed by: Rafael Carneiro" linkado ao GitHub

- Depende de: T29
- Aceite: rodapé discreto no canto inferior direito; "Rafael Carneiro" linka para https://github.com/elrafapc (target="_blank", rel="noopener noreferrer"); usa variáveis de tema (legível em light e dark); não sobrepõe a vitrola nem o menu; visível com menu recolhido e em tela cheia

- [ ]  T28 — Preparar para publicação
  - Depende de: T29
  - Aceite: redirect do Spotify usa window.location.origin + "/callback"; vercel.json com rewrite para index.html; npm run build gera dist/ sem erro; README com variáveis de ambiente

## Fase 7 — Refinamento do menu

- [X]  T32 — Menu lateral reorganizado + cabeçalho fixo

  - Depende de: T30
  - Aceite: cabeçalho (logo + botão recolher menu) fixo no topo; bloco da música atual (faixa, artista, álbum, progresso) sai de baixo da vitrola e vai para o topo do menu; nome do dispositivo exibido como "Tocando em: <nome>"; ordem do menu: 1 Música atual, 2 Player, 3 Volume, 4 Disco, 5 Buscar discos, 6 Estante, 7 Importar do Spotify, 8 Sugestão, 9 Sons; Sons recolhível, sempre inicia recolhido; vitrola ganha o espaço liberado
- [X]  T33 — Botão adicionar/remover o disco atual da estante (ao lado do player)

  - Depende de: T32
  - Aceite: botão ao lado dos controles mostra se o disco tocando está na estante (ícone preenchido/vazio); clicar adiciona ou remove; funciona para álbum e playlist tocados direto pelo Spotify (usa o contexto atual; sem contexto, usa o álbum da faixa); usa src/library/ (sem localStorage direto); estante atualiza na hora
- [X]  T34 — Estante em carrossel + botão expandir

  - Depende de: T32
  - Aceite: no menu, carrossel horizontal com capas pequenas (scroll/arrastar e setas); clicar numa capa coloca o disco na vitrola; botão "Expandir estante" abre o painel grande atual com todos os discos; estante vazia mostra aviso
- [X]  T35 — Busca dentro de "Importar do Spotify"

  - Depende de: T32
  - Aceite: campo de busca filtra minhas playlists por nome enquanto digito (sem acento e sem diferenciar maiúsculas); carrega todas as páginas de GET /me/playlists uma vez e filtra localmente; mensagem quando nada encontrado
- [ ]  T31 — Chave do Last.fm no servidor (função da Vercel)

  - Depende de: T28
  - Aceite: chamadas ao Last.fm passam por /api/lastfm (Vercel Function); chave em LASTFM_API_KEY (sem prefixo VITE_) e ausente do bundle; função aceita só artist.getSimilar e artist.getTopAlbums; dev local continua funcionando
- [X]  T36 — Layout para celular

  - Depende de: T31, T35
  - Aceite: abaixo de 768px a vitrola ocupa a largura toda no topo e o menu vira painel deslizante de baixo para cima; controles com área de toque ≥ 44px; knob funciona por toque; sem scroll horizontal; PWA instalável no celular; testado em 375px e 768px
- [X]  T32 — Menu lateral reorganizado + cabeçalho fixo   - Depende de: T30   - Aceite: cabeçalho (logo + botão recolher menu) fixo no topo; bloco da música atual (faixa, artista, álbum, progresso) sai de baixo da vitrola e vai para o topo do menu; nome do dispositivo exibido como "Tocando em: <nome>"; ordem do menu: 1 Música atual, 2 Player, 3 Volume, 4 Disco, 5 Estante, 6 Buscar discos, 7 Importar do Spotify, 8 Sugestão, 9 Sons; Sons recolhível, sempre inicia recolhido; vitrola ganha o espaço liberado

## Fase 8 — Estante organizada

- [X]  T41 — Remover a função de sugestão de álbum
  - Depende de: —
  - Aceite: botão e seção "Sugestão" saem do menu; src/suggest/, SuggestButton e testes removidos; integração Last.fm removida (incl. /api/lastfm, se existir); VITE_LASTFM_API_KEY/LASTFM_API_KEY fora de .env.example e README; nenhuma referência a "lastfm" no código (grep vazio); ADR-005 marcado como substituído em DECISIONS.md; npm run validate e npm run build passam
- [X]  T38 — Categorias da estante (prateleiras)
  - Depende de: T34
  - Aceite: criar, renomear e excluir categorias (excluir move os discos para "Sem categoria"); cada disco tem 1 categoria; estante expandida mostra uma prateleira por categoria, com nome e contagem; carrossel do menu ganha filtro por categoria (chips, "Todas" por padrão); dados antigos migrados sem perda (todos para "Sem categoria"); lógica em src/library/ com testes
- [X]  T40 — Clicar num disco da estante expande os detalhes com botão Tocar
  - Depende de: T38
  - Aceite: clicar numa capa (carrossel ou estante expandida) abre a mesma visualização do bloco Disco (capa grande + faixas), reaproveitando o componente da T20; botões "Tocar" (mesma ação de baixar agulha), "Remover da estante" e seletor de categoria; clicar não toca mais direto; fecha com Esc, clique fora ou botão fechar
- [X]  T39 — Arrastar para reorganizar discos
  - Depende de: T40
  - Aceite: na estante expandida, arrastar reordena dentro da prateleira e move entre prateleiras; clique simples continua abrindo os detalhes (arrasto só começa após mover ~8px); funciona com mouse, toque e teclado (setas + espaço); ordem persiste e o carrossel segue a mesma ordem; usa @dnd-kit (dependência autorizada); testes da reordenação em src/library/

## Fase 9 — Etiquetas e ajustes

- [X]  T42 — Volume só pelo knob físico

  - Depende de: T27
  - Aceite: slider de volume sai do menu; componente VolumeControl mantido no código e desligado por uma constante (SHOW_VOLUME_SLIDER = false) com comentário explicando como reativar; knob continua funcionando; testes do knob passam
- [X]  T43 — Etiquetas (várias por disco) no lugar de categoria única

  - Depende de: T39
  - Aceite: botão "+ Nova categoria" e seletores acima das capas removidos; nos detalhes do disco, campo de etiquetas: digitar + Enter adiciona (cria se não existir), autocompletar com etiquetas já usadas, clicar no "x" ou Backspace remove; sem duplicadas (ignora maiúsculas/acentos, mantém a 1ª grafia); lista de etiquetas derivada dos discos (some quando nenhum disco usa); etiquetas não aparecem nas capas; estante vira uma coleção única (sem prateleira por categoria); arrastar da T39 ajustado: só reordena dentro da coleção única (remove mover entre prateleiras), ordem atual preservada na migração; migração: categoria antiga vira etiqueta, "Sem categoria" vira nenhuma; lógica em src/library/ com testes
- [X]  T44 — Filtro por etiquetas na estante

  - Depende de: T43
  - Aceite: no topo da estante expandida, chips com todas as etiquetas + "Sem etiqueta"; selecionar 1 ou mais mostra só os discos que têm TODAS as selecionadas; contador "X de Y discos"; botão limpar filtro; carrossel do menu segue o mesmo filtro; com filtro ativo o arrastar fica desabilitado (reordenar só sem filtro)
- [X]  T45 — Redesign visual da estante (em branch separada)

  - Depende de: T44
  - Aceite: feito na branch design-estante; estante de madeira escura em CSS: moldura com cornija no topo e rodapé na base, fundo de tábuas verticais, prateleiras grossas com borda frontal e sombra, divisória central em 2 vãos (1 vão abaixo de 768px); capas em pé sobre as prateleiras com sombra de contato; quantidade de prateleiras se ajusta ao número de discos; filtros e detalhes do disco intactos; light e dark ok; sem imagens externas pesadas
- [ ]  T46 — Reduzir chamadas ao Spotify (erro 429 "muitas requisições")

  - Depende de: —
  - Aceite: toda chamada passa por um único cliente em src/spotify/ com: fila global que pausa tudo pelo tempo do header Retry-After ao receber 429 (sem retry imediato), deduplicação de GETs iguais em andamento e contador de chamadas/min visível no console em dev; um único polling no app inteiro (contexto compartilhado, nenhum componente faz polling próprio); polling adaptativo: 5s tocando, 20s pausado, parado com aba oculta, imediato após ação do usuário; barra de progresso avança localmente entre polls; cache de detalhes de álbum (memória + localStorage, sem expirar) e de playlists (10 min); busca com debounce 400ms, mínimo 2 caracteres e cache por termo; knob envia volume só ao soltar ou após 300ms parado; uso normal (tocar, pausar, abrir estante e detalhes) fica abaixo de 20 chamadas/min; testes do cliente cobrindo 429 + Retry-After e deduplicação

## Fase 10 — Menu lateral vintage (branch menu-vintage, uma task por vez)

## Fase 10 — Menu lateral vintage (branch menu-vintage) — encerrada

- [X]  T49 — Display vintage da música atual (substituído pela tela do console na T56)
- [X]  T51 — Disco dentro de um quadro (continua valendo nos detalhes abertos pela estante)

- T50, T52, T53 — canceladas (substituídas pela Fase 11)

## Fase 11 — Console (design por imagem) — branch console (criada a partir de menu-vintage)

- [X]  T54 — Camadas do console prontas em public/console/ (console-base.webp com a tela do player já desenhada e sem conteúdo, record.webp, tonearm.webp, knob-cap.webp) + CONSOLE.md com posições, ângulos, fontes e cores
- [ ]  T55 — Console como base da tela (vitrola por camadas de imagem)

  - Depende de: T54
  - Aceite: console-base ocupa a área principal com proporção fixa (escala junto com a tela, sem distorcer); disco, braço e knob posicionados em % sobre a base; disco gira com a capa do álbum no selo; braço gira pelo pivô usando os ângulos de public/console/CONSOLE.md (repouso → início do disco → avança até o fim do disco conforme o progresso do álbum); vitrola antiga removida; imagens WebP de public/console/ com preload da base; nenhum CSS simulando madeira/metal; light e dark só mudam o fundo da página
- [ ]  T56 — Tela do console com o player (conteúdo dinâmico sobre a tela já desenhada na imagem)

  - Depende de: T55
  - Aceite: painéis, moldura da capa, corpo dos botões e anel do knob vêm de console-base.webp (sem CSS imitando esses elementos); sobre eles, nas posições de public/console/CONSOLE.md: capa quadrada com vinil saindo por trás à direita, faixa, artista, álbum (ano), barra de progresso com tempo decorrido/total, ícones SVG âmbar de anterior/play-pause/próxima nas áreas clicáveis, knob-cap.webp girando para o volume (volume sai do knob da vitrola, que vira 33/45 decorativo); lista de faixas do disco atual com a faixa tocando destacada (▶ + âmbar), rolagem interna e clicar numa faixa toca a partir dela (context_uri + offset); "Tocando em" e estrela de estante em posição discreta na tela; fontes, tamanhos (cqw) e cores de CONSOLE.md; blocos Música atual, Player e Disco saem do menu lateral
- [ ]  T57 — Menu lateral enxuto e harmonizado

  - Depende de: T56
  - Aceite: menu só com Estante, Buscar discos, Importar do Spotify e Sons (nessa ordem); um único painel com as cores da tela do console (fundo #13100D, textos creme, sem simular madeira/vidro em CSS); um padrão só para títulos de seção, espaçamentos (grade de 8px), botões, campos e chips; destaque âmbar igual ao da tela; Sons recolhido por padrão; cabeçalho (logo, usuário, tema, tela cheia, recolher) no mesmo padrão; contraste AA; remove código, variáveis de material e fontes da T49 que ficarem sem uso
- [X]  T49 — Display vintage da música atual + base de materiais

  - Depende de: T47
  - Aceite: cria variáveis de material reutilizáveis no tema (madeira, metal escovado, baquelite, vidro LCD, papel creme) para as próximas tasks; bloco Música atual vira um display LCD antigo em tons de cinza: moldura escura em relevo, vidro com leve reflexo e linhas de varredura, texto com brilho suave; exibe só as informações que já existem: faixa (letreiro rolante quando não couber), artista, álbum e "Tocando em"; tempo decorrido e duração total da faixa (ex.: 01:23 / 04:05) em fonte de 7 segmentos; barra de progresso em blocos segmentados; sem visualizador; tempo avança localmente entre polls (sem chamadas extras); fontes OFL hospedadas em public/fonts (DSEG7 e VT323 ou equivalentes); light e dark ok
- [X]  T50 — Botões do player em madeira

  - Depende de: T49
  - Aceite: anterior, play/pause, próxima e estrela viram teclas de madeira escura com veio (CSS, sem imagem pesada), bordas arredondadas e chanfradas; ícones gravados em creme/latão; play maior; estado pressionado afunda (sombra interna + deslocamento); foco visível por teclado; estrela preenchida continua indicando "na estante"
- [X]  T51 — Disco dentro de um quadro (miniatura e expandido)

  - Depende de: T49
  - Aceite: miniatura do bloco Disco vira um quadro: moldura preta grossa, passe-partout branco, capa à esquerda e vinil saindo pela direita; ao expandir, os detalhes abrem com o mesmo quadro em tamanho grande ao lado da lista de faixas; vale também para os detalhes abertos pela estante (mesmo componente); sombra de quadro pendurado; light e dark ok
- [X]  T52 — Carrossel da estante sobre prateleira de madeira

  - Depende de: T50
  - Aceite: capas do carrossel ficam em pé sobre uma prateleira de madeira (tábua com borda frontal, sombra de contato); setas viram puxadores de latão; chips de etiqueta em estilo etiqueta de papel creme; disco atual destacado com luz suave em vez de borda vermelha; madeira igual à dos botões do player
- [X]  T53 — Harmonizar o restante do menu

  - Depende de: T52
  - Aceite: fundo do menu em painel escuro (madeira ou couro) coerente com a vitrola; títulos das seções como plaquinhas de metal gravadas; campo de busca e botão Importar em estilo placa/baquelite; Sons com chaves liga/desliga estilo alavanca e controles deslizantes estilo fader; botões do topo (tela cheia, tema, recolher menu, sair) no mesmo padrão; contraste AA mantido; light e dark ok

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

Legenda: [ ] pendente · [~] em andamento · [x] feita · [-] obsoleta (substituída ou removida) · ∥ pode rodar em paralelo

> [-] = não faz mais sentido no projeto atual; o motivo fica ao lado do título.

## Fase 1 — Fundação

- [X]  T01 — Criar projeto base (Vite + React + TS + Vitest + ESLint) com script `validate`

  - Arquivos: `package.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `.gitignore`
  - Depende de: —
  - Aceite: `npm run validate` passa; `npm run dev` abre em http://127.0.0.1:5173
- [X]  T02 — Login Spotify com PKCE (login, callback, guardar e renovar token)

  - Arquivos: `src/spotify/auth.ts`, `src/spotify/auth.test.ts`, `src/App.tsx`
  - Depende de: T01
  - Aceite: botão "Entrar com Spotify" → após login, tela mostra o nome do usuário; testes da geração do PKCE passam
- [X]  T03 — Spike da API: buscar álbum, listar dispositivos, tocar álbum

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

- [X]  T07 — Baixar agulha toca o álbum; controles play/pause/prev/next

  - Arquivos: `src/components/Controls.tsx`, `src/App.tsx`
  - Depende de: T04, T05, T06
  - Aceite: selecionar álbum → baixar agulha → toca no Spotify em < 3s e o disco gira
- [X]  T08 — Sincronização: polling a cada 2s (faixa, artista, tocando/pausado) — hoje 5s tocando / 20s pausado (T46)

  - Arquivos: `src/hooks/useNowPlaying.ts`, `useNowPlaying.test.ts`, `src/components/NowPlaying.tsx`
  - Depende de: T07
  - Aceite: pausar no app do Spotify → disco para e agulha levanta em até 3s
- [X]  T09 — Erros: sem dispositivo ativo, token expirado, falha de rede

  - Arquivos: `src/spotify/player.ts`, `src/App.tsx`
  - Depende de: T08
  - Aceite: com Spotify fechado, baixar agulha mostra "Abra o Spotify em algum dispositivo"

## Fase 4 — Pós-MVP

* [X]  T10 — Tema light/dark (FAZER ANTES DA T05)

  * Arquivos: `src/theme/theme.css`, `src/theme/useTheme.ts`, `useTheme.test.ts`, `src/components/ThemeToggle.tsx`
  * Depende de: T01
  * Aceite: cores só via variáveis CSS; botão alterna light/dark; segue o sistema na 1ª visita; escolha persiste ao recarregar
* [X]  T11 — Ruído de agulha (crackle) gerado via Web Audio, sem arquivo de áudio

  * Arquivos: `src/audio/crackle.ts`, `crackle.test.ts`, `src/components/CrackleControl.tsx`
  * Depende de: T08
  * Aceite: crackle toca só com agulha baixada e música tocando; para no pause; botão on/off + volume; preferência persiste
* [X]  T12 — Playlist como disco (busca retorna álbuns e playlists; baixar agulha toca qualquer um)

  * Arquivos: `src/spotify/player.ts`, `src/spotify/api.ts`, `src/components/AlbumSearch.tsx`
  * Depende de: T07
  * Aceite: buscar playlist → selecionar → baixar agulha → toca no Spotify
* [X]  T13 — Favoritos (salvar/remover disco) em localStorage

  * Arquivos: `src/library/favorites.ts`, `favorites.test.ts`, `src/components/AlbumSearch.tsx`
  * Depende de: T12
  * Aceite: favoritar na busca → persiste ao recarregar; remover funciona; UI não acessa localStorage direto
* [X]  T14 — Estante de vinis (lombadas/capas na prateleira; clicar coloca no toca-discos)

  * Arquivos: `src/components/Shelf.tsx`, `Shelf.css`, `Shelf.test.tsx`, `src/App.tsx`
  * Depende de: T13, T10
  * Aceite: favoritos aparecem na estante; clicar seleciona o disco; estante vazia mostra mensagem
* [X]  T15 — (Opcional) Importar minhas playlists do Spotify para a estante

  * Arquivos: `src/spotify/api.ts`, `src/components/Shelf.tsx`
  * Depende de: T14
  * Aceite: botão "Importar do Spotify" lista minhas playlists e adiciona as escolhidas aos favoritos

- [-]  T16 — Volume do Spotify (slider que aumenta/abaixa o volume da música) — OBSOLETA: volume só pelo knob da vitrola (T42; slider desligado)

  - Arquivos: `src/spotify/player.ts`, `player.test.ts`, `src/components/VolumeControl.tsx`, `VolumeControl.test.tsx`
  - Depende de: T08
  - Aceite: slider inicia com o volume atual do dispositivo; mover altera o volume no Spotify (envio com debounce ~300ms); se o dispositivo não suportar volume remoto, slider desabilitado com aviso

- [X]  T17 — Botão play sobre o disco selecionado (na busca, estante e minhas playlists)

  - Arquivos: `src/components/PlayOverlay.tsx`, `PlayOverlay.test.tsx`, componentes de lista
  - Depende de: T07
  - Aceite: item selecionado mostra botão play sobre a capa; clicar dispara a mesma ação de "baixar agulha"; acessível por teclado (Enter/Espaço)

## Fase 5 — Layout e experiência

- [X]  T18 — Layout: toca-discos ocupa a maior parte da tela + menu lateral recolhível

  - Depende de: T10
  - Aceite: toca-discos ocupa ~70% da largura e escala com a tela; todas as opções (busca, controles, volume, sons, estante, playlists) no menu lateral; botão recolhe/expande e o toca-discos cresce ao recolher; estado persiste; funciona em light e dark
- [X]  T19 — Estante maior: painel amplo que abre pelo menu lateral

  - Depende de: T18
  - Aceite: abre como painel grande sobre a tela (fecha com Esc ou clique fora); capas grandes em prateleiras; clicar coloca o disco no toca-discos e fecha o painel
- [X]  T20 — Detalhes do disco: ícone pequeno abaixo do toca-discos expande capa + faixas

  - Depende de: T18
  - Aceite: ícone com capa em miniatura; clicar expande capa grande + faixas (número, nome, duração) com a atual destacada; álbum via GET /albums/{id}; playlist que não é minha mostra só a capa com aviso "faixas indisponíveis"
- [X]  T21 — Sons ambiente: chuva e lareira, além do ruído de agulha

  - Depende de: T11
  - Aceite: agulha, chuva e lareira com liga/desliga e volume independentes; podem tocar juntos; agulha só com música tocando; chuva e lareira independentes da música; preferências persistem

- [-]  T22 — Sugestão de álbum baseada na estante — OBSOLETA: sugestão removida (T41, ADR-027)

  - Depende de: T19 + decisão da fonte (Last.fm ou Claude API)
  - Aceite: botão lê a estante e sugere 1 álbum que não está nela, com capa, nome, artista e 1 frase de motivo; botões "Tocar" e "Adicionar à estante"; "Outra sugestão" gera nova

- [X]  T23 — Botão tela cheia (esconde barra do navegador)

  - Depende de: T18
  - Aceite: botão no menu lateral e atalho "F" alternam tela cheia via Fullscreen API; ícone muda conforme o estado; sair com Esc atualiza o ícone; menu lateral continua recolhível em tela cheia
- [X]  T24 — Instalar como app (PWA)

  - Depende de: T18
  - Aceite: manifest com nome, ícone de vinil e display "standalone"; Chrome/Edge mostram opção "Instalar"; app instalado abre em janela própria sem barra de endereço; login Spotify continua funcionando no app instalado

- [-]  T25 — Realismo da vitrola (braço, disco, base e movimento) — OBSOLETA: vitrola passou a ser a foto (ADR-018)

  - Depende de: T18
  - Aceite: braço com base giratória, contrapeso e cápsula, girando a partir do pivô até o disco ao tocar; reflexos fixos sobre o disco girando; base em madeira fosca sem listras; prato acelera/desacelera; light e dark revisados; testes d
    o Turntable passam

## Fase 6 — Publicação

- [X]  T27 — Knob da vitrola controla o volume do Spotify

  - Depende de: T16, T26
  - Aceite: knob em CSS sobreposto ao da foto; -135° (0%) a +135° (100%) por arrastar, scroll e setas; mesmo estado/debounce da T16, sincronizado com o slider; 33/45 viram mín./máx.; role="slider" com aria-valuenow
- [X]  T29 — Marca: nome Vinyl Player Simulator + logo

  - Depende de: T27
  - Aceite: "Vinil Virtual" substituído em toda a UI, <title>, manifest (name/short_name "Vinyl Player"), README e package.json; logo no topo trocando entre logo-dark-bg e logo-light-bg conforme o tema; menu recolhido mostra só o símbolo; favicon, apple-touch-icon e ícones PWA (incl. maskable) ligados no index.html e manifest; theme_color/background_color #0A0A0A; laranja #E35634 como cor de destaque nas variáveis de tema
- [X]  T30 — Rodapé "Developed by: Rafael Carneiro" linkado ao GitHub

- Depende de: T29
- Aceite: rodapé discreto no canto inferior direito; "Rafael Carneiro" linka para https://github.com/elrafapc (target="_blank", rel="noopener noreferrer"); usa variáveis de tema (legível em light e dark); não sobrepõe a vitrola nem o menu; visível com menu recolhido e em tela cheia

- [X]  T28 — Preparar para publicação
  - Depende de: T29
  - Aceite: redirect do Spotify usa window.location.origin + "/callback"; vercel.json com rewrite para index.html; npm run build gera dist/ sem erro; README com variáveis de ambiente

## Fase 7 — Refinamento do menu

- [X]  T32 — Menu lateral reorganizado + cabeçalho fixo

  - Depende de: T30
  - Aceite: cabeçalho (logo + botão recolher menu) fixo no topo; bloco da música atual (faixa, artista, álbum, progresso) sai de baixo da vitrola e vai para o topo do menu; nome do dispositivo exibido como "Tocando em: <nome>"; ordem do menu: 1 Música atual, 2 Player, 3 Volume, 4 Disco, 5 Buscar discos, 6 Estante, 7 Importar do Spotify, 8 Sugestão, 9 Sons; Sons recolhível, sempre inicia recolhido; vitrola ganha o espaço liberado
- [X]  T33 — Botão adicionar/remover o disco atual da estante (ao lado do player)

  - Depende de: T32
  - Aceite: botão ao lado dos controles mostra se o disco tocando está na estante (ícone preenchido/vazio); clicar adiciona ou remove; funciona para álbum e playlist tocados direto pelo Spotify (usa o contexto atual; sem contexto, usa o álbum da faixa); usa src/library/ (sem localStorage direto); estante atualiza na hora
- [X]  T34 — Estante em carrossel + botão expandir

  - Depende de: T32
  - Aceite: no menu, carrossel horizontal com capas pequenas (scroll/arrastar e setas); clicar numa capa coloca o disco na vitrola; botão "Expandir estante" abre o painel grande atual com todos os discos; estante vazia mostra aviso
- [X]  T35 — Busca dentro de "Importar do Spotify"

  - Depende de: T32
  - Aceite: campo de busca filtra minhas playlists por nome enquanto digito (sem acento e sem diferenciar maiúsculas); carrega todas as páginas de GET /me/playlists uma vez e filtra localmente; mensagem quando nada encontrado

- [-]  T31 — Chave do Last.fm no servidor (função da Vercel) — OBSOLETA: Last.fm removido (T41)

  - Depende de: T28
  - Aceite: chamadas ao Last.fm passam por /api/lastfm (Vercel Function); chave em LASTFM_API_KEY (sem prefixo VITE_) e ausente do bundle; função aceita só artist.getSimilar e artist.getTopAlbums; dev local continua funcionando

- [X]  T36 — Layout para celular

  - Depende de: T31, T35
  - Aceite: abaixo de 768px a vitrola ocupa a largura toda no topo e o menu vira painel deslizante de baixo para cima; controles com área de toque ≥ 44px; knob funciona por toque; sem scroll horizontal; PWA instalável no celular; testado em 375px e 768px

## Fase 8 — Estante organizada

- [X]  T41 — Remover a função de sugestão de álbum
  - Depende de: —
  - Aceite: botão e seção "Sugestão" saem do menu; src/suggest/, SuggestButton e testes removidos; integração Last.fm removida (incl. /api/lastfm, se existir); VITE_LASTFM_API_KEY/LASTFM_API_KEY fora de .env.example e README; nenhuma referência a "lastfm" no código (grep vazio); ADR-005 marcado como substituído em DECISIONS.md; npm run validate e npm run build passam

- [-]  T38 — Categorias da estante (prateleiras) — OBSOLETA: categorias trocadas por etiquetas (T43)
  - Depende de: T34
  - Aceite: criar, renomear e excluir categorias (excluir move os discos para "Sem categoria"); cada disco tem 1 categoria; estante expandida mostra uma prateleira por categoria, com nome e contagem; carrossel do menu ganha filtro por categoria (chips, "Todas" por padrão); dados antigos migrados sem perda (todos para "Sem categoria"); lógica em src/library/ com testes

- [X]  T40 — Clicar num disco da estante expande os detalhes com botão Tocar
  - Depende de: T38
  - Aceite: clicar numa capa (carrossel ou estante expandida) abre a mesma visualização do bloco Disco (capa grande + faixas), reaproveitando o componente da T20; botões "Tocar" (mesma ação de baixar agulha), "Remover da estante" e seletor de categoria; clicar não toca mais direto; fecha com Esc, clique fora ou botão fechar
- [X]  T39 — Arrastar para reorganizar discos
  - Depende de: T40
  - Aceite: na estante expandida, arrastar reordena dentro da prateleira e move entre prateleiras; clique simples continua abrindo os detalhes (arrasto só começa após mover ~8px); funciona com mouse, toque e teclado (setas + espaço); ordem persiste e o carrossel segue a mesma ordem; usa @dnd-kit (dependência autorizada); testes da reordenação em src/library/

## Fase 9 — Etiquetas e ajustes

- [X]  T42 — Volume só pelo knob físico

  - Depende de: T27
  - Aceite: slider de volume sai do menu; componente VolumeControl mantido no código e desligado por uma constante (SHOW_VOLUME_SLIDER = false) com comentário explicando como reativar; knob continua funcionando; testes do knob passam
- [X]  T43 — Etiquetas (várias por disco) no lugar de categoria única

  - Depende de: T39
  - Aceite: botão "+ Nova categoria" e seletores acima das capas removidos; nos detalhes do disco, campo de etiquetas: digitar + Enter adiciona (cria se não existir), autocompletar com etiquetas já usadas, clicar no "x" ou Backspace remove; sem duplicadas (ignora maiúsculas/acentos, mantém a 1ª grafia); lista de etiquetas derivada dos discos (some quando nenhum disco usa); etiquetas não aparecem nas capas; estante vira uma coleção única (sem prateleira por categoria); arrastar da T39 ajustado: só reordena dentro da coleção única (remove mover entre prateleiras), ordem atual preservada na migração; migração: categoria antiga vira etiqueta, "Sem categoria" vira nenhuma; lógica em src/library/ com testes
- [X]  T44 — Filtro por etiquetas na estante

  - Depende de: T43
  - Aceite: no topo da estante expandida, chips com todas as etiquetas + "Sem etiqueta"; selecionar 1 ou mais mostra só os discos que têm TODAS as selecionadas; contador "X de Y discos"; botão limpar filtro; carrossel do menu segue o mesmo filtro; com filtro ativo o arrastar fica desabilitado (reordenar só sem filtro)
- [X]  T45 — Redesign visual da estante (em branch separada)

  - Depende de: T44
  - Aceite: feito na branch design-estante; estante de madeira escura em CSS: moldura com cornija no topo e rodapé na base, fundo de tábuas verticais, prateleiras grossas com borda frontal e sombra, divisória central em 2 vãos (1 vão abaixo de 768px); capas em pé sobre as prateleiras com sombra de contato; quantidade de prateleiras se ajusta ao número de discos; filtros e detalhes do disco intactos; light e dark ok; sem imagens externas pesadas
- [X]  T46 — Reduzir chamadas ao Spotify (erro 429 "muitas requisições")

  - Depende de: —
  - Aceite: toda chamada passa por um único cliente em src/spotify/ com: fila global que pausa tudo pelo tempo do header Retry-After ao receber 429 (sem retry imediato), deduplicação de GETs iguais em andamento e contador de chamadas/min visível no console em dev; um único polling no app inteiro (contexto compartilhado, nenhum componente faz polling próprio); polling adaptativo: 5s tocando, 20s pausado, parado com aba oculta, imediato após ação do usuário; barra de progresso avança localmente entre polls; cache de detalhes de álbum (memória + localStorage, sem expirar) e de playlists (10 min); busca com debounce 400ms, mínimo 2 caracteres e cache por termo; knob envia volume só ao soltar ou após 300ms parado; uso normal (tocar, pausar, abrir estante e detalhes) fica abaixo de 20 chamadas/min; testes do cliente cobrindo 429 + Retry-After e deduplicação

## Fase 10 — Menu lateral vintage (branch menu-vintage, uma task por vez)

- [X]  T49 — Display vintage da música atual + base de materiais
  - Depende de: T47
  - Aceite: cria variáveis de material reutilizáveis no tema (madeira, metal escovado, baquelite, vidro LCD, papel creme) para as próximas tasks; bloco Música atual vira um display LCD antigo em tons de cinza: moldura escura em relevo, vidro com leve reflexo e linhas de varredura, texto com brilho suave; exibe só as informações que já existem: faixa (letreiro rolante quando não couber), artista, álbum e "Tocando em"; tempo decorrido e duração total da faixa (ex.: 01:23 / 04:05) em fonte de 7 segmentos; barra de progresso em blocos segmentados; sem visualizador; tempo avança localmente entre polls (sem chamadas extras); fontes OFL hospedadas em public/fonts (DSEG7 e VT323 ou equivalentes); light e dark ok
- [X]  T50 — Botões do player em madeira
  - Depende de: T49
  - Aceite: anterior, play/pause, próxima e estrela viram teclas de madeira escura com veio (CSS, sem imagem pesada), bordas arredondadas e chanfradas; ícones gravados em creme/latão; play maior; estado pressionado afunda (sombra interna + deslocamento); foco visível por teclado; estrela preenchida continua indicando "na estante"
- [X]  T51 — Disco dentro de um quadro (miniatura e expandido)
  - Depende de: T49
  - Aceite: miniatura do bloco Disco vira um quadro: moldura preta grossa, passe-partout branco, capa à esquerda e vinil saindo pela direita; ao expandir, os detalhes abrem com o mesmo quadro em tamanho grande ao lado da lista de faixas; vale também para os detalhes abertos pela estante (mesmo componente); sombra de quadro pendurado; light e dark ok
- [X]  T52 — Carrossel da estante sobre prateleira de madeira
  - Depende de: T50
  - Aceite: capas do carrossel ficam em pé sobre uma prateleira de madeira (tábua com borda frontal, sombra de contato); setas viram puxadores de latão; chips de etiqueta em estilo etiqueta de papel creme; disco atual destacado com luz suave em vez de borda vermelha; madeira igual à dos botões do player
- [X]  T53 — Harmonizar o restante do menu
  - Depende de: T52
  - Aceite: fundo do menu em painel escuro (madeira ou couro) coerente com a vitrola; títulos das seções como plaquinhas de metal gravadas; campo de busca e botão Importar em estilo placa/baquelite; Sons com chaves liga/desliga estilo alavanca e controles deslizantes estilo fader; botões do topo (tela cheia, tema, recolher menu, sair) no mesmo padrão; contraste AA mantido; light e dark ok

## Fase 11 — Console (branch console)

- [X]  T55 — Vitrola vira o console da foto (vitrola + tela do player)

  - Depende de: T53
  - Aceite: palco usa public/console/console-base.webp com as camadas de CONSOLE.md (posições em % da base); disco record.webp gira (gira primeiro, achata 0,925 depois) com a capa no selo e reflexo fixo; braço tonearm.webp com pivô do CONSOLE.md: -24° parado, de -6,75° a +16° conforme o progresso do disco; tela sobrepõe só o dinâmico: capa + vinil na janela, faixa/artista/álbum, progresso âmbar e tempos, botões anterior/play/próxima, knob-cap.webp como volume (-135° a +135°, mesmo debounce), lista de faixas (12 linhas, rolagem interna, atual em âmbar); fontes em cqw, Lora hospedada em public/fonts; sem polling novo; gaveta abre a estante; no desktop Música atual/Player/Disco saem do menu (★ e "Tocando em" ficam); no celular a tela é só leitura e o menu mantém esses blocos
- [ ]  T56 — Tela do console com o player (conteúdo dinâmico sobre a tela já desenhada na imagem)

  - Depende de: T55
  - Aceite: painéis, moldura da capa, corpo dos botões e anel do knob vêm de console-base.webp (sem CSS imitando esses elementos); sobre eles, nas posições de public/console/CONSOLE.md: capa quadrada com vinil saindo por trás à direita, faixa, artista, álbum (ano), barra de progresso com tempo decorrido/total, ícones SVG âmbar de anterior/play-pause/próxima nas áreas clicáveis, knob-cap.webp girando para o volume (volume sai do knob da vitrola, que vira 33/45 decorativo); lista de faixas do disco atual com a faixa tocando destacada (▶ + âmbar), rolagem interna e clicar numa faixa toca a partir dela (context_uri + offset); "Tocando em" e estrela de estante em posição discreta na tela; fontes, tamanhos (cqw) e cores de CONSOLE.md; blocos Música atual, Player e Disco saem do menu lateral

- [ ]  T57 — Menu lateral redesenhado conforme docs/design/MENU.md
  - Depende de: T56
  - Aceite: estrutura, cores (escuro e claro), tipografia, medidas e estados exatamente como docs/design/MENU.md e as imagens em docs/design/; menu só com cabeçalho, Estante, Buscar discos, Importar do Spotify e Sons ambiente (nessa ordem); fundo do menu igual ao da página, sem texturas (remove madeira, plaquinhas, papel, puxadores e alavancas atuais); "Importar playlists" é o único botão âmbar; Sons começa fechado com resumo do estado; cores viram variáveis de tema (nenhum hex solto nos componentes); fontes Lora e Inter locais em public/fonts; remove código, variáveis e fontes sem uso (incluindo os da T49); contraste AA; foco visível por teclado


## Fase 12 — Coleção

- [ ]  T58 — Tela "Sua coleção" agrupada por etiquetas (substitui a estante expandida)
  - Depende de: T57
  - Aceite: visual no padrão de docs/design/MENU.md (fundo liso, Lora nos títulos, Inter no resto, âmbar só no ativo; remove a estante de madeira em CSS); cabeçalho: "Sua coleção" + contador discreto, busca na coleção (nome/artista, sem acento), seletor "Organizar por" (Etiquetas | Artista | Adicionados recentemente | Minha ordem), chips de etiqueta que filtram, botão fechar; modo Etiquetas (padrão): uma seção por etiqueta em ordem alfabética, "Sem etiqueta" por último, título "Rock · 6", capas em linha com rolagem horizontal, disco com várias etiquetas aparece em cada seção; demais modos: grade única; arrastar só em "Minha ordem"; modo escolhido persiste; clique na capa abre os detalhes (quadro da T51), hover mostra botão tocar, disco tocando com anel âmbar; lógica de agrupar/ordenar/buscar em src/library/ com testes; Esc fecha; contraste AA

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
