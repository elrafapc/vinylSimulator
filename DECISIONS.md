# Decisões — Vinil Virtual

## ADR-001 — Controlar o Spotify em vez de tocar no navegador

- Data: 2026-10-15
- Contexto: Web Playback SDK com relatos de falha em Development Mode após as mudanças de 2026.
- Decisão: o app controla o Spotify (desktop/celular) via Web API; o áudio sai do app do Spotify.
- Alternativas: Web Playback SDK — descartado por risco e complexidade.
- Consequência: Spotify precisa estar aberto em algum dispositivo.

## ADR-002 — Sem backend, OAuth PKCE no navegador

- Data: 2026-10-15
- Contexto: uso pessoal, rodando local.
- Decisão: PKCE no cliente; redirect http://127.0.0.1:5173/callback.
- Alternativas: backend com client secret — desnecessário agora.
- Consequência: backend só quando houver contas/venda de discos.

## ADR-003 — Stack Vite + React + TypeScript + Vitest

- Data: 2026-10-15
- Contexto: UI com estado de player e animação simples.
- Decisão: Vite + React + TS; animação em CSS; Vitest para testes.
- Alternativas: JS puro — mais simples no início, pior para manter estado.
- Consequência: uma etapa de build, ferramentas padrão de mercado.

## ADR-004 — Acesso ao Spotify isolado em src/spotify/

- Data: 2026-10-15
- Contexto: no futuro, outras fontes de discos.
- Decisão: a UI só chama funções de src/spotify/ (playAlbum, pause, getNowPlaying...).
- Alternativas: interface genérica de "fonte de música" — abstração antecipada.
- Consequência: nova fonte entra ao lado, sem reescrever a UI.

## ADR-005 — Busca limitada a 10 resultados

- Data: 2026-10-20
- Contexto: em Development Mode o Spotify limita `/search` a no máximo 10 itens por página.
- Decisão: `searchAlbums` usa `limit=10`, sem paginação.
- Alternativas: paginar com `offset` — desnecessário para escolher um disco.
- Consequência: buscas genéricas exigem termos mais específicos.

## ADR-006 — Sem dispositivo ativo, acordar o primeiro disponível

- Data: 2026-10-20
- Contexto: com o Spotify aberto mas ocioso, `/me/player/play` retorna 404 NO_ACTIVE_DEVICE.
- Decisão: `playAlbum`/`resume` tentam de novo com `device_id` do primeiro dispositivo não restrito; sem nenhum, mostram "Abra o Spotify em algum dispositivo".
- Alternativas: sempre exibir erro — pior experiência no caso mais comum.
- Consequência: pode tocar num dispositivo inesperado se houver vários abertos.

## ADR-007 — Trocar de disco levanta a agulha

- Data: 2026-10-20
- Contexto: selecionar outro álbum enquanto um toca.
- Decisão: selecionar um álbum diferente pausa a reprodução; tocar o novo exige baixar a agulha.
- Alternativas: tocar imediatamente ao selecionar — perde o ritual do vinil.
- Consequência: um clique a mais, intencional.

## ADR-008 — Testes rodam com `--no-experimental-webstorage`

- Data: 2026-10-20
- Contexto: Node 22+ expõe um `localStorage` nativo que sobrepõe o do jsdom e quebra os testes.
- Decisão: `vite.config.ts` passa a flag aos workers do Vitest.
- Consequência: nenhuma no app; só afeta o ambiente de testes.

## ADR-009 — "Disco" = álbum ou playlist; comparação pelo contexto

- Data: 2026-10-20
- Contexto: T12 permite tocar playlists; o álbum da faixa atual não identifica a playlist.
- Decisão: tipo `Disc` (`kind: 'album' | 'playlist'`), `searchDiscs` e `playDisc(contextUri)`; o app compara o disco selecionado com `contextUri` do `/me/player`.
- Alternativas: tipos separados para álbum e playlist — duplicaria a UI.
- Consequência: substitui `searchAlbums`/`playAlbum` citados na ADR-004.

## ADR-010 — Chiado gerado na hora, ligado por padrão

- Data: 2026-10-20
- Contexto: T11 pede ruído de agulha sem arquivo de áudio.
- Decisão: buffer de 6s gerado com Web Audio (chiado filtrado + estalos aleatórios) em loop; começa ligado com volume 35%.
- Consequência: navegadores podem exigir um clique na página antes do primeiro som.

## ADR-011 — Escopos de playlist no login

- Data: 2026-10-20
- Contexto: T15 importa playlists do usuário (`/me/playlists`).
- Decisão: adicionar `playlist-read-private` e `playlist-read-collaborative` aos escopos.
- Consequência: quem entrou antes precisa sair e entrar de novo; o app pede isso ao receber 403.

## ADR-012 — Sugestão de álbum via Last.fm (era a 2ª "ADR-005") — SUBSTITUÍDA (ver ADR-027)

- Data: 2026-10-20
- Contexto: Spotify removeu endpoints de recomendação e artistas relacionados.
- Decisão: Last.fm (artist.getSimilar + artist.getTopAlbums); Spotify só para achar e tocar o álbum.
- Alternativas: Claude API — sugestão melhor, mas custo por clique e chave a proteger.
- Consequência: motivo da sugestão é simples ("Parecido com X"); módulo src/suggest/ isolado permite trocar por LLM depois.

## ADR-013 — Sons ambiente gerados, chuva e lareira desligadas por padrão

- Data: 2026-10-20
- Contexto: T21 adiciona chuva e lareira ao chiado da agulha.
- Decisão: mesmo motor do chiado (`src/audio/loop.ts`), buffers de 8s gerados na hora com emenda suave no loop; chuva e lareira começam desligadas e tocam independente da música.
- Alternativas: arquivos de áudio gravados — mais realistas, mas pesam no repositório.
- Consequência: som sintético; se o navegador bloquear o áudio, ele retoma no próximo clique ou tecla.

