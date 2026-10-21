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

## ADR-012 — Sugestão de álbum via Last.fm

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

## ADR-024 — Chave do Last.fm só no servidor (proxy /api/lastfm)

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