## ADR-014 — Layout com palco + menu lateral recolhível

- Data: 2026-10-20
- Contexto: T18 pede o toca-discos como foco da tela.
- Decisão: grid 70/30; toca-discos medido em % de uma base 460×380 (escala com a largura, limitado pela altura da tela); estante vira painel modal (T19); estado do menu em `localStorage` (`vinil.sidebar`).
- Consequência: em telas largas e baixas, o limite de altura faz o toca-discos crescer pouco ao recolher o menu.

## ADR-015 — Faixas do disco: álbum por ID, playlist só se for minha

- Data: 2026-10-20
- Contexto: T20 mostra as faixas do disco no toca-discos.
- Decisão: `GET /albums/{id}` para álbuns; `GET /playlists/{id}/items` (até 50 faixas) para playlists; qualquer erro em playlist vira "Faixas indisponíveis." e mostra só a capa. Faixa atual destacada pelo `id` vindo de `/me/player`.
- Consequência: playlists de outras pessoas e contextos como "Músicas curtidas" não listam faixas.

## ADR-016 — PWA sem service worker

- Data: 2026-10-20
- Contexto: T24 pede instalar o app em janela própria.
- Decisão: só `manifest.webmanifest` (display "standalone") + ícones PNG 192/512 em `public/`; sem service worker, já que o Chrome/Edge atuais não exigem um para instalar e o app não funciona offline (depende do Spotify).
- Alternativas: service worker com cache (ex.: vite-plugin-pwa) — nova dependência e risco de servir versão velha.
- Consequência: o app instalado precisa do `npm run dev` rodando em 127.0.0.1:5173; o login abre o Spotify dentro da janela do app e volta para /callback.

## ADR-017 — Giro do prato com requestAnimationFrame (exceção ao "CSS puro")

- Data: 2026-10-20
- Contexto: T25 pede que o prato acelere (~1s) e desacelere (~1,5s) a partir do ângulo atual. Com animação CSS, ao retomar depois de uma pausa a capa "pula" de ângulo.
- Decisão: um loop `requestAnimationFrame` dentro do `Turntable` controla a velocidade (até 33⅓ rpm) e escreve `rotate()` direto no estilo do disco, sem re-render do React. Começa só depois do braço chegar e a agulha descer (1,2s). Com `prefers-reduced-motion`, não gira. O resto (braço, agulha, LED) continua em CSS; braço desenhado em SVG inline.
- Alternativas: só CSS — mais simples, mas com salto visível da capa.
- Consequência: única animação em JS do app; sem biblioteca.

## ADR-018 — Vitrola a partir de uma foto (substitui o desenho em CSS/SVG da T25)

- Data: 2026-10-20
- Contexto: o desenho em CSS/SVG não chegava ao realismo desejado; o Rafael escolheu uma foto de vitrola (vista de cima, madeira, tampa acrílica) para ser a vitrola.
- Decisão: a foto virou duas camadas em `src/assets/`: `turntable-base.png` (vitrola sem o braço; o vazio foi preenchido com textura vizinha — sulcos copiados do lado oposto do disco, madeira e base do braço por cópia/rotação) e `turntable-arm.png` (braço recortado: contrapeso, torre do cardan, tubo e cápsula). O braço gira pelo centro da torre: tocando = posição da foto (0°), parado = -14° (descanso, fora do disco e antes do botão 33/45). A capa do álbum gira por cima do selo da foto; os reflexos do disco ficam parados na foto. Só o desenho do braço é clicável (SVG transparente por cima).
- Alternativas: braço desenhado em SVG sobre a foto — não combinava com o estilo fotográfico.
- Consequência: a vitrola é igual nos dois temas (no escuro, `brightness(0.9)`); variáveis de cor da vitrola saíram do `theme.css`. A foto pode ter direitos de uso: ok para uso pessoal local, rever antes de publicar o repositório ou hospedar o app.

## ADR-019 — Tocar disco sempre em ordem, da faixa 1

- Data: 2026-10-20
- Contexto: o Spotify guarda o aleatório do último uso; `playDisc` só mandava o `context_uri`, então o álbum começava em ordem aleatória.
- Decisão: `playDisc` escolhe o dispositivo antes (ativo ou o primeiro disponível, sem restritos), desliga o shuffle, dá play com `offset.position: 0` e `position_ms: 0`, desliga o shuffle de novo e confere em `GET /me/player`; se `shuffle_state` ainda vier `true`, desliga mais uma vez e avisa no console. Vale para álbuns e playlists. Se o dispositivo ocioso recusar o primeiro shuffle, segue (o desligamento depois do play cobre).
- Consequência: tocar um disco faz 5 a 6 chamadas em vez de 1–3. Substitui, para `playDisc`, o fallback da ADR-006 (que continua valendo para `resume`). O aleatório fica desligado no Spotify depois de usar o vinil.

## ADR-020 — Volume pelo botão da vitrola, com estado compartilhado

- Data: 2026-10-20
- Contexto: T27 transforma o botão 33/45 da foto num controle de volume.
- Decisão: estado de volume extraído para `useVolume` (debounce 300 ms e "segurar" 2,5 s contra o polling, como na T16); App cria um só e passa ao slider do menu e ao `VolumeKnob`. O botão é CSS sobre o da foto (-135° = 0%, +135° = 100%), com arrastar, scroll e setas; as marcas 33/45 foram apagadas da foto e viraram "mín./máx." em CSS.
- Consequência: slider e botão sempre mostram o mesmo valor; mexer nos dois manda uma chamada só.

## ADR-021 — Marca Vinyl Player Simulator

- Data: 2026-10-20
- Contexto: T29; kit de marca em `vinyl-player-simulator-brand/` (ver BRAND.md).
- Decisão: arquivos do kit copiados para `public/` (substituem os ícones gerados na T24); logo no topo com as duas versões no HTML e o CSS mostrando a do tema; menu recolhido mostra só o símbolo; `--accent` = #E35634 nos dois temas, com texto #1E1B18 sobre ele (contraste ~5:1); `theme_color`/`background_color` #0A0A0A.
- Consequência: o fundo do app continua nos tons atuais; só o destaque e a marca mudaram.

## ADR-022 — Preparado para publicar na Vercel

- Data: 2026-10-20
- Contexto: T28; até aqui o app só rodava em 127.0.0.1 (ADR-002).
- Decisão: Redirect URI = `window.location.origin + "/callback"`; `vercel.json` reescreve rotas para `index.html`; variáveis documentadas no README.
- Consequência: cada origem (local e produção) precisa estar cadastrada no Spotify; abrir por `localhost` quebra o login (Spotify não aceita). Variáveis `VITE_*` ficam visíveis no bundle. Antes de publicar: rever direitos da foto da vitrola (ADR-018) e lembrar que em Development Mode só contas da allowlist entram.

## ADR-023 — Guardar o disco atual e importar com busca

- Data: 2026-10-21
- Contexto: T33 (★ ao lado do player) e T35 (busca no importador).
- Decisão: `src/library/currentDisc.ts` define o disco atual pelo contexto do player (álbum/playlist) ou, sem ele, pelo álbum da faixa; nada tocando = disco selecionado. Playlist tocada direto pelo Spotify chega só com o id: antes de guardar, busca nome/dono/capa em `GET /playlists/{id}` (se falhar, guarda como "Playlist"). `getMyPlaylists` passou a ler todas as páginas (50 por vez, até 40 páginas) uma vez ao abrir o importador; o filtro é local, sem acento e sem diferenciar maiúsculas.
- Consequência: abrir o importador faz uma chamada por página de playlists; playlists de terceiros podem ficar com nome genérico se o Spotify recusar o `GET /playlists/{id}` em Development Mode.

## ADR-024 — Chave do Last.fm só no servidor (proxy /api/lastfm) — REVERTIDA (ver ADR-026)

- Data: 2026-10-21
- Contexto: T31. Com `VITE_LASTFM_API_KEY`, a chave ia para o bundle e ficava visível para qualquer visitante do app publicado (ADR-022).
- Decisão: o navegador chama `/api/lastfm?method=…&artist=…&limit=…`; o servidor acrescenta `LASTFM_API_KEY` (sem prefixo `VITE_`) e repassa ao Last.fm. Lógica única em `api/_proxy.ts` (sem dependências), usada pela Vercel Function `api/lastfm.ts` (assinatura Web `GET(request) → Response`) e por um middleware no `vite.config.ts` para `npm run dev`/`preview`. Só `artist.getSimilar` e `artist.getTopAlbums` passam; `limit` limitado a 50; parâmetros extras do navegador (inclusive `api_key`) são ignorados; respostas boas com `s-maxage=86400` (cache da CDN); logs sem a chave. Servidor sem chave responde 500 `missing-key` e a UI mostra "configure LASTFM_API_KEY".
- Alternativas: manter a chave no cliente (só leitura, baixo risco) — mas qualquer um poderia usá-la e gastar a cota; backend separado — desnecessário para dois métodos.
- Consequência: primeira peça de servidor do projeto (ADR-002 previa backend só para contas). Não há rate limit próprio além do cache da CDN. A Vercel Function não foi testada em produção ainda; o `.env.local` precisa trocar `VITE_LASTFM_API_KEY` por `LASTFM_API_KEY`. `tsconfig` passou a incluir `api/`.

## ADR-025 — Layout de celular: vitrola no topo, menu em painel de baixo e barrinha

- Data: 2026-10-21
- Contexto: T36 (abaixo de 768px).
- Decisão: `useMediaQuery('(max-width: 767px)')` troca o layout. No celular a vitrola ocupa a largura toda; o menu vira painel fixo que sobe de baixo (CSS, até 85% da altura), com alça, "Fechar", fundo escurecido e Esc; começa sempre fechado, com estado próprio (não usa nem altera o "recolher menu" salvo do desktop). Fechado, fica montado e `inert` (os sons seguem tocando). Com o painel fechado, uma barrinha fixa mostra a faixa atual e ▶/❚❚; tocar no texto abre o painel. Áreas de toque ≥ 44px valem no celular e em qualquer tela `pointer: coarse` (tablets); o knob ganha área invisível de ~45px. Meta tags de app para iOS, `viewport-fit=cover` e margens de área segura; manifest com `id`.
- Alternativas: só ajustar o grid (menu empilhado embaixo da vitrola) — rolagem longa e controles longe da vitrola.
- Consequência: em 768px vale o layout de desktop. Verificado em 375px e 768px no Chrome headless com respostas do Spotify simuladas (sem rolagem horizontal; 0 alvos < 44px em 375px). Sem gesto de arrastar para fechar o painel. Instalar no celular exige HTTPS (deploy) — não testado em aparelho.

## ADR-026 — Reverter o proxy do Last.fm (volta a chave no cliente)

- Data: 2026-10-21
- Contexto: a T31 (ADR-024, proxy `/api/lastfm` com a chave no servidor) não funcionou no uso real.
- Decisão: voltar ao estado anterior: `src/suggest/lastfm.ts` chama o Last.fm direto com `VITE_LASTFM_API_KEY`; removidos `api/`, o middleware do `vite.config.ts`, `api` do `tsconfig` e a exceção `/api/*` do `vercel.json`; `.env.example` e README voltaram para `VITE_LASTFM_API_KEY`.
- Consequência: a chave do Last.fm volta a ir para o bundle e fica visível no app publicado (como na ADR-022). T31 volta a pendente.

## ADR-027 — Remover a sugestão de álbum

- Data: 2026-10-21
- Contexto: T41. A sugestão via Last.fm (ADR-012) dependia de uma chave exposta no navegador (ADR-026) e a tentativa de escondê-la no servidor não funcionou (ADR-024).
- Decisão: remover a função inteira: seção "Sugestão" do menu, componente `Suggestion`, `src/suggest/` (incl. a integração com o Last.fm) e seus testes; `VITE_LASTFM_API_KEY` sai do `.env.example` e do README. Substitui a ADR-012; ADR-024 e ADR-026 ficam só como histórico.
- Consequência: sem chave de terceiros no app; nenhuma chamada fora do Spotify. A T31 (chave no servidor) perde o objeto. Quem tinha `VITE_LASTFM_API_KEY` no `.env.local` pode apagar a linha.

## ADR-028 — Categorias da estante (formato v2 + migração) — SUBSTITUÍDA (ver ADR-032)

- Data: 2026-10-21
- Contexto: T38 — prateleiras por categoria.
- Decisão: estante em `localStorage['vinil.library']` = `{ version: 2, categories: [{id, name}], discs: [Disc + categoryId] }`; ordem dos arrays = ordem das prateleiras/discos (base para a T39). "Sem categoria" não é guardada: é `categoryId: null`, não pode ser renomeada/excluída e aparece por último (só se tiver discos). Nomes: obrigatórios, até 40 caracteres, únicos sem diferenciar acento/maiúsculas, "Sem categoria" reservado. Excluir categoria move os discos para `null`, na mesma ordem. Disco novo entra na frente, em "Sem categoria"; favoritar de novo mantém a categoria. Migração automática na 1ª leitura: `vinil.favorites` (v1) → v2 na mesma ordem, tudo em "Sem categoria"; a chave antiga fica como cópia de segurança e não é mais lida. Leitura defensiva descarta entradas inválidas/repetidas e solta discos de categoria inexistente. Lógica em `src/library/favorites.ts`; UI via `useFavorites`.
- Consequência: estante expandida com uma prateleira por categoria (criar/renomear/excluir com confirmação no painel; seletor de categoria sob cada capa); carrossel com chips de filtro ("Todas" por padrão, só na sessão). `vinil.favorites` pode ser apagada numa task futura.

## ADR-029 — Clicar num disco da estante abre os detalhes (não toca mais direto)

- Data: 2026-10-21
- Contexto: T40.
- Decisão: a capa grande + faixas do bloco "Disco" virou o componente `DiscInfo` (em `DiscDetails.tsx`), reaproveitado pelo novo `DiscDialog`. Clicar numa capa do carrossel ou da estante expandida abre o `DiscDialog` (sem trocar o disco da vitrola); ele tem "▶ Tocar" (mesma ação de baixar a agulha com esse disco: se já é o contexto pausado, retoma; se já toca, vira "Tocando"), "Remover da estante" e o seletor de categoria (`CategorySelect`, o mesmo de sob as capas). Abre por cima da estante, que continua aberta; Esc (capturado antes dos outros), clique fora e × fecham só o diálogo; "Tocar" fecha diálogo, estante e painel do celular. O botão ▶ sobre o disco selecionado (T17) continua tocando direto.
- Consequência: rótulo das capas mudou de "Colocar X no toca-discos" para "Abrir X". O App guarda só o id do disco aberto e lê da estante, então categoria/remoção refletem na hora e remover fecha o diálogo.

## ADR-030 — Arrastar para reorganizar a estante com @dnd-kit

- Data: 2026-10-21
- Contexto: T39 — reordenar discos na prateleira e mover entre prateleiras, com mouse, toque e teclado, sem quebrar o clique que abre os detalhes (T40).
- Decisão: dependências autorizadas `@dnd-kit/core@6.3.1` e `@dnd-kit/sortable@10.0.0` (versões fixas; `@dnd-kit/utilities` entra só como dependência interna da `sortable`). A regra fica em `src/library/favorites.ts`: `dropTarget` (alvo = outro disco → entra no lugar dele; alvo = prateleira `shelf:<id>` → fim dela) e `moveDiscTo`/`reorderDisc` (reposiciona no array global e troca a categoria), com testes. Na estante expandida, um `DndContext` envolve todas as prateleiras (uma `SortableContext` por prateleira + a prateleira inteira como alvo, para soltar em vazia/no fim). Sensores: mouse começa após 8px; toque após segurar ~0,2s (para arrastar o dedo continuar rolando); teclado com Espaço para pegar/soltar, setas para mover e Esc para cancelar (Enter segue abrindo os detalhes). Capa flutuante (`DragOverlay`) acompanha o ponteiro entre prateleiras; "Sem categoria" aparece durante o arrasto mesmo vazia. Avisos para leitor de tela em português. Clique logo após soltar e Esc durante o arrasto são ignorados pela estante.
- Alternativas: HTML5 drag-and-drop nativo — não funciona com toque nem teclado; implementação própria — mais código e acessibilidade pior.
- Consequência: bundle de 228 para 291 kB (+21 kB com gzip). Entre prateleiras não há "abrir espaço" ao vivo na prateleira de destino (a capa flutuante e o destaque da prateleira indicam onde vai cair). Carrossel segue a ordem da estante, que é a mesma do array. No uso com teclado, o deslocamento pelas setas depende das posições na tela (não testável no jsdom; coberto pela lógica de `dropTarget`/`moveDiscTo`).

## ADR-031 — Volume só pelo knob da vitrola

- Data: 2026-10-21
- Contexto: T42 — o slider de volume do menu duplicava o knob (ADR-020).
- Decisão: seção "Volume" sai do menu; `VolumeControl` fica no código, desligado por `SHOW_VOLUME_SLIDER = false` no `App.tsx` (trocar para `true` reativa, usando o mesmo `useVolume` do knob).
- Consequência: em dispositivo sem volume remoto o aviso do slider não aparece mais; o knob fica desabilitado (`aria-disabled`).

## ADR-032 — Etiquetas (várias por disco) no lugar de categoria única

- Data: 2026-10-21
- Contexto: T43. Categoria única + prateleira por categoria (ADR-028) era rígida: um disco não podia estar em "Jazz" e "Para trabalhar" ao mesmo tempo.
- Decisão: `vinil.library` v3 = `{ version: 3, discs: [Disc + tags: string[]] }`; a ordem do array é a ordem da estante e do carrossel. Não há lista de etiquetas guardada: `allTags` deriva dos discos (some quando ninguém usa), em ordem alfabética sem acento. Etiquetas sem duplicadas ignorando maiúsculas/acentos; vale a 1ª grafia na coleção; até 40 caracteres; "Sem etiqueta" reservado (filtro da T44). Migração automática: v2 → v3 com categoria → etiqueta e "Sem categoria" → nenhuma, na ordem da estante expandida da v2 (prateleira por prateleira, "Sem categoria" por último); o JSON v2 fica em `vinil.library.v2-backup`; v1 → v3 sem etiquetas. UI: estante expandida vira coleção única; saem "+ Nova categoria", renomear/excluir prateleira, seletores sobre as capas, `CategorySelect` e os chips de categoria do carrossel; nos detalhes do disco, `TagInput` (Enter adiciona/cria, × ou Backspace com campo vazio remove, autocompletar com `<datalist>` nativo). Etiquetas não aparecem nas capas. Arrastar (ADR-030) passa a um só `SortableContext`: só reordena (`moveDisc` = tirar e pôr na posição do outro), sem mover entre prateleiras.
- Consequência: substitui a ADR-028. O carrossel fica sem filtro até a T44. O autocompletar do `<datalist>` tem aparência do navegador.

## ADR-033 — Filtro por etiquetas (E entre as selecionadas)

- Data: 2026-10-21
- Contexto: T44.
- Decisão: regra em `src/library/favorites.ts`: `filterDiscs` mostra só os discos com TODAS as etiquetas marcadas (ignora maiúsculas/acentos); "Sem etiqueta" seleciona discos sem nenhuma (junto com outra etiqueta, não sobra ninguém); `filterOptions` = etiquetas em uso + "Sem etiqueta" (se houver disco sem); `activeFilter` descarta da seleção etiquetas que sumiram. O filtro fica no `App` (só na sessão) e é o mesmo na estante expandida e no carrossel (componente `TagFilter`), com contador "X de Y discos" e "Limpar filtro". Com filtro ativo o arrastar fica desligado (a ordem é da coleção inteira; reordenar um subconjunto seria ambíguo).
- Consequência: sem nenhuma etiqueta na estante, o filtro não aparece. "Expandir estante (N)" e o título da estante contam a coleção toda.

## ADR-034 — Estante expandida como móvel de madeira em CSS

- Data: 2026-10-21
- Contexto: T45 — dar à estante expandida cara de móvel (inspiração: estante de madeira escura com cornija, tábuas verticais, prateleiras grossas e divisória central). Feita na branch atual (sem `design-estante`), a pedido.
- Decisão: só gradientes CSS, sem imagens. Variáveis `--bookcase-*` no `theme.css` (nogueira escura no dark; um tom mais clara no light). O `Shelf` grande vira `Bookcase`: mede a largura (na montagem + `ResizeObserver`) e distribui os discos, na ordem da estante, em prateleiras × vãos (2 vãos; 1 abaixo de 768px), com mínimo de 2 prateleiras; as medidas (capa, vão, divisória) ficam no TS e vão para o CSS como variáveis. Itens viram `div role="listitem"` dentro de `role="list"` (os vãos quebram a lista), mantendo nomes acessíveis; o arrastar (dnd-kit) segue funcionando porque usa as posições na tela.
- Consequência: a lista pequena (`Shelf` sem `large`) segue igual. Se a largura não puder ser medida (ex.: jsdom), usa 1000px como padrão.

## ADR-035 — Cliente único com limite de requisições, polling adaptativo e cache

- Data: 2026-10-21
- Contexto: T46 — erro 429 ("muitas requisições"). Auditoria: polling fixo de 2s (30/min sempre, inclusive com a aba oculta e depois de um 429), detalhes de disco e busca sem cache, ~45–50 chamadas/min em uso normal; no 429 o polling seguia batendo e o limite nunca esvaziava.
- Decisão:
  - `src/spotify/client.ts` (`spotifyFetch`, reexportado por `api.ts`): ao receber 429, pausa **todas** as chamadas pelo `Retry-After` (padrão 5s), sem repetir na hora; GETs iguais em andamento são deduplicados (cada um recebe uma cópia da resposta); contador de chamadas/min no console em dev; erros logam método, URL, status e corpo.
  - `src/spotify/cache.ts`: faixas de álbum em memória + `localStorage` (`vinil.cache.album:<id>`), sem expirar; playlists (faixas, dados, minhas playlists) e busca por termo em memória, 10 min. Carregamentos simultâneos da mesma chave são compartilhados; erro não fica no cache.
  - Polling único: `NowPlayingProvider` (contexto) é o único que consulta `/me/player` — 5s tocando, 20s pausado, parado com a aba oculta (consulta ao voltar), 500ms após uma ação do usuário (tempo do Spotify refletir); próximo ciclo só depois do anterior terminar. A barra de progresso anda localmente entre consultas.
  - Busca: espera 400ms, mínimo 2 caracteres. Knob: envia ao soltar o arrasto ou após 300ms parado (rolagem/setas). `playDisc` reaproveita o dispositivo já conhecido pelo polling (sem listar dispositivos) e dispensa a consulta extra depois de tocar.
- Consequência: minuto simulado de uso normal (tocar, pausar, abrir estante e detalhes, buscar) = 18 chamadas (teste `usage.test.ts`); tocando parado ~12/min; pausado ~3/min; aba oculta 0. Pause/troca feita no app do Spotify aparece em até ~5s (antes 2s) — o teste da T08 foi ajustado. Regra registrada no CLAUDE.md: nada de polling próprio em componente; sempre pelo cliente único.

## ADR-036 — Display LCD da música atual e materiais do menu vintage

- Data: 2026-10-22
- Contexto: T49 — primeira task do menu vintage (branch menu-vintage). O bloco "Música atual" vira um display LCD antigo; as próximas tasks (T50–T53) precisam de madeira, metal, baquelite e papel coerentes entre si.
- Decisão: fontes OFL servidas localmente em `public/fonts/` (DSEG7 Classic v0.46 `.woff2` e VT323 `.ttf`, com as licenças ao lado), declaradas com `@font-face` no `theme.css` e `font-display: swap` (cai em monospace se não carregar); sem pacote npm nem Google Fonts. Materiais como variáveis no `theme.css` (`--wood*`, `--metal*`, `--bakelite*`, `--paper*`, `--lcd-*`), nos dois temas; o LCD é só em cinzas (dark: vidro quase preto; light: vidro cinza-claro com tinta grafite). Display em `NowPlaying.css`: moldura em relevo, linhas de varredura e reflexo por pseudo-elementos, tempo `mm:ss / mm:ss` em 7 segmentos com "88:88" apagado atrás, barra de 20 blocos (mantém `role="progressbar"`), título em letreiro rolante só quando não cabe (medido com `ResizeObserver`; parado com `prefers-reduced-motion`). Tempo e blocos usam o mesmo relógio local da T46 (sem chamadas extras).
- Consequência: +~158 kB em `public/fonts` (quase tudo o VT323 em `.ttf`, que o Google Fonts não publica em `.woff2` no repositório). Regras antigas `.now-playing*` saíram do `App.css`.

## ADR-037 — Disco num quadro de parede

- Data: 2026-10-22
- Contexto: T51 — miniatura e detalhes do disco viram um quadro de vinil (inspiração: moldura preta, passe-partout branco, capa à esquerda e o disco saindo pela direita).
- Decisão: componente `DiscFrame` (em `DiscDetails.tsx`, estilos em `DiscFrame.css`) com `size="small" | "large"`, usado na miniatura do bloco Disco e no `DiscInfo` (que também serve ao `DiscDialog` da estante). Só CSS: moldura com chanfro por gradiente, passe-partout com sombra interna, janela 1,5 : 1, vinil com sulcos (`repeating-radial-gradient`), brilho (`conic-gradient`) e selo feito com a própria capa como fundo (sem segunda `<img>`, então "Capa de X" continua único para leitores de tela). Medidas em % da largura, então o mesmo quadro escala da miniatura (150px) ao expandido (até 340px; 280px no menu). Cores em variáveis novas (`--frame-*`, `--mat*`, `--vinyl*`); no escuro o passe-partout é marfim para não ofuscar. No diálogo o quadro fica ao lado das faixas; no menu lateral, em cima.
- Consequência: a miniatura deixou de ser o quadradinho de 44px com borda; quando aberta, ganha contorno de destaque em volta do quadro. `formatTime` (T49) foi para `src/components/lcd.ts` para tirar um aviso de lint (fast refresh).

## ADR-038 — Carrossel da estante sobre prateleira de madeira

- Data: 2026-10-22
- Contexto: T52. A T50 (botões de madeira) ainda não foi feita; a "mesma madeira" é garantida pelas variáveis `--wood*` da T49, que os dois usam.
- Decisão: só CSS, sem mudar o markup. A tábua (tampo com veio + borda frontal) é o fundo do próprio trilho com rolagem, então fica parada enquanto as capas rolam; capas em pé alinhadas ao tampo, com sombra de contato (`li::after`). Disco atual: borda vermelha trocada por brilho quente na capa e um "spot" de luz no tampo (`li:has(.carousel__disc--selected)`). Setas viram puxadores de latão (`--brass*`); no toque mantêm a forma estreita, com área de toque invisível de 44px. Chips viram etiquetas de papel creme (ponta recortada com furinho, leve inclinação; marcada = papel mais envelhecido + carimbo ✓ em `--stamp`) — também na estante expandida, porque é o mesmo `TagFilter`. A barra de rolagem do trilho foi escondida (rolagem por setas, arrastar, roda/trackpad e toque).
- Consequência: o brilho do disco atual é contido (o trilho com rolagem corta o que passa da borda). `:has()` exige navegador atual; sem ele só some o spot no tampo.

## ADR-039 — Teclas do player em madeira, ícones em SVG

- Data: 2026-10-22
- Contexto: T50. Os ícones eram caracteres (⏮ ⏭ ▶ ❚❚ ★ ☆); ⏮/⏭ viram emoji colorido no macOS e não aceitam cor, então não dava para "gravá-los" em latão/creme.
- Decisão: `src/components/PlayerIcons.tsx` com SVGs inline (`fill: currentColor`, `aria-hidden`), usados só por `Controls` e `ShelfToggle`; nomes acessíveis e `aria-pressed` da estrela inalterados. Teclas em CSS: quadradas com cantos arredondados, madeira das variáveis `--wood*` (a mesma da prateleira da T52) com veio em gradiente, chanfro por sombras internas e "espessura" com sombra sólida embaixo; ícones em latão (`--brass`), play em creme (`--paper`) e maior (64px); entalhe com `drop-shadow` escuro em cima e claro embaixo. Pressionada: desce 3px, perde a espessura e ganha sombra interna. Foco com contorno `--focus`; desabilitada desbotada. Estrela: cheia em latão claro na estante, só contorno fora.
- Consequência: MiniPlayer (celular), botão ▶ sobre o disco e ☆ da busca seguem com caracteres (fora da T50; podem migrar na T53).

## ADR-040 — Menu lateral como painel de madeira (tokens trocados no escopo do menu)

- Data: 2026-10-22
- Contexto: T53 — harmonizar o restante do menu com a vitrola, o LCD (T49), as teclas (T50), o quadro (T51) e a prateleira (T52).
- Decisão: o `.deck__menu` é sempre madeira escura (um tom mais clara no tema light), com texto creme. Em vez de reescrever cada componente, o menu redefine os tokens de cor no próprio escopo (`--text`, `--muted`, `--panel`, `--border`, `--hover`, `--input-bg`, `--placeholder`, `--track-bg`, `--selected-bg`, `--focus`, `color-scheme: dark`); busca, listas, faixas e importador herdam. Títulos viram plaquinhas de metal escovado com parafusos e texto gravado; tema, tela cheia, Sair, "Recolher/☰ Menu", Importar/Expandir e Fechar (celular) viram teclas de baquelite que afundam; campos de busca, placa de baquelite afundada. Sons: o botão liga/desliga vira chave de alavanca com LED âmbar (só CSS, pseudo-elementos; texto e `aria-pressed` iguais) e os `range` viram faders (trilho afundado com escala, botão metálico). Variáveis novas: `--menu-*`, `--plate-ink`, `--led-on/off`. Contraste medido (WCAG): textos ≥ 4,95:1 em todos os pares; o laranja da marca como texto sobre madeira ficava em 3,2–4,3:1, então dentro do menu o destaque de texto (faixa atual, "tocando" e ★ da busca) usa o âmbar `--led-on` (≥ 4,6:1).
- Consequência: no tema light o menu continua escuro (contraste intencional com o palco claro). Estilo só em CSS; nenhum markup mudou. Fora do escopo: ▶ do MiniPlayer e do disco selecionado (fora do menu).

## ADR-041 — Console da foto: vitrola e tela do player numa imagem só

- Data: 2026-10-22
- Contexto: T55. Novo design (public/console/, coordenadas em CONSOLE.md): a foto do console já traz o prato, os painéis da tela, a moldura da capa e o corpo dos botões; o código só sobrepõe o que muda.
- Decisão: `Turntable` passa a usar `console-base.webp` (1673×940) e recebe a tela por `children`. Disco = `record.webp` com a capa no selo (31,5% em vez de 30% para cobrir o selo da imagem, um pouco fora do centro); o elemento interno gira (rAF da ADR-017) e o contêiner achata (`scaleY(0.925)`). Braço = `tonearm.webp`, pivô 75,95% 19,63%: -24° parado; tocando, `--arm-angle` de -6,75° a +16° pelo progresso do disco inteiro (faixas anteriores + tempo da atual, sobre a soma das durações, em `tonearm.ts`); sem a lista de faixas (ex.: playlist de terceiros), usa o progresso da faixa. Novo `Console` junta tudo: lê faixas com `useDiscTracks` (cache da T46) e o tempo com `useLocalProgress` (relógio local), sem chamadas novas; só ele re-renderiza a cada segundo. Tela: capa + vinil pequeno na janela, faixa/artista/álbum em Lora (woff2 variável, subconjunto latino, OFL, em `public/fonts`), barra e tempos, botões transparentes sobre os da foto com ícones SVG âmbar, `VolumeKnob` com `knob-cap.webp` (marcas mín./máx. removidas) e lista de faixas com rolagem interna. Tamanhos em `cqw`. A tela só mostra o Spotify quando ele toca o disco do prato; senão, o disco escolhido parado. A gaveta de discos da foto abre a estante. No desktop, Música atual, Player e Disco saem do menu; a ★ fica na seção "Disco atual" com "Tocando em" (o console não tem lugar para o dispositivo). No celular a tela fica pequena demais para ler e tocar: vira só leitura (sem os botões; o knob ganha área de toque de ~44px) e o menu mantém Música atual, Player e Disco.
- Consequência: `turntable-base.png`/`turntable-arm.png` (ADR-018) e o knob sobre o 33/45 (ADR-020) deixam de ser usados; o 33/45 da foto é só decoração. O LCD da T49 e as teclas de madeira da T50 só aparecem no celular. Os direitos de uso da nova foto também precisam ser revistos antes de publicar (como na ADR-018). Verificado em Chrome headless com dados simulados (tocando e parado).


## ADR-042 — Vitrola e player como camadas de uma imagem de console

- Data: 2026-10-22
- Contexto: redesign "console" (vitrola + tela + gaveta de discos); simular madeira/metal em CSS não chega no realismo desejado.
- Decisão: imagem base do console + camadas (disco, braço, knob) posicionadas em % num contêiner de proporção fixa; conteúdo dinâmico (player, faixas) em HTML sobre a tela já desenhada na imagem. Menu lateral só com Estante, Buscar, Importar e Sons. Referência visual: docs/design/console-design.png; posições: public/console/CONSOLE.md.
- Consequência: layout rígido por proporção; celular vai precisar de composição própria; mudar o visual exige reexportar as camadas.

## ADR-042 — Tela do console: ano, tocar a partir de uma faixa, ★ e dispositivo na tela

- Data: 2026-10-22
- Contexto: T56 — completar a tela do player do console (ADR-041) com o que faltava do aceite.
- Decisão: o ano vem de `item.album.release_date` na mesma resposta do `/me/player` (`NowPlaying.albumYear`), sem chamada nova; a tela mostra "Álbum (ano)" quando o Spotify toca o disco do prato (playlist e disco parado ficam sem ano). Cada linha da lista de faixas virou um botão ("Tocar faixa N: nome") que chama `playDisc(contexto, dispositivo, spotify:track:<id>)`: mesma sequência da ADR-019 (shuffle desligado antes e depois, `position_ms: 0`), mas com `offset: { uri }` em vez de `{ position: 0 }` — por uri porque a posição erra em álbuns com mais de um disco. Tocar a partir de uma faixa vale para o disco do prato (o mesmo ritual de baixar a agulha, ADR-007). O estado otimista já marca a faixa clicada até o próximo polling. A ★ de estante (`ShelfToggle`, agora com `className`) fica pequena no canto superior direito do bloco de texto e "Tocando em" numa linha pequena abaixo dos botões; com isso a seção "Disco atual" sai do menu no desktop.
- Consequência: no desktop o menu fica só com Estante, Buscar discos, Importar do Spotify e Sons. No celular nada mudou (fora do escopo por enquanto). Primeiro uso de `offset.uri` — não testado com o Spotify real.

## ADR-043 — Menu lateral pelo sistema de docs/design/MENU.md

- Data: 2026-10-22
- Contexto: T57. O menu ainda tinha a linguagem vintage da T53 (plaquinhas de metal, baquelite, papel, puxadores de latão, alavancas e faders), em desacordo com o console por imagem e com o design novo (docs/design/MENU.md e imagens).
- Decisão: tokens da tabela do MENU.md no `theme.css`, nos dois temas (`--surface`, `--surface-2`, `--border`, `--border-strong`, `--divider`, `--text`, `--muted` = texto 2, `--text-3`, `--amber`, `--amber-hover`, `--amber-text`, `--on-amber`, `--chip-active-bg`, `--amber-halo`); `--panel`, `--hover`, `--input-bg` e `--focus` passam a apontar para eles, então estante expandida e diálogos herdam. As cores da tela do console também viraram tokens (`--screen-*`). Estilo do menu num arquivo só (`Menu.css`), sem hex solto. Fontes Inter (variável, latino) e Lora (mesmo arquivo, agora declarado 400–700) em `public/fonts`. Menu com 400px: cabeçalho (recolher, avatar com iniciais + nome, tela cheia, tema, Sair; ícones SVG em `MenuIcons.tsx`), Estante (título + contador + setas redondas; chips com "Todas" — marcada sem filtro, limpa o filtro — e "Sem etiqueta" tracejado; capas de 76px com anel âmbar no disco atual e degradê no fim; "Abrir estante inteira"), Buscar discos (campo com lupa, foco âmbar com halo; linhas "artista · álbum/playlist", mantendo ☆ e ▶ pedidos pelo Rafael), Importar do Spotify (texto de apoio + "Importar playlists", único botão âmbar) e Sons ambiente (bloco recolhível com resumo do estado, interruptores `role="switch"` e volume com preenchimento âmbar). O "recolher" sai do palco e vai para o cabeçalho do menu; o "☰ Menu" do palco só aparece com o menu recolhido (ou no celular). No menu o contador do filtro vai para o título; na estante expandida continuam "X de Y discos" e "Limpar filtro". Os chips novos valem nos dois lugares; o móvel de madeira da estante expandida (T45) fica.
- Consequência: saem do menu madeira, plaquinhas, baquelite, papel, latão, alavancas e faders, e as variáveis sem uso (`--bakelite*`, `--metal*`, `--menu-*`, `--led-*`, `--plate-ink`, `--paper-aged`, `--paper-ink`, `--stamp`, `--shelf-light`, `--brass-dark`, `--track-bg`). O celular ficou fora (pedido): o painel de baixo ainda mostra o LCD, as teclas de madeira e a miniatura do disco, então as fontes DSEG7/VT323 e as variáveis `--wood*`, `--paper`, `--brass*` e `--lcd-*` continuam em uso. Rótulos mudaram: "Abrir estante inteira" (era "Expandir estante (N)"), "Importar playlists" (era "Importar do Spotify"), interruptores "Chiado"/"Chuva"/"Lareira" (eram botões "… ligado/desligado"), "Recolher menu" (era "Recolher menu ›").


## ADR-044 — "Sua coleção" no lugar da estante expandida

- Data: 2026-10-22
- Contexto: T58. A estante de móvel em CSS (T45, ADR-034) destoava do sistema do menu (ADR-043) e, com etiquetas (ADR-032), ficou difícil achar um disco numa coleção grande.
- Decisão: `ShelfPanel` vira `Collection` (`Collection.tsx`/`Collection.css`, só tokens do tema). Cabeçalho com "Sua coleção" + contador ("14 discos", ou "X de Y discos" com filtro/busca), busca local (nome/artista, sem acento; Esc com texto limpa, vazio fecha), seletor nativo "Organizar por" (Etiquetas | Artista | Adicionados recentemente | Minha ordem), os mesmos chips do carrossel (filtro compartilhado; "Todas" limpa) e fechar. Etiquetas (padrão): uma seção "Rock · 6" por etiqueta (A–Z, "Sem etiqueta" por último), capas numa linha com rolagem horizontal, e o disco aparece em cada uma das suas etiquetas; os outros modos são uma grade única. Arrastar (dnd-kit, ADR-030) só em "Minha ordem", sem filtro e sem busca. Capas com nome e artista embaixo; clicar abre o `DiscDialog`; botão tocar/pausar no hover/foco (sempre visível no toque), que toca aquele disco como "Tocar" (fecha a coleção) ou pausa se já é o que toca; disco tocando (contexto do Spotify) com anel âmbar. Lógica em `src/library/collection.ts` (`searchCollection`, `sortCollection`, `groupByTag`) e o modo salvo em `vinil.collection.sort`. Para "Adicionados recentemente", `ShelfDisc` ganha `addedAt` (ms), gravado ao guardar e mantido ao guardar de novo.
- Consequência: discos guardados antes da T58 não têm data e ficam no fim de "Recentes", na ordem da estante. Saem a estante de madeira (`Bookcase`, o componente `Shelf` que só ela usava, `.bookcase*`/`.shelf-panel*`, variáveis `--bookcase-*` e `--shelf-*`) e o "×" de remover sobre as capas (remover fica nos detalhes do disco). O fechar do `DiscDialog` passou a ser `icon-button`. O botão do menu continua "Abrir estante inteira". No celular a coleção ocupa a tela inteira. Verificado no Chrome headless com dados simulados (claro, escuro, 1440px e 375px sem rolagem horizontal).
